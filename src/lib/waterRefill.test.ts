import assert from 'node:assert/strict';
import test from 'node:test';
import * as friendlyFood from './friendlyFood';

test('water refill service has bilingual labels', () => {
  const label = friendlyFood.tagLabel as (tag: string, language: 'zh' | 'en') => string;
  assert.equal(label('water_refill_available', 'zh'), '提供飲水');
  assert.equal(label('water_refill_available', 'en'), 'Water Refill Available');
});

test('water refill store matches a friendly store only with supporting location evidence', () => {
  const match = (
    friendlyFood as typeof friendlyFood & {
      matchWaterRefillToFriendlyStore: (
        store: Record<string, unknown>,
        friendlyStores: Array<Record<string, unknown>>,
      ) => { matchedId?: string; confidence: string };
    }
  ).matchWaterRefillToFriendlyStore;

  assert.deepEqual(
    match(
      {
        nameZh: '太平洋商旅',
        addressZh: '臺北市信義區光復南路495號11樓',
        district: '信義區',
        longitude: 121.557,
        latitude: 25.032,
      },
      [
        {
          id: 'friendly_1',
          nameZh: '太平洋商旅',
          addressZh: '台北市信義區光復南路495號11樓',
          district: '信義區',
          longitude: 121.55701,
          latitude: 25.03201,
        },
      ],
    ),
    { matchedId: 'friendly_1', confidence: 'high' },
  );
});
