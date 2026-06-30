export type CoordinateStatus = 'valid' | 'missing' | 'outlier';

export type StoreLayer = 'friendly_store' | 'water_refill_store' | 'registered_restaurant_business';
export type FriendlyFoodModule =
  | 'friendly_food_shops'
  | 'drinking_water_friendly_stores'
  | 'taipei_food_traceability_products'
  | 'data_table'
  | 'data_notes';

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
  foodTraceability?: TaipeiFoodTraceabilitySummary;
};

export type TaipeiFoodTraceabilityProductIndexItem = {
  productKey: string;
  productName: string;
  productNameNormalized?: string;
  companyName: string;
  brandName: string;
  companyKey: string;
  brandKey: string;
  ingredientCount: number;
  uniqueIngredientBrandCount: number;
  servingSizeRawExamples: string[];
  caloriesKcalExamples: number[];
  hasTraceabilityUrl: boolean;
  traceabilityUrl?: string;
  detailChunkId: string;
};

export type TaipeiFoodTraceabilityProductDetail = {
  productKey: string;
  productName: string;
  companyName: string;
  brandName: string;
  servingSizeRawExamples: string[];
  caloriesKcalExamples: number[];
  traceabilityUrls: string[];
  ingredients: Array<{
    ingredientName: string;
    ingredientBrand?: string;
    rowIds: string[];
  }>;
  source: string;
  sourceAgency: string;
};

export type TaipeiFoodTraceabilityBrandSummary = {
  brandKey: string;
  brandName: string;
  companyName: string;
  companyKey: string;
  productCount: number;
  ingredientRowCount: number;
  uniqueIngredientCount: number;
  uniqueIngredientBrandCount: number;
  hasTraceabilityUrlCount: number;
};

export type TaipeiFoodTraceabilityIngredientSummary = {
  ingredientKey: string;
  ingredientName: string;
  productCount: number;
  brandCount: number;
  companyCount: number;
  ingredientBrandCount: number;
  topBrands: Array<{ brandName: string; count: number }>;
  topIngredientBrands: Array<{ ingredientBrand: string; count: number }>;
};

export type TaipeiFoodTraceabilitySummary = {
  totalRows: number;
  companyCount: number;
  brandCount: number;
  productCount: number;
  ingredientCount: number;
  ingredientBrandCount: number;
  recordsWithServingSize: number;
  recordsWithCalories: number;
  recordsWithTraceabilityUrl: number;
  administrativeAreaCodes: Array<{ administrativeAreaCode: string; count: number }>;
  topCompaniesByRowCount: Array<{ companyName: string; count: number }>;
  topBrandsByRowCount: Array<{ brandName: string; companyName?: string; count: number }>;
  topProductsByIngredientCount: Array<{
    productName: string;
    brandName: string;
    companyName: string;
    ingredientCount: number;
  }>;
  topIngredientsByProductCount: Array<{ ingredientName: string; productCount: number }>;
  topIngredientBrandsByRowCount: Array<{ ingredientBrand: string; count: number }>;
};

export type TaipeiFoodTraceabilitySearchItem = TaipeiFoodTraceabilityProductIndexItem & {
  topIngredientNames: string[];
  topIngredientBrands: string[];
  hasCalories: boolean;
  hasServingSize: boolean;
  minCaloriesKcal?: number;
  maxCaloriesKcal?: number;
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
  foodTraceability?: TaipeiFoodTraceabilitySummary & {
    source: string;
    sourceAgency: string;
    sourceFile: string;
    invalidCaloriesExamples: string[];
    invalidUrlExamples: string[];
  };
  notes: string[];
};
