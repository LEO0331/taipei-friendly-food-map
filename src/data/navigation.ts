import type { TranslationKey } from './translations';

export type TabKey =
  | 'map'
  | 'directory'
  | 'overview'
  | 'traceability'
  | 'commercialDistricts'
  | 'greenStores'
  | 'hygieneGrading'
  | 'failedInspections'
  | 'policy11'
  | 'agriculturalInspections'
  | 'organicFarms'
  | 'temporaryVendorMarkets'
  | 'supermarkets'
  | 'notes';

export type NavigationGroup = 'explore' | 'foodProducts' | 'facilities' | 'about';
export type NavigationTab = { key: TabKey; label: TranslationKey; group: NavigationGroup };
export const navigationGroups: ReadonlyArray<{ key: NavigationGroup; label: TranslationKey }> = [
  { key: 'explore', label: 'exploreTaipei' },
  { key: 'foodProducts', label: 'foodAndProducts' },
  { key: 'facilities', label: 'storesAndFacilities' },
  { key: 'about', label: 'aboutThisData' },
];

export const navigationTabs: readonly NavigationTab[] = [
  { key: 'map', label: 'friendlyMap', group: 'explore' },
  { key: 'directory', label: 'storeDirectory', group: 'explore' },
  { key: 'overview', label: 'friendlyOverview', group: 'explore' },
  { key: 'traceability', label: 'foodTraceability', group: 'foodProducts' },
  { key: 'hygieneGrading', label: 'restaurantHygieneGradingRecords', group: 'foodProducts' },
  { key: 'failedInspections', label: 'failedFoodInspectionRecords', group: 'foodProducts' },
  { key: 'policy11', label: 'foodHygieneEvidence', group: 'foodProducts' },
  { key: 'agriculturalInspections', label: 'agriculturalProductInspections', group: 'foodProducts' },
  { key: 'commercialDistricts', label: 'commercialDistricts', group: 'facilities' },
  { key: 'greenStores', label: 'greenStoreDirectory', group: 'facilities' },
  { key: 'organicFarms', label: 'organicFarms', group: 'facilities' },
  { key: 'temporaryVendorMarkets', label: 'temporaryVendorMarkets', group: 'facilities' },
  { key: 'supermarkets', label: 'supermarkets', group: 'facilities' },
  { key: 'notes', label: 'dataNotes', group: 'about' },
];
