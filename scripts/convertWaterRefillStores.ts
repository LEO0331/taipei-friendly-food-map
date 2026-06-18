import { readFile, writeFile } from 'node:fs/promises';
import type { FriendlyStore, RestaurantBusiness } from '../src/types';
import {
  WATER_REFILL_RAW,
  convertWaterRefillStoresFromRows,
  ensureDataDirs,
  readCsvRows,
  readReport,
  writeReport,
} from './dataPipeline';

await ensureDataDirs();
const [rows, friendlyStores, restaurants] = await Promise.all([
  readCsvRows(WATER_REFILL_RAW),
  readFile('public/data/friendly-stores.json', 'utf8').then(
    (text) => JSON.parse(text) as FriendlyStore[],
  ),
  readFile('public/data/restaurant-businesses.json', 'utf8').then(
    (text) => JSON.parse(text) as RestaurantBusiness[],
  ),
]);
const stores = convertWaterRefillStoresFromRows(rows, friendlyStores, restaurants);
await writeFile('public/data/water-refill-stores.json', `${JSON.stringify(stores, null, 2)}\n`);

const report = await readReport();
report.waterRefillStores = {
  totalRows: rows.length,
  converted: stores.length,
  missingCoordinates: stores.filter((store) => store.coordinateStatus === 'missing').length,
  outlierCoordinates: stores.filter((store) => store.coordinateStatus === 'outlier').length,
  matchedFriendlyStores: stores.filter((store) => store.matchedFriendlyStoreId).length,
  matchedRestaurantBusinesses: stores.filter((store) => store.matchedRestaurantBusinessId).length,
};
report.notes = Array.from(
  new Set([
    ...(report.notes ?? []),
    'Water refill availability and operation should be verified on site.',
  ]),
);
await writeReport(report);
console.log(`Converted ${stores.length} water-refill stores.`);
