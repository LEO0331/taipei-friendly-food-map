import type { TranslationKey } from '../data/translations';

export type TabKey = 'map' | 'directory' | 'overview' | 'traceability' | 'commercialDistricts' | 'greenStores' | 'hygieneGrading' | 'failedInspections' | 'agriculturalInspections' | 'organicFarms' | 'traditionalMarkets' | 'temporaryVendorMarkets' | 'supermarkets' | 'notes';

type Props = {
  activeTab: TabKey;
  t: (key: TranslationKey) => string;
  onChange: (tab: TabKey) => void;
};

const tabs: Array<{ key: TabKey; label: TranslationKey }> = [
  { key: 'map', label: 'friendlyMap' },
  { key: 'directory', label: 'storeDirectory' },
  { key: 'overview', label: 'friendlyOverview' },
  { key: 'traceability', label: 'foodTraceability' },
  { key: 'commercialDistricts', label: 'commercialDistricts' },
  { key: 'greenStores', label: 'greenStoreDirectory' },
  { key: 'hygieneGrading', label: 'restaurantHygieneGradingRecords' },
  { key: 'failedInspections', label: 'failedFoodInspectionRecords' },
  { key: 'agriculturalInspections', label: 'agriculturalProductInspections' },
  { key: 'organicFarms', label: 'organicFarms' },
  { key: 'traditionalMarkets', label: 'traditionalMarkets' },
  { key: 'temporaryVendorMarkets', label: 'temporaryVendorMarkets' },
  { key: 'supermarkets', label: 'supermarkets' },
  { key: 'notes', label: 'dataNotes' },
];

export function MainTabs({ activeTab, t, onChange }: Props) {
  return (
    <nav className="tabs" aria-label="Main sections">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={activeTab === tab.key ? 'active' : ''}
          onClick={() => onChange(tab.key)}
        >
          {t(tab.label)}
        </button>
      ))}
    </nav>
  );
}
