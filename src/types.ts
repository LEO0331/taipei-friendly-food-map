export type CoordinateStatus = 'valid' | 'missing' | 'outlier';

export type StoreLayer = 'friendly_store' | 'water_refill_store' | 'registered_restaurant_business';
export type FriendlyFoodModule =
  | 'friendly_food_shops'
  | 'drinking_water_friendly_stores'
  | 'taipei_food_traceability_products'
  | 'commercial_district_introductions'
  | 'green_store_directory'
  | 'restaurant_hygiene_grading_records'
  | 'failed_food_inspection_records'
  | 'organic_farms'
  | 'traditional_markets'
  | 'temporary_vendor_markets'
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
  commercialDistricts?: CommercialDistrictIntroductionSummary;
};

export type CommercialDistrictTagCategory = 'food' | 'shopping' | 'leisure' | 'unknown';
export type CommercialDistrictTypeCategory =
  | 'food'
  | 'night_market'
  | 'traditional_market'
  | 'shopping'
  | 'department_store'
  | 'hot_spring'
  | 'cultural_creative'
  | 'hospitality'
  | 'electronics'
  | 'pet'
  | 'automotive'
  | 'home_living'
  | 'education'
  | 'medical_lifestyle'
  | 'mixed'
  | 'other'
  | 'unknown';

export type CommercialDistrictIntroductionRecord = {
  id: string;
  module: 'commercial_district_introductions';
  sourceSequenceNumber?: number;
  commercialDistrictName: string;
  district: string;
  areaCode?: string;
  districtFromAreaCode?: string;
  districtMismatch: boolean;
  districtTagRaw?: string;
  districtTag?: string;
  districtTagCategory: CommercialDistrictTagCategory;
  organizationName?: string;
  hasOrganizationName: boolean;
  locationDescription: string;
  nearbyMrtRaw?: string;
  nearbyMrt?: string;
  nearbyMrtLineCodes: string[];
  nearbyMrtStationNames: string[];
  commercialDistrictTypeRaw?: string;
  commercialDistrictType?: string;
  commercialDistrictTypeCategories: CommercialDistrictTypeCategory[];
  foodRelated: boolean;
  shoppingRelated: boolean;
  leisureRelated: boolean;
  nightMarketRelated: boolean;
  traditionalMarketRelated: boolean;
  hotSpringRelated: boolean;
  culturalCreativeRelated: boolean;
  departmentStoreRelated: boolean;
  transportationRelated: boolean;
  description: string;
  descriptionPlainText?: string;
  descriptionLength?: number;
  locationPrecision: 'district_centroid' | 'location_description_only' | 'exact' | 'missing';
  googleMapsQuery?: string;
  source: string;
  sourceAgency: string;
};

export type CommercialDistrictIntroductionSummary = {
  totalRecords: number;
  districtCount: number;
  areaCodeCount: number;
  districtTagCount: number;
  organizationCount: number;
  nearbyMrtStationCount: number;
  commercialDistrictTypeCount: number;
  recordsWithOrganizationName: number;
  recordsWithCommercialDistrictType: number;
  recordsWithNearbyMrt: number;
  foodRelatedCount: number;
  shoppingRelatedCount: number;
  leisureRelatedCount: number;
  nightMarketRelatedCount: number;
  traditionalMarketRelatedCount: number;
  hotSpringRelatedCount: number;
  culturalCreativeRelatedCount: number;
  departmentStoreRelatedCount: number;
  byDistrict: Array<{
    district: string;
    areaCode?: string;
    commercialDistrictCount: number;
    foodRelatedCount: number;
    shoppingRelatedCount: number;
    leisureRelatedCount: number;
    nightMarketRelatedCount: number;
  }>;
  byDistrictTag: Array<{
    districtTag: string;
    districtTagCategory: CommercialDistrictTagCategory;
    count: number;
  }>;
  byCommercialDistrictTypeCategory: Array<{
    category: CommercialDistrictTypeCategory;
    count: number;
  }>;
  byMrtStation: Array<{ stationName: string; lineCodes: string[]; count: number }>;
  topCommercialDistrictTypes: Array<{ commercialDistrictType: string; count: number }>;
  dataQuality: {
    missingOrganizationNameCount: number;
    missingCommercialDistrictTypeCount: number;
    missingNearbyMrtCount: number;
    districtMismatchCount: number;
    duplicateCommercialDistrictNameCount: number;
    duplicateLocationDescriptionCount: number;
    invalidAreaCodeCount: number;
  };
};

