import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { buildThirdPartyNotices } from './buildThirdPartyNotices.mjs';

test('distribution notices retain every locked runtime license text and copied geometry attribution', async () => {
  const output = await buildThirdPartyNotices();
  const inventory = JSON.parse(output.inventory);
  const lock = JSON.parse(await readFile(new URL('../package-lock.json', import.meta.url), 'utf8'));
  const runtime = Object.entries(lock.packages).filter(([path, entry]) => path.includes('node_modules/') && !entry.dev).map(([path]) => path).sort();
  assert.deepEqual(inventory.packages.map(item => item.path).sort(), runtime);
  for (const item of inventory.packages) for (const notice of item.notices) {
    const bytes = await readFile(new URL(`../${item.path}/${notice.file}`, import.meta.url));
    assert.ok(output.notices.includes(bytes.toString('utf8')), `Original license text missing: ${item.name}`);
    assert.equal(notice.sha256, createHash('sha256').update(bytes).digest('hex'));
  }
  assert.equal(inventory.packages.find(item => item.name === 'react-leaflet').license, 'Hippocratic-2.1');
  assert.equal(inventory.packages.find(item => item.name === 'leaflet').license, 'BSD-2-Clause');
  assert.ok(output.notices.includes('Copyright (c) 2026 LeoChen'));
  assert.ok(output.notices.includes('THE SOFTWARE IS PROVIDED "AS IS"'));
  assert.equal(await readFile(new URL('../public/THIRD_PARTY_NOTICES.txt', import.meta.url), 'utf8'), output.notices);
  assert.equal(await readFile(new URL('../public/third-party-licenses.json', import.meta.url), 'utf8'), output.inventory);
});
