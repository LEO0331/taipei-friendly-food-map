import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Run against npm run preview; reuse an installed Playwright package.
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.CIVIC_BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ serviceWorkers: 'block' });
let releaseFirst;
try {
  await page.route('**/*.tile.openstreetmap.org/**', route => route.abort());
  await page.goto(base);
  await page.locator('.leaflet-map').waitFor();
  await page.locator('.primary-tabs button').nth(1).click();
  const cards = page.locator('.traceability-results .store-card');
  await cards.first().waitFor();
  const first = await cards.nth(0).locator('h3').innerText();
  const second = await cards.nth(1).locator('h3').innerText();
  assert.notEqual(first, second);
  const gate = new Promise(resolve => { releaseFirst = resolve; });
  let firstRequested;
  const requested = new Promise(resolve => { firstRequested = resolve; });
  let firstDelivered;
  const delivered = new Promise(resolve => { firstDelivered = resolve; });
  let requestCount = 0;
  await page.route('**/product-details/chunk-*.json', async route => {
    const ordinal = ++requestCount;
    const chunk = new URL(route.request().url()).pathname.split('/product-details/')[1];
    assert.match(chunk, /^chunk-\d+\.json$/);
    const body = readFileSync(fileURLToPath(new URL(`../public/data/food-traceability/product-details/${chunk}`, import.meta.url)), 'utf8');
    if (ordinal === 1) { firstRequested(); await gate; }
    await route.fulfill({ status: 200, contentType: 'application/json', body });
    if (ordinal === 1) firstDelivered();
  });
  await cards.nth(0).locator('button').click();
  await requested;
  await cards.nth(1).locator('button').click();
  await page.waitForFunction(expected => document.querySelector('.product-detail h2')?.textContent === expected, second);
  const firstFinished = page.waitForResponse(response => response.url().includes('/product-details/') && response.request().url().endsWith('.json'));
  releaseFirst();
  await delivered;
  await (await firstFinished).finished();
  // Allow fetch parsing and the React update to commit after the old response.
  await page.waitForTimeout(250);
  assert.equal(await page.locator('.product-detail h2').innerText(), second, 'An older response must not replace the last selected product');
  assert.equal(requestCount, 2);
  console.log('PASS: out-of-order product details retain the last selected product');
} finally {
  releaseFirst?.();
  await browser.close();
}
