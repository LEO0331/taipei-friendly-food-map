import type { TranslationKey } from '../data/translations';

export type TabKey =
  | 'map'
  | 'directory'
  | 'overview'
  | 'traceability'
  | 'commercialDistricts'
  | 'greenStores'
  | 'hygieneGrading'
  | 'failedInspections'
  | 'agriculturalInspections'
  | 'organicFarms'
  | 'temporaryVendorMarkets'
  | 'supermarkets'
  | 'notes';

type NavigationGroup = 'explore' | 'foodProducts' | 'facilities' | 'about';
type Tab = { key: TabKey; label: TranslationKey; group: NavigationGroup };
type Props = { activeTab: TabKey; t: (key: TranslationKey) => string; onChange: (tab: TabKey) => void };

const groups: Array<{ key: NavigationGroup; label: TranslationKey }> = [
  { key: 'explore', label: 'exploreTaipei' },
  { key: 'foodProducts', label: 'foodAndProducts' },
  { key: 'facilities', label: 'storesAndFacilities' },
  { key: 'about', label: 'aboutThisData' },
];

const tabs: Tab[] = [
  { key: 'map', label: 'friendlyMap', group: 'explore' },
  { key: 'directory', label: 'storeDirectory', group: 'explore' },
  { key: 'overview', label: 'friendlyOverview', group: 'explore' },
  { key: 'traceability', label: 'foodTraceability', group: 'foodProducts' },
  { key: 'hygieneGrading', label: 'restaurantHygieneGradingRecords', group: 'foodProducts' },
  { key: 'failedInspections', label: 'failedFoodInspectionRecords', group: 'foodProducts' },
  { key: 'agriculturalInspections', label: 'agriculturalProductInspections', group: 'foodProducts' },
  { key: 'commercialDistricts', label: 'commercialDistricts', group: 'facilities' },
  { key: 'greenStores', label: 'greenStoreDirectory', group: 'facilities' },
  { key: 'organicFarms', label: 'organicFarms', group: 'facilities' },
  { key: 'temporaryVendorMarkets', label: 'temporaryVendorMarkets', group: 'facilities' },
  { key: 'supermarkets', label: 'supermarkets', group: 'facilities' },
  { key: 'notes', label: 'dataNotes', group: 'about' },
];

export function MainTabs({ activeTab, t, onChange }: Props) {
  const activeGroup = tabs.find((tab) => tab.key === activeTab)?.group ?? 'explore';
  const visibleTabs = tabs.filter((tab) => tab.group === activeGroup);

  return (
    <nav className="section-navigation" aria-label={t('navigationSections')}>
      <div className="primary-tabs" aria-label={t('navigationSections')}>
        {groups.map((group) => (
          <button
            type="button"
            key={group.key}
            className={activeGroup === group.key ? 'active' : ''}
            aria-pressed={activeGroup === group.key}
            onClick={() => onChange(tabs.find((tab) => tab.group === group.key)?.key ?? 'map')}
          >
            {t(group.label)}
          </button>
        ))}
      </div>
      <div className="secondary-tabs" aria-label={t('currentSectionPages')}>
        {visibleTabs.map((tab) => (
          <button
            type="button"
            key={tab.key}
            className={activeTab === tab.key ? 'active' : ''}
            aria-current={activeTab === tab.key ? 'page' : undefined}
            onClick={() => onChange(tab.key)}
          >
            {t(tab.label)}
          </button>
        ))}
      </div>
    </nav>
  );
}
