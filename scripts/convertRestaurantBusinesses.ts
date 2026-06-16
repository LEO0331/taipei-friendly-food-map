import { writeFile } from 'node:fs/promises';
import {
  RESTAURANTS_RAW,
  convertFriendlyStoresFromRows,
  convertRestaurantBusinessesFromRows,
  ensureDataDirs,
  readCsvRows,
  readReport,
  writeReport,
  FRIENDLY_EN_RAW,
  FRIENDLY_ZH_RAW,
} from './dataPipeline';

await ensureDataDirs();
const restaurantRows = await readCsvRows(RESTAURANTS_RAW);
let friendlyStores;
try {
  friendlyStores = JSON.parse(await (await import('node:fs/promises')).readFile('public/data/friendly-stores.json', 'utf8'));
} catch {
  const zhRows = await readCsvRows(FRIENDLY_ZH_RAW);
  const enRows = await readCsvRows(FRIENDLY_EN_RAW);
  friendlyStores = convertFriendlyStoresFromRows(zhRows, enRows).stores;
}
const restaurants = convertRestaurantBusinessesFromRows(restaurantRows, friendlyStores);
await writeFile('public/data/restaurant-businesses.json', `${JSON.stringify(restaurants, null, 2)}\n`);
const report = await readReport();
report.restaurantBusinesses = {
  totalRows: restaurantRows.length,
  converted: restaurants.length,
  missingCoordinates: restaurants.filter((restaurant) => restaurant.coordinateStatus === 'missing').length,
  outlierCoordinates: restaurants.filter((restaurant) => restaurant.coordinateStatus === 'outlier').length,
  matchedFriendlyStores: restaurants.filter((restaurant) => restaurant.matchedFriendlyStoreId).length,
};
report.notes = Array.from(new Set([...(report.notes ?? []), 'Restaurant matching is best effort and avoids labeling unmatched businesses as not friendly.']));
await writeReport(report);
console.log(`Converted ${restaurants.length} restaurant-business records.`);
