import type { FriendlyFoodSummary, FriendlyStore, RestaurantBusiness } from '../types';
import { buildFriendlyFoodSummary } from '../lib/friendlyFood';

export type AppData = {
  friendlyStores: FriendlyStore[];
  restaurants: RestaurantBusiness[];
  summary: FriendlyFoodSummary;
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
  const [friendlyStores, restaurants, summaryFromFile] = await Promise.all([
    loadJson<FriendlyStore[]>(dataPath('friendly-stores.json'), []),
    loadJson<RestaurantBusiness[]>(dataPath('restaurant-businesses.json'), []),
    loadJson<FriendlyFoodSummary | undefined>(dataPath('friendly-food-summary.json'), undefined),
  ]);
  return {
    friendlyStores,
    restaurants,
    summary: summaryFromFile ?? buildFriendlyFoodSummary(friendlyStores, restaurants),
  };
};