export type GreenStoreDirectoryRecord = {
  id: string;
  module: 'green_store_directory';
  primaryKey: string;
  sourceSequenceNumber?: string;
  storeName: string;
  storeNameNormalized: string;
  address: string;
  addressNormalized: string;
  districtNameFromAddress?: string;
  roadName?: string;
  storeNumber?: string;
  storeNumberNormalized?: string;
  contactPerson?: string;
  phone?: string;
  phoneNormalized?: string;
  extension?: string;
  mobile?: string;
  mobileNormalized?: string;
  fullContactNumber?: string;
  hasPhone: boolean;
  greenStoreType?: string;
  greenStoreTypeNormalized?: string;
  googleMapsQuery: string;
  rawSource: {
    sourceSequenceNumber?: string;
    storeName?: string;
    address?: string;
    storeNumber?: string;
    contactPerson?: string;
    phone?: string;
    extension?: string;
    mobile?: string;
    greenStoreType?: string;
  };
  source: string;
  sourceAgency: string;
};

export type GreenStoreDirectorySummary = {
  generatedAt: string;
  totalStores: number;
  uniqueStoreNames: number;
  districtCount: number;
  greenStoreTypeCount: number;
  recordsWithPhone: number;
  recordsWithMobile: number;
  recordsWithContactNumber: number;
  topDistrict?: string;
  topGreenStoreType?: string;
  byDistrict: Array<{ district: string; count: number }>;
  byGreenStoreType: Array<{ greenStoreType: string; count: number }>;
  byPhoneAvailability: Array<{ hasPhone: boolean; count: number }>;
  dataQuality: {
    duplicateRecordCount: number;
    duplicatePrimaryKeyCount: number;
    missingStoreNameCount: number;
    missingAddressCount: number;
    unknownGreenStoreTypeCount: number;
  };
};

export type RestaurantHygieneGradingRecord = {
  id: string;
  module: 'restaurant_hygiene_grading_records';
  districtCode: string;
  districtName?: string;
  districtCodeNormalized?: string;
  businessName: string;
  businessNameNormalized: string;
  foodBusinessRegistrationNumber: string;
  registrationNumberNormalized: string;
  address: string;
  addressNormalized: string;
  roadName?: string;
  assessmentResult: string;
  assessmentResultNormalized: string;
  googleMapsQuery: string;
  rawSource: {
    districtCode: string;
    businessName: string;
    foodBusinessRegistrationNumber: string;
    address: string;
    assessmentResult: string;
  };
  source: string;
  sourceAgency: string;
};

export type RestaurantHygieneGradingSummary = {
  generatedAt: string;
  totalRecords: number;
  uniqueBusinesses: number;
  districtCount: number;
  assessmentResultCategoryCount: number;
  recordsWithRegistrationNumbers: number;
  topDistrict?: string;
  byDistrict: Array<{ district: string; count: number }>;
  byAssessmentResult: Array<{ assessmentResult: string; count: number }>;
  byAssessmentResultAndDistrict: Array<{ district: string; assessmentResult: string; count: number }>;
  dataQuality: {
    duplicateRecordCount: number;
    missingBusinessNameCount: number;
    missingRegistrationNumberCount: number;
    missingAddressCount: number;
    missingAssessmentResultCount: number;
    unknownDistrictCount: number;
    unknownAssessmentValueCount: number;
  };
};

export type FailedFoodInspectionRecord = {
  id: string;
  sourceYear: number | null;
  sourceResourceName: string;
  projectName: string;
  inspectionDateRaw: string;
  inspectionDate: string | null;
  inspectionYear: number | null;
  category: string;
  sampleName: string;
  inspectionPostalCode: string;
  districtName: string;
  inspectionLocation: string;
  inspectionResult: string;
  noncomplianceReason: string;
  googleMapsQuery: string;
  rawSource: Record<string, string>;
  source: string;
  sourceAgency: string;
};

