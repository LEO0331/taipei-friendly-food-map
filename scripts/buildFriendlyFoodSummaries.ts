import { readFile, writeFile } from 'node:fs/promises';
import { buildFriendlyFoodSummary } from '../src/lib/friendlyFood';
import type { FriendlyStore, RestaurantBusiness, WaterRefillStore } from '../src/types';
import { ensureDataDirs } from './dataPipeline';

await ensureDataDirs();
const friendlyStores = JSON.parse(await readFile('public/data/friendly-stores.json', 'utf8')) as FriendlyStore[];
const restaurants = JSON.parse(await readFile('public/data/restaurant-businesses.json', 'utf8')) as RestaurantBusiness[];
const waterRefillStores = JSON.parse(
  await readFile('public/data/water-refill-stores.json', 'utf8'),
) as WaterRefillStore[];
const summary = buildFriendlyFoodSummary(friendlyStores, restaurants, waterRefillStores);
await writeFile('public/data/friendly-food-summary.json', `${JSON.stringify(summary, null, 2)}\n`);
console.log('Built friendly food summary.');
