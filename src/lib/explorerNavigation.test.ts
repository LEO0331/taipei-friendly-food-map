import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MainTabs } from '../components/MainTabs';
import { navigationGroups, navigationTabs, type TabKey, type NavigationGroup } from '../data/navigation';
import { translations } from '../data/translations';
import { searchNavigation } from './explorerNavigation';

// Independent contract captured from MainTabs on origin/main ebed796 before extraction.
const expected = {
  map: 'explore', directory: 'explore', overview: 'explore',
  traceability: 'foodProducts', hygieneGrading: 'foodProducts', failedInspections: 'foodProducts',
  policy11: 'foodProducts', agriculturalInspections: 'foodProducts',
  commercialDistricts: 'facilities', greenStores: 'facilities', organicFarms: 'facilities',
  temporaryVendorMarkets: 'facilities', supermarkets: 'facilities', notes: 'about',
} satisfies Record<TabKey, NavigationGroup>;

test('four hubs retain every existing TabKey exactly once with original groups and defaults', () => {
  assert.deepEqual(navigationGroups.map(group => group.key), ['explore', 'foodProducts', 'facilities', 'about']);
  assert.deepEqual(navigationTabs.map(tab => tab.key), Object.keys(expected));
  assert.equal(new Set(navigationTabs.map(tab => tab.key)).size, 14);
  for (const tab of navigationTabs) assert.equal(tab.group, expected[tab.key]);
  assert.deepEqual(navigationGroups.map(group => navigationTabs.find(tab => tab.group === group.key)?.key),
    ['map', 'traceability', 'commercialDistricts', 'notes']);
});

test('all tab and group labels remain available in Chinese and English', () => {
  for (const locale of ['zh', 'en'] as const) {
    for (const item of [...navigationGroups, ...navigationTabs]) assert.ok(translations[locale][item.label].trim());
    for (const tab of navigationTabs) {
      const html = renderToStaticMarkup(createElement(MainTabs, {
        activeTab: tab.key, t: key => translations[locale][key], onChange: () => {},
      }));
      assert.ok(html.includes('aria-current="page"'));
      assert.ok(html.includes(translations[locale][tab.label]));
      assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, 1);
    }
  }
  assert.equal(translations.en.exploreTaipei, 'Explore Taipei');
  assert.equal(translations.zh.exploreTaipei, '探索台北');
});

test('module search supports bilingual labels, whitespace, case, group restriction and empty results', () => {
  assert.equal(searchNavigation('  ').length, 14);
  assert.deepEqual(searchNavigation('supermarket').map(tab => tab.key), ['supermarkets']);
  assert.deepEqual(searchNavigation('超級市場').map(tab => tab.key), ['supermarkets']);
  assert.deepEqual(searchNavigation('POLICY11').map(tab => tab.key), ['policy11']);
  assert.equal(searchNavigation('supermarket', 'foodProducts').length, 0);
  assert.equal(searchNavigation('食品與農產品').length, 5);
  assert.equal(searchNavigation('no-such-module-xyz').length, 0);
  for (const group of navigationGroups) {
    assert.deepEqual(searchNavigation('', group.key).map(tab => tab.key),
      navigationTabs.filter(tab => tab.group === group.key).map(tab => tab.key));
  }
});
