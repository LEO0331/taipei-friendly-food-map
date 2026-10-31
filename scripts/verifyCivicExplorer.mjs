import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

// Use an existing Playwright installation. No project dependency is added.
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, 'doc/civic-explorer');
mkdirSync(output, { recursive: true });
const base = process.env.CIVIC_BASE_URL || 'http://127.0.0.1:4173';
const results = [], errors = [], network = {};
const browser = await chromium.launch({ headless: true });
const ids = ['map','directory','overview','traceability','hygieneGrading','failedInspections','policy11','agriculturalInspections','commercialDistricts','greenStores','organicFarms','temporaryVendorMarkets','supermarkets','notes'];
const groups = ['Explore Taipei','Food & Products','Stores & Facilities','About the Data'];
const tile = '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#e7eee5"/><path d="M0 128H256M128 0V256" stroke="#cbd7ca"/><text x="12" y="24" fill="#53675b" font-size="12">Map tile placeholder</text></svg>';
async function setup(options = {}) {
  const context = await browser.newContext({ viewport:{width:1440,height:1000}, serviceWorkers:'block', ...options });
  await context.addInitScript(() => {
    window.__geoCalls = 0; window.__geoMode = 'success';
    Object.defineProperty(navigator, 'geolocation', { configurable:true, value: {
      getCurrentPosition(success, failure) {
        window.__geoCalls++;
        if (window.__geoMode === 'denied') failure({code:1});
        else success({coords:{latitude:25.043341,longitude:121.563452}});
      },
    }});
  });
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*.tile.openstreetmap.org/**', r => r.fulfill({status:200,contentType:'image/svg+xml',body:tile}));
  await page.goto(base); await page.locator('.leaflet-map').waitFor();
  return {page,context};
}
async function check(name, fn) {
  await fn(); results.push({name,result:'pass'}); console.log('PASS '+name);
}
const open = async p => { await p.locator('.civic-launch').click(); await p.locator('.civic-explorer').waitFor(); };
const close = async p => { await p.locator('.civic-dialog-header button').click(); assert.equal(await p.locator('dialog').evaluate(e=>e.open),false); };
const active = p => p.locator('.secondary-tabs [aria-current="page"]');
const snapshot = p => p.locator('.controls').evaluate(e => [...e.querySelectorAll('input, select, .tag-filter-list button')].map(el => ({type:el.type, value:el.value, checked:el.checked, active:el.classList.contains('active')})));
try {
  const {page,context} = await setup();
  const requests=[]; page.on('request',r=>requests.push(r.url()));
  await check('map is default; optional Explorer and Policy 11 are absent from initial resources', async()=>{
    assert.equal(await active(page).innerText(),'友善地圖');
    assert.equal(await page.locator('.civic-explorer').count(),0);
    const urls=await page.evaluate(()=>performance.getEntriesByType('resource').map(e=>e.name));
    assert.ok(!urls.some(u=>/CivicExplorer|Policy11Module|policy-11/.test(u)));
    assert.equal(await page.evaluate(()=>window.__geoCalls),0);
    network.initial=urls;
    await page.screenshot({path:resolve(output,'map-default-desktop.png')});
  });
  await check('first opening fetches only optional JS/CSS; no data, tiles or geolocation requests',async()=>{
    await page.waitForTimeout(250); requests.length=0; await open(page); await page.waitForTimeout(100);
    network.firstOpen=[...requests];
    assert.ok(requests.length>=2); assert.ok(requests.every(u=>/\/assets\/CivicExplorer-.*\.(js|css)$/.test(u)));
    assert.equal(await page.evaluate(()=>window.__geoCalls),0);
    assert.equal(await page.locator('.civic-hub').count(),4);
    assert.equal(await page.locator('[data-civic-tab]').count(),14);
    assert.deepEqual(await page.locator('[data-civic-tab]').evaluateAll(es=>es.map(e=>e.dataset.civicTab)), ids);
    await page.screenshot({path:resolve(output,'explorer-desktop-zh.png')});
  });
  await check('native dialog has name, focus containment, Escape and entry focus restoration',async()=>{
    assert.equal(await page.getByRole('dialog',{name:'城市資料探索',exact:true}).count(),1);
    await page.locator('.civic-source button').focus(); await page.keyboard.press('Tab');
    // Native modal traversal may visit browser chrome (reported as body), but never host controls.
    for(let i=0;i<18;i++) {
      assert.equal(await page.evaluate(()=>document.activeElement===document.body || document.querySelector('dialog').contains(document.activeElement)),true);
      await page.keyboard.press('Tab');
    }
    await page.locator('.civic-dialog-header button').focus();
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(()=>document.activeElement===document.body || document.querySelector('dialog').contains(document.activeElement)),true);
    await page.evaluate(()=>document.querySelector('.controls input').focus());
    assert.equal(await page.locator('.controls input').first().evaluate(e=>e===document.activeElement),false);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.civic-launch').evaluate(e=>e===document.activeElement),true);
    assert.equal(await page.locator('.civic-dialog').evaluate(e=>e.open),false);
  });
  await check('Chinese/English labels, bilingual search, category results, keyboard activation and reset',async()=>{
    await page.getByRole('button',{name:'EN',exact:true}).click(); await open(page);
    assert.deepEqual(await page.locator('.civic-hub > span').allTextContents(),groups.map((g,i)=>`0${i+1} / ${g}`));
    const search=page.getByRole('searchbox',{name:'Search modules'});
    await search.fill('超級市場'); assert.equal(await page.locator('[data-civic-tab]').count(),1);
    assert.equal(await page.locator('[data-civic-tab]').getAttribute('data-civic-tab'),'supermarkets');
    await search.fill('  POLICY11 '); assert.equal(await page.locator('[data-civic-tab]').getAttribute('data-civic-tab'),'policy11');
    await search.fill('no-such-module-xyz'); assert.equal(await page.locator('[data-civic-tab]').count(),0);
    await page.getByRole('button',{name:'Show all',exact:true}).click();
    assert.equal(await search.evaluate(e=>e===document.activeElement),true);
    await page.locator('.civic-hub').nth(1).focus(); await page.keyboard.press('Enter');
    assert.equal(await page.locator('[data-civic-tab]').count(),5);
    assert.equal(await page.locator('.civic-result-header h3').evaluate(e=>e===document.activeElement),true);
    assert.equal(await page.locator('.civic-result-header h3').innerText(),'Food & Products');
    await page.getByRole('button',{name:'Show all',exact:true}).click();
    await page.getByRole('button',{name:'List mode',exact:true}).click();
    assert.equal(await page.locator('.civic-hub').count(),0); assert.equal(await page.locator('[data-civic-tab]').count(),14);
    await page.screenshot({path:resolve(output,'explorer-list-en.png')});
    await page.getByRole('button',{name:'List mode',exact:true}).click();
    await page.screenshot({path:resolve(output,'explorer-desktop-en.png')}); await close(page);
  });
  await check('all 14 module links use existing activeTab navigation and preserve existing source paths',async()=>{
    for (const id of ids) {
      await open(page); const link=page.locator(`[data-civic-tab="${id}"]`); const label=await link.innerText();
      await link.click();
      assert.equal(await page.locator('dialog').evaluate(e=>e.open),false);
      assert.equal((await active(page).innerText()).trim(),label.replace('↗','').trim());
      if(id==='map') await page.locator('.leaflet-map').waitFor();
      if(id==='policy11') { await page.locator('.policy11').waitFor(); }
    }
    // Source shortcut is available independently of catalogue selection.
    await open(page); await page.locator('.civic-source button').click();
    assert.equal(await active(page).innerText(),'Data Notes');
    await page.locator('.primary-tabs button').first().click(); await page.locator('.leaflet-map').waitFor();
  });
  await check('filters, layers, district, keyword, service tag and successful location survive open/close',async()=>{
    await page.getByRole('button',{name:'繁中',exact:true}).click();
    await page.locator('.controls .search-field input').fill('采芊');
    await page.locator('.district-field select').selectOption('信義區');
    await page.locator('.minimum-field input').fill('1');
    await page.locator('.layer-fieldset input').nth(1).uncheck();
    await page.locator('.layer-fieldset input').nth(2).check();
    await page.locator('.tag-filter-list button').first().click();
    await page.locator('.nearby-button').first().click();
    await page.locator('.user-marker').waitFor();
    const filters=await snapshot(page); const calls=await page.evaluate(()=>window.__geoCalls);
    await open(page); await close(page);
    assert.deepEqual(await snapshot(page),filters); assert.equal(await page.evaluate(()=>window.__geoCalls),calls);
    assert.equal(await page.locator('.user-marker').count(),1);
    network.filterState=filters;
  });
  await check('selected store, live map, marker nodes, popup and viewport survive without rebuilding or refetching',async()=>{
    await page.locator('.secondary-tabs button').nth(1).click();
    await page.locator('.store-card').first().getByRole('button').first().click();
    await page.locator('.leaflet-map').waitFor(); await page.waitForTimeout(900);
    await page.locator('.friendly-marker,.matched-marker').first().focus(); await page.keyboard.press('Enter'); await page.locator('.leaflet-popup').waitFor(); await page.waitForTimeout(400); // Settle Leaflet popup auto-pan before viewport comparison.
    const popup=await page.locator('.leaflet-popup').innerText(); const filters=await snapshot(page);
    await page.evaluate(()=>{
      window.__map=document.querySelector('.leaflet-map');
      window.__marker=document.querySelector('.friendly-marker,.matched-marker');
      window.__pane=document.querySelector('.leaflet-map-pane').style.transform;
      window.__removedMarkers=0;
      window.__observer=new MutationObserver(changes=>{ for(const c of changes) for(const n of c.removedNodes) if(n instanceof Element && (n.matches('.leaflet-marker-icon') || n.querySelector('.leaflet-marker-icon'))) window.__removedMarkers++; });
      window.__observer.observe(window.__map,{childList:true,subtree:true});
    });
    requests.length=0; await open(page); await close(page); await page.waitForTimeout(100);
    const unchanged=await page.evaluate(()=>({map:window.__map===document.querySelector('.leaflet-map'),marker:window.__marker.isConnected,pane:window.__pane===document.querySelector('.leaflet-map-pane').style.transform,removed:window.__removedMarkers}));
    assert.deepEqual(unchanged,{map:true,marker:true,pane:true,removed:0});
    assert.equal(await page.locator('.leaflet-popup').innerText(),popup); assert.deepEqual(await snapshot(page),filters);
    assert.deepEqual(requests,[]); network.reopen=[...requests]; network.mapPreservation=unchanged;
    await page.screenshot({path:resolve(output,'map-preserved-popup.png')});
  });
  await check('location denial is retained; opening Explorer never retries geolocation',async()=>{
    await page.evaluate(()=>window.__geoMode='denied'); await page.locator('.nearby-button').first().click();
    const error=await page.locator('.error-copy').innerText(),calls=await page.evaluate(()=>window.__geoCalls);
    await open(page); await close(page);
    assert.equal(await page.locator('.error-copy').innerText(),error); assert.equal(await page.evaluate(()=>window.__geoCalls),calls);
    assert.equal(await page.locator('.user-marker').count(),1);
  });
  await context.close();
  const mobile=await setup({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await check('mobile 390px and 320px, visible labels, 44px targets and reduced-motion hover',async()=>{
    await open(mobile.page);
    await mobile.page.screenshot({path:resolve(output,'explorer-mobile-zh.png')});
    for(const width of [390,320]) {
      await mobile.page.setViewportSize({width,height:844});
      assert.equal(await mobile.page.locator('.civic-dialog').evaluate(e=>e.scrollWidth<=e.clientWidth),true);
      assert.equal(await mobile.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      const sizes=await mobile.page.locator('.civic-dialog button,.civic-dialog input').evaluateAll(es=>es.map(e=>e.getBoundingClientRect()).filter(r=>r.width&&r.height).map(r=>({width:r.width,height:r.height})));
      assert.ok(sizes.every(r=>r.height>=44&&r.width>=44));
      const hub=mobile.page.locator('.civic-hub').first(); await hub.hover();
      assert.deepEqual(await hub.locator('.civic-lift').evaluate(e=>({transform:getComputedStyle(e).transform,duration:getComputedStyle(e).transitionDuration})),{transform:'none',duration:'0s'});
    }
    await mobile.page.setViewportSize({width:390,height:844});
    await mobile.page.keyboard.press('Escape');
    await mobile.page.getByRole('button',{name:'EN',exact:true}).click(); await open(mobile.page);
    await mobile.page.screenshot({path:resolve(output,'explorer-mobile-en.png')});
    await mobile.page.setViewportSize({width:320,height:844});
    assert.equal(await mobile.page.locator('.civic-dialog').evaluate(e=>e.scrollWidth<=e.clientWidth),true);
    await mobile.page.screenshot({path:resolve(output,'explorer-320-en.png')});
    await mobile.page.getByRole('button',{name:'List mode',exact:true}).click();
    await mobile.page.locator('[data-civic-tab="notes"]').focus(); await mobile.page.keyboard.press('Enter');
    assert.equal(await active(mobile.page).innerText(),'Data Notes');
  });
  await mobile.context.close();
  const failure=await setup();
  await check('failed lazy chunk stays contained and existing map/navigation remain usable',async()=>{
    await failure.page.route('**/assets/CivicExplorer-*.js',r=>r.abort());
    await failure.page.locator('.civic-launch').click(); await failure.page.getByRole('alert').waitFor();
    await close(failure.page); assert.equal(await failure.page.locator('.leaflet-map').count(),1);
    await failure.page.locator('.secondary-tabs button').nth(1).click(); assert.equal(await active(failure.page).innerText(),'店家清單');
  });
  await failure.context.close();
  // React reports the intentionally failed chunk to pageerror once; keep it explicit.
  const unexpected=errors.filter(e=>!e.includes('Failed to fetch dynamically imported module'));
  assert.deepEqual(unexpected,[]); results.push({name:'no unexpected browser errors',result:'pass'});
  const assets=readdirSync(resolve(root,'dist/assets')).map(name=>{const b=readFileSync(resolve(root,'dist/assets',name));return {name,bytes:b.length,gzip:gzipSync(b).length};});
  if (existsSync(resolve(output,'browser-failure.json'))) unlinkSync(resolve(output,'browser-failure.json'));
  const baseline=JSON.parse(readFileSync(resolve(output,'baseline.json'),'utf8'));
  const assetDelta=(prefix,ext)=>{const before=baseline.assets.find(a=>a.name.startsWith(prefix)&&a.name.endsWith(ext));const after=assets.find(a=>a.name.startsWith(prefix)&&a.name.endsWith(ext));return {before,after,deltaBytes:after.bytes-before.bytes,deltaGzip:after.gzip-before.gzip};};
  writeFileSync(resolve(output,'browser-results.json'),JSON.stringify({status:'pass',checks:results,network,expectedChunkFailureErrors:errors,assets,deltas:{mainJS:assetDelta('index-','.js'),mainCSS:assetDelta('index-','.css')},environment:{browser:'bundled Playwright Chromium',serviceWorker:'blocked for deterministic request assertions',tiles:'external images replaced with labelled neutral SVG; actual app records/markers retained',geolocation:'deterministic stub; no operating-system permission requested'},limitations:['No pre-existing browser suite is configured. This script adds focused production-browser checks.','Keyboard/DOM accessibility assertions and visual review; no automated WCAG scanner or screen-reader session.','External tile-provider availability and real device geolocation are outside this deterministic run.']},null,2)+'\n');
} catch(error) {
  writeFileSync(resolve(output,'browser-failure.json'),JSON.stringify({checks:results,error:String(error),stack:error.stack,errors},null,2)+'\n');
  throw error;
} finally { await browser.close(); }
