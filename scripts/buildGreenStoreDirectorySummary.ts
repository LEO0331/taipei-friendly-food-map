import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { GreenStoreDirectoryRecord, GreenStoreDirectorySummary } from '../src/types';
import { readReport, writeReport } from './dataPipeline';

const RECORDS_PATH = 'public/data/green-store-directory/records.json';
const SUMMARY_PATH = 'public/data/green-store-directory/summary.json';
const records = JSON.parse(await readFile(RECORDS_PATH, 'utf8')) as GreenStoreDirectoryRecord[];
const countBy = (values: Array<string | undefined>) => {
  const counts = new Map<string, number>();
  values.filter((value): value is string => Boolean(value)).forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'zh-Hant'));
};
const byDistrict = countBy(records.map((record) => record.districtNameFromAddress)).map(({ label: district, count }) => ({ district, count }));
const byGreenStoreType = countBy(records.map((record) => record.greenStoreType)).map(({ label: greenStoreType, count }) => ({ greenStoreType, count }));
const primaryKeys = records.map((record) => record.primaryKey);
const summary: GreenStoreDirectorySummary = {
  generatedAt: new Date().toISOString(), totalStores: records.length,
  uniqueStoreNames: new Set(records.map((record) => record.storeNameNormalized).filter(Boolean)).size,
  districtCount: byDistrict.length, greenStoreTypeCount: byGreenStoreType.length,
  recordsWithPhone: records.filter((record) => record.hasPhone).length,
  recordsWithMobile: records.filter((record) => record.mobileNormalized).length,
  recordsWithContactNumber: records.filter((record) => record.fullContactNumber).length,
  topDistrict: byDistrict[0]?.district, topGreenStoreType: byGreenStoreType[0]?.greenStoreType,
  byDistrict, byGreenStoreType,
  byPhoneAvailability: [true, false].map((hasPhone) => ({ hasPhone, count: records.filter((record) => record.hasPhone === hasPhone).length })),
  dataQuality: {
    duplicateRecordCount: records.length - new Set(primaryKeys).size,
    duplicatePrimaryKeyCount: [...new Set(primaryKeys)].filter((key) => primaryKeys.filter((item) => item === key).length > 1).length,
    missingStoreNameCount: records.filter((record) => !record.storeName).length,
    missingAddressCount: records.filter((record) => !record.address).length,
    unknownGreenStoreTypeCount: records.filter((record) => !record.greenStoreType).length,
  },
};
await writeFile(SUMMARY_PATH, `${JSON.stringify(summary, null, 2)}\n`);
const report = await readReport();
if (report.greenStoreDirectory) await writeReport({ ...report, greenStoreDirectory: { ...report.greenStoreDirectory, ...summary } });
console.log(`Built Green Store summary for ${records.length} records.`);
