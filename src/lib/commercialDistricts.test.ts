import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import type {
  CommercialDistrictIntroductionRecord,
  CommercialDistrictIntroductionSummary,
} from '../types';

test('commercial district generated data keeps source rows and district summaries', async () => {
  const [records, summary] = await Promise.all([
    readFile('public/data/commercial-district-introductions.json', 'utf8').then(
      (text) => JSON.parse(text) as CommercialDistrictIntroductionRecord[],
    ),
    readFile('public/data/commercial-district-introduction-summary.json', 'utf8').then(
      (text) => JSON.parse(text) as CommercialDistrictIntroductionSummary,
    ),
  ]);

  assert.equal(records.length, 65);
  assert.equal(summary.totalRecords, records.length);
  assert.ok(summary.byDistrict.some((item) => item.district === '大同區'));
  assert.ok(records.some((record) => record.districtTagCategory === 'food'));
  assert.ok(records.some((record) => record.nearbyMrtStationNames.length > 0));
  assert.equal(records.some((record) => record.locationPrecision === 'exact'), false);
});
