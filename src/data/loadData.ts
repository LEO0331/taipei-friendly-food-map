import type {
  FriendlyFoodSummary,
  FriendlyStore,
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
  return {
    friendlyStores,
    waterRefillStores,
    restaurants,
    summary:
      summaryFromFile
        ? { ...summaryFromFile, foodTraceability: foodTraceabilitySummary ?? summaryFromFile.foodTraceability }
        : {
            ...buildFriendlyFoodSummary(friendlyStores, restaurants, waterRefillStores),
            foodTraceability: foodTraceabilitySummary,
          },
    foodTraceabilitySummary,
  };
};
