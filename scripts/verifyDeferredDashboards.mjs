import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.CIVIC_BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });
const tabs = ['overview', 'traceability', 'commercialDistricts', 'greenStores', 'hygieneGrading', 'failedInspections', 'agriculturalInspections', 'organicFarms', 'supermarkets', 'temporaryVendorMarkets'];
async function select(page, id) {
  await page.locator('.civic-launch').click();
  await page.locator(`[data-civic-tab="${id}"]`).click();
  const content = page.locator(id === 'overview' ? '.content .dashboard' : '.content h2').first();
  await content.waitFor();
  assert.ok((await content.innerText()).trim());
}
try {
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const page = await context.newPage();
  await page.route('**/*.tile.openstreetmap.org/**', route => route.abort());
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base);
  await page.locator('.leaflet-map').waitFor();
  const initial = await page.evaluate(() => performance.getEntriesByType('resource').map(entry => entry.name).filter(name => /\.js($|\?)/.test(name)));
  assert.ok(!initial.some(name => /Module-|Dashboard-/.test(name)), 'Secondary dashboard JS must stay outside initial map requests');
  for (const id of tabs) await select(page, id);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ check: 'deferred dashboards', initial, tabs, result: 'pass' }));
  await context.close();

  const offline = await browser.newContext({ serviceWorkers: 'allow' });
  const offlinePage = await offline.newPage();
  const offlineErrors = [];
  offlinePage.on('pageerror', error => offlineErrors.push(error.message));
  offlinePage.on('console', message => { if (message.type() === 'error') offlineErrors.push(message.text()); });
  offlinePage.on('requestfailed', request => offlineErrors.push(`${request.url()}: ${request.failure()?.errorText}`));
  await offlinePage.route('**/*.tile.openstreetmap.org/**', route => route.abort());
  await offlinePage.goto(base);
  await offlinePage.locator('.leaflet-map').waitFor();
  await offlinePage.evaluate(async () => {
    await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Service worker installation did not finish within 30 seconds')), 30000)),
    ]);
    if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
  });
  const cached = await offlinePage.evaluate(async () => (await caches.open('taipei-friendly-food-map-v12')).keys().then(keys => keys.map(key => key.url)));
  assert.ok(cached.some(url => /FoodTraceabilityModule-.*\.js$/.test(url)));
  assert.ok(cached.some(url => /TemporaryVendorMarketsModule-.*\.js$/.test(url)));
  await offline.setOffline(true);
  await offlinePage.reload();
  try { await offlinePage.locator('.leaflet-map').waitFor(); }
  catch (error) { console.log(JSON.stringify({ offlineErrors, body: await offlinePage.locator('body').innerText(), cached })); throw error; }
  // These modules' static records were already in the shell cache before splitting.
  const offlineTabs = ['traceability', 'commercialDistricts', 'greenStores', 'hygieneGrading', 'failedInspections', 'organicFarms', 'temporaryVendorMarkets'];
  for (const id of offlineTabs) await select(offlinePage, id);
  console.log(JSON.stringify({ check: 'offline unvisited tabs after installation and reload', tabs: offlineTabs, cachedAssets: cached.filter(url => /\.(js|css)$/.test(url)).length, result: 'pass' }));
  await offline.close();
} finally {
  await browser.close();
}
