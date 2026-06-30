import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import type {
  TaipeiFoodTraceabilityProductDetail,
  TaipeiFoodTraceabilitySearchItem,
  TaipeiFoodTraceabilitySummary,
} from '../types';

test('food traceability generated data stays indexed and chunked', async () => {
  const [summary, searchIndex, manifest] = await Promise.all([
    readFile('public/data/food-traceability/summary.json', 'utf8').then(
      (text) => JSON.parse(text) as TaipeiFoodTraceabilitySummary,
    ),
    readFile('public/data/food-traceability/search-index.json', 'utf8').then(
      (text) => JSON.parse(text) as TaipeiFoodTraceabilitySearchItem[],
    ),
    readFile('public/data/food-traceability/chunk-manifest.json', 'utf8').then(
      (text) => JSON.parse(text) as Record<string, string>,
    ),
  ]);

  assert.equal(summary.totalRows, 42947);
  assert.equal(searchIndex.length, summary.productCount);
  assert.ok(searchIndex[0]?.detailChunkId);
  assert.equal(manifest[searchIndex[0].productKey], searchIndex[0].detailChunkId);

  const detail = await readFile(
    `public/data/food-traceability/product-details/${searchIndex[0].detailChunkId}`,
    'utf8',
  ).then((text) => JSON.parse(text) as TaipeiFoodTraceabilityProductDetail[]);
  assert.ok(detail.some((item) => item.productKey === searchIndex[0].productKey));
});