export type FailedFoodInspectionSummary = {
  generatedAt: string;
  totalRecords: number;
  latestInspectionDate?: string;
  yearsCovered: number;
  foodCategoryCount: number;
  uniqueSampleNames: number;
  districtCount: number;
  topNoncomplianceReason?: string;
  topCategory?: string;
  byYear: Array<{ year: number; count: number }>;
  byMonth: Array<{ month: string; count: number }>;
  byCategory: Array<{ category: string; count: number }>;
  byNoncomplianceReason: Array<{ reason: string; count: number }>;
  byDistrict: Array<{ district: string; count: number }>;
  byCategoryAndYear: Array<{ category: string; year: number; count: number }>;
  dataQuality: { invalidDateCount: number; duplicateRowCount: number; missingLocationCount: number; unknownCategoryCount: number; unresolvedDistrictCount: number };
};
export type OrganicFarmRecord = { id: string; farmName: string; farmerName: string; contactAddress: string; districtName: string; certificationNumber: string; areaHectares: number | null; foodEducationExperienceRaw: string; hasFoodEducationExperience: boolean | null; beekeepingRaw: string; hasBeekeeping: boolean | null; poultryRaisingRaw: string; hasPoultryRaising: boolean | null; note: string; googleMapsQuery: string; rawSource: Record<string, string>; source: string; sourceAgency: string; };
export type OrganicFarmSummary = { generatedAt: string; totalFarms: number; uniqueFarms: number; districtCount: number; totalAreaHectares: number; foodEducationCount: number; beekeepingCount: number; poultryRaisingCount: number; certificationCount: number; byDistrict: Array<{ district: string; count: number; areaHectares: number }>; areaDistribution: Array<{ range: string; count: number }>; dataQuality: { duplicateCount: number; invalidAreaCount: number; missingFarmNameCount: number; unknownDistrictCount: number; unrecognizedYesNoValueCount: number } };
export type TraditionalMarketRecord = { id: string; sourceId: string; marketName: string; description: string; descriptionPlainText: string; createdDateRaw: string; createdDate: string | null; address: string; districtNameFromAddress: string; longitude?: number; latitude?: number; hasValidCoordinates: boolean; googleMapsQuery: string; rawSource: Record<string,string> };
export type TraditionalMarketSummary = { totalMarkets:number; validCoordinateCount:number; districtCount:number; addressCount:number; descriptionCount:number; topDistrict?:string; byDistrict:Array<{district:string;count:number}>; dataQuality:{duplicateCount:number;missingNameCount:number;invalidDateCount:number;missingAddressCount:number;invalidCoordinateCount:number} };
export type SupermarketRecord = { id:string; sourceSequenceNumber:string; name:string; descriptionRaw:string; descriptionText:string; createdDateRaw:string; createdDate:string|null; address:string; districtName:string; longitude:number|null; latitude:number|null; hasValidCoordinates:boolean; rawSource:Record<string,string> };
export interface TemporaryVendorMarketRecord {
  id: string;
  sourceSequenceNumber: string;
  districtName: string;
  operatorName: string;
  operatingDayRaw: string;
  operatingDays: string[];
  startTimeRaw: string;
  startTime: string | null;
  endTimeRaw: string;
  endTime: string | null;
  locationScope: string;
  longitudeRaw: string;
  latitudeRaw: string;
  longitude: number | null;
  latitude: number | null;
  hasValidCoordinates: boolean;
  rawSource: Record<string, string>;
}
export type TemporaryVendorMarketSummary = {
  sourceUrl: string; sourceUpdatedAt: string; totalRecords: number; duplicateRecordCount: number; districtCount: number; operatorCount: number;
  validCoordinateCount: number; completeHoursCount: number; operatingDayCount: number; byDistrict: Array<{ label: string; count: number }>;
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
  commercialDistricts?: CommercialDistrictIntroductionSummary & {
    source: string;
    sourceAgency: string;
    sourceFile: string;
    invalidAreaCodeExamples: string[];
    unparsedMrtExamples: string[];
  };
  greenStoreDirectory?: GreenStoreDirectorySummary & {
    source: string;
    sourceAgency: string;
    sourceFile: string;
    duplicateRecordCount: number;
    duplicatePrimaryKeyCount: number;
    missingStoreNameCount: number;
    missingAddressCount: number;
    unknownGreenStoreTypeCount: number;
  };
  restaurantHygieneGradingRecords?: RestaurantHygieneGradingSummary & {
    source: string;
    sourceAgency: string;
    sourceFile: string;
  };
  failedFoodInspectionRecords?: FailedFoodInspectionSummary & { source: string; sourceAgency: string; sourceFiles: string[] };
  organicFarms?: OrganicFarmSummary & { source: string; sourceAgency: string; sourceFile: string };
  notes: string[];
};
