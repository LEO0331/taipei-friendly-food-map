export type CoordinateStatus = 'valid' | 'missing' | 'outlier';

export type StoreLayer = 'friendly_store' | 'water_refill_store' | 'registered_restaurant_business';

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
  | 'period_friendly'
  | 'water_refill_available';

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

export type MatchConfidence = 'high' | 'medium' | 'low' | 'none';

export type WaterRefillStore = {
  id: string;
  layer: 'water_refill_store';
  nameZh: string;
  addressZh: string;
  descriptionZh?: string;
  district?: string;
  longitude?: number;
  latitude?: number;
  coordinateStatus: CoordinateStatus;
  phone?: string;
  matchedFriendlyStoreId?: string;
  matchedRestaurantBusinessId?: string;
  matchConfidence?: MatchConfidence;
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
  waterRefillStoreCount: number;
  waterRefillStoresWithCoordinates: number;
  topDistrictByWaterRefillStores?: string;
  matchedFriendlyWaterRefillStores: number;
  unmatchedWaterRefillOnlyRecords: number;
  friendlyStoresByDistrict: Record<string, number>;
  restaurantBusinessesByDistrict: Record<string, number>;
  waterRefillStoresByDistrict: Record<string, number>;
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
  waterRefillStores?: {
    totalRows: number;
    converted: number;
    missingCoordinates: number;
    outlierCoordinates: number;
    matchedFriendlyStores: number;
    matchedRestaurantBusinesses: number;
  };
  notes: string[];
};
