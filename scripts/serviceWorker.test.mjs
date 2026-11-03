import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

test('actual worker activation removes only legacy food caches and retains every foreign cache', async () => {
  const handlers = {};
  const deleted = [];
  const keys = ['taipei-friendly-food-map-v1', 'taipei-friendly-food-map-v11', 'taipei-friendly-food-map-v12',
    'taipei-friendly-food-map-v13', 'taipei-friendly-food-map-vendor', 'taipei-crash-map-v5',
    'taipei-safety-map-v3', 'portfolio-v4', 'unrelated-cache', ''];
  let claimed = false;
  runInNewContext(readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8'), {
    URL,
    self: { registration: { scope: 'https://example.test/taipei-friendly-food-map/' },
      addEventListener: (name, handler) => { handlers[name] = handler; },
      clients: { claim: async () => { claimed = true; } } },
    caches: { keys: async () => keys, delete: async key => { deleted.push(key); return true; } },
  });
  let completion;
  handlers.activate({ waitUntil: promise => { completion = promise; } });
  await completion;
  assert.deepEqual(deleted, ['taipei-friendly-food-map-v1', 'taipei-friendly-food-map-v11', 'taipei-friendly-food-map-v12']);
  assert.equal(claimed, true);
});
