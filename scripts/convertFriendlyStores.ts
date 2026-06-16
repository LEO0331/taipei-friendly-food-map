import { writeFile } from 'node:fs/promises';
import {
  FRIENDLY_EN_RAW,
  FRIENDLY_ZH_RAW,
  convertFriendlyStoresFromRows,
  ensureDataDirs,
  readCsvRows,
  readReport,
  writeReport,
} from './dataPipeline';

await ensureDataDirs();
const zhRows = await readCsvRows(FRIENDLY_ZH_RAW);
const enRows = await readCsvRows(FRIENDLY_EN_RAW);
const { stores, englishMatches } = convertFriendlyStoresFromRows(zhRows, enRows);
await writeFile('public/data/friendly-stores.json', `${JSON.stringify(stores, null, 2)}\n`);
const report = await readReport();
report.friendlyStores = {
  totalRows: zhRows.length,
  converted: stores.length,
  missingCoordinates: stores.filter((store) => store.coordinateStatus === 'missing').length,
  outlierCoordinates: stores.filter((store) => store.coordinateStatus === 'outlier').length,
  englishMatches,
};
report.notes = Array.from(new Set([...(report.notes ?? []), 'Chinese friendly-store records are preserved even when no English match is found.']));
await writeReport(report);
console.log(`Converted ${stores.length} friendly stores.`);
