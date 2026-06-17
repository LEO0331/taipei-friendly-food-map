import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createRestaurantFriendlyStoreMatcher,
  parseFriendlyServiceCounts,
  parseFriendlyServiceTags,
  sanitizeExternalUrl,
  validateTaipeiCoordinate,
} from './friendlyFood';
import type { FriendlyStore, RestaurantBusiness } from '../types';

const baseStore: FriendlyStore = {
  id: 'friendly_1',
  layer: 'friendly_store',
  nameZh: '測試咖啡',
  addressZh: '台北市大安區測試路1號',
  district: '大安區',
  longitude: 121.543,
  latitude: 25.033,
  coordinateStatus: 'valid',
  serviceTags: [],
  serviceTagCounts: {
    english_friendly: 0,
    japanese_friendly: 0,
    korean_friendly: 0,
    mobile_charging: 0,
    accessibility_friendly: 0,
    gender_friendly: 0,
    convenient_payment: 0,
    vegetarian_friendly: 0,
    friendly_bathroom: 0,
    fair_trade_friendly: 0,
    free_wifi: 0,
    bicycle_friendly: 0,
    parent_child_friendly: 0,
    muslim_friendly: 0,
    period_friendly: 0,
  },
  totalFriendlyItems: 0,
  source: 'test',
};

test('validateTaipeiCoordinate classifies valid, missing, and outlier coordinates', () => {
  assert.equal(validateTaipeiCoordinate(121.56, 25.04), 'valid');
  assert.equal(validateTaipeiCoordinate(undefined, 25.04), 'missing');
  assert.equal(validateTaipeiCoordinate(120.5, 25.04), 'outlier');
});

test('parseFriendlyServiceTags includes only positive numeric count fields', () => {
  const row = {
    '英文友善（count）': '1',
    '日文友善（count）': '0',
    '韓文友善（count）': '',
    '行動裝置充電（count）': 'not-a-number',
    'Free WiFi（count）': '2',
  };
  const counts = parseFriendlyServiceCounts(row);
  assert.equal(counts.english_friendly, 1);
  assert.equal(counts.free_wifi, 2);
  assert.equal(counts.mobile_charging, 0);
  assert.deepEqual(parseFriendlyServiceTags(row), ['english_friendly', 'free_wifi']);
});

test('sanitizeExternalUrl permits only http and https URLs', () => {
  assert.equal(sanitizeExternalUrl('https://example.com/path'), 'https://example.com/path');
  assert.equal(sanitizeExternalUrl('http://example.com/path'), 'http://example.com/path');
  assert.equal(sanitizeExternalUrl('javascript:alert(1)'), undefined);
  assert.equal(sanitizeExternalUrl('not a url'), undefined);
});

test('createRestaurantFriendlyStoreMatcher preserves conservative high-confidence matching', () => {
  const matchRestaurant = createRestaurantFriendlyStoreMatcher([baseStore]);
  const restaurant: RestaurantBusiness = {
    id: 'restaurant_1',
    layer: 'registered_restaurant_business',
    name: '測試咖啡股份有限公司',
    address: baseStore.addressZh,
    longitude: 121.54301,
    latitude: 25.03301,
    coordinateStatus: 'valid',
    source: 'test',
  };

  assert.deepEqual(matchRestaurant(restaurant), {
    matchedFriendlyStoreId: baseStore.id,
    matchConfidence: 'high',
  });
});
