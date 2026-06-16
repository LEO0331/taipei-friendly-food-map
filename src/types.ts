export type CoordinateStatus = 'valid' | 'missing' | 'outlier';

export type StoreLayer = 'friendly_store' | 'registered_restaurant_business';

export type Language = 'zh' | 'en';

export type FriendlyServiceTag =
  | 'english_friendly'
  | 'japanese_friendly'
  | 'korean_friendly'
  | 'mobile_charging'
  | 'accessibility_friendly'
  | 'gender_friendly'
  | 'convenient_payment'
  | 'vegetarian_friendly'
  | 'friendly_bathroom'
  | 'fair_trade_friendly'
  | 'free_wifi'
  | 'bicycle_friendly'
  | 'parent_child_friendly'
  | 'muslim_friendly'
  | 'period_friendly';

export type FriendlyStore = {
  id: string;
  layer: 'friendly_store';
  nameZh: string;
  nameEn?: string;
  addressZh: string;
  addressEn?: string;
  district?: string;
  longitude?: number;
  latitude?: number;
  coordinateStatus: CoordinateStatus;
  phone?: string;
  descriptionZh?: string;
  descriptionEn?: string;
  serviceTags: FriendlyServiceTag[];
  serviceTagCounts: Record<FriendlyServiceTag, number>;
  totalFriendlyItems: number;
  websiteUrl?: string;
  source: string;
};

export type RestaurantBusiness = {
  id: string;
  layer: 'registered_restaurant_business';
  businessRegistrationId?: string;
  name: string;
  address: string;
  district?: string;
  longitude?: number;
  latitude?: number;
  coordinateStatus: CoordinateStatus;
  matchedFriendlyStoreId?: string;
  matchConfidence?: 'high' | 'medium' | 'low' | 'none';
  source: string;
};

export type FriendlyFoodSummary = {
  generatedAt: string;
  friendlyStoreCount: number;
  restaurantBusinessCount: number;
  friendlyStoresWithCoordinates: number;
  restaurantBusinessesWithCoordinates: number;
  topDistrictByFriendlyStores?: string;
  topFriendlyServiceTag?: FriendlyServiceTag;
  vegetarianFriendlyCount: number;
  accessibilityFriendlyCount: number;
  muslimFriendlyCount: number;
  freeWifiCount: number;
  matchedFriendlyRestaurantCount: number;
  friendlyStoresByDistrict: Record<string, number>;
  restaurantBusinessesByDistrict: Record<string, number>;
  friendlyServiceTagDistribution: Record<FriendlyServiceTag, number>;
  totalFriendlyItemsDistribution: Record<string, number>;
};

export type ConversionReport = {
  generatedAt: string;
  downloads?: Array<{
    sourceUrl: string;
    downloadedAt: string;
    filePath: string;
    fileSize: number;
    notes: string;
  }>;
  friendlyStores?: {
    totalRows: number;
    converted: number;
    missingCoordinates: number;
    outlierCoordinates: number;
    englishMatches: number;
  };
  restaurantBusinesses?: {
    totalRows: number;
    converted: number;
    missingCoordinates: number;
    outlierCoordinates: number;
    matchedFriendlyStores: number;
  };
  notes: string[];
};
