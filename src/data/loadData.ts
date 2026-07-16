import type {
  FriendlyFoodSummary,
  FriendlyStore,
  CommercialDistrictIntroductionSummary,
  GreenStoreDirectorySummary,
  RestaurantHygieneGradingSummary,
  FailedFoodInspectionSummary,
  RestaurantBusiness,
  TaipeiFoodTraceabilitySummary,
  WaterRefillStore,
} from '../types';
import { buildFriendlyFoodSummary } from '../lib/friendlyFood';

export type AppData = {
  friendlyStores: FriendlyStore[];
  waterRefillStores: WaterRefillStore[];
  restaurants: RestaurantBusiness[];
  summary: FriendlyFoodSummary;
  foodTraceabilitySummary?: TaipeiFoodTraceabilitySummary;
  commercialDistrictSummary?: CommercialDistrictIntroductionSummary;
  greenStoreDirectorySummary?: GreenStoreDirectorySummary;
  restaurantHygieneGradingSummary?: RestaurantHygieneGradingSummary;
  failedFoodInspectionSummary?: FailedFoodInspectionSummary;
};

const loadJson = async <T>(path: string, fallback: T): Promise<T> => {
  try {
    const response = await fetch(path);
    if (!response.ok) return fallback;
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
};

const dataPath = (fileName: string) => `${import.meta.env.BASE_URL}data/${fileName}`;

export const loadFriendlyFoodData = async (): Promise<AppData> => {
  const [friendlyStores, waterRefillStores, restaurants, summaryFromFile] = await Promise.all([
    loadJson<FriendlyStore[]>(dataPath('friendly-stores.json'), []),
    loadJson<WaterRefillStore[]>(dataPath('water-refill-stores.json'), []),
    loadJson<RestaurantBusiness[]>(dataPath('restaurant-businesses.json'), []),
    loadJson<FriendlyFoodSummary | undefined>(dataPath('friendly-food-summary.json'), undefined),
  ]);
  const foodTraceabilitySummary = await loadJson<TaipeiFoodTraceabilitySummary | undefined>(
    dataPath('food-traceability/summary.json'),
    undefined,
  );
  const commercialDistrictSummary = await loadJson<CommercialDistrictIntroductionSummary | undefined>(
    dataPath('commercial-district-introduction-summary.json'),
    undefined,
  );
  const greenStoreDirectorySummary = await loadJson<GreenStoreDirectorySummary | undefined>(
    dataPath('green-store-directory/summary.json'),
    undefined,
  );
  const restaurantHygieneGradingSummary = await loadJson<RestaurantHygieneGradingSummary | undefined>(
    dataPath('restaurant-hygiene-grading-records/summary.json'),
    undefined,
  );
  const failedFoodInspectionSummary = await loadJson<FailedFoodInspectionSummary | undefined>(dataPath('failed-food-inspection-records/summary.json'), undefined);
  return {
    friendlyStores,
    waterRefillStores,
    restaurants,
    summary:
      summaryFromFile
        ? {
            ...summaryFromFile,
            foodTraceability: foodTraceabilitySummary ?? summaryFromFile.foodTraceability,
            commercialDistricts: commercialDistrictSummary ?? summaryFromFile.commercialDistricts,
          }
        : {
            ...buildFriendlyFoodSummary(friendlyStores, restaurants, waterRefillStores),
            foodTraceability: foodTraceabilitySummary,
            commercialDistricts: commercialDistrictSummary,
          },
    foodTraceabilitySummary,
    commercialDistrictSummary,
    greenStoreDirectorySummary,
    restaurantHygieneGradingSummary,
    failedFoodInspectionSummary,
  };
};
