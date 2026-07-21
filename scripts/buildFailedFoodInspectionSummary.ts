import { readFile, writeFile } from 'node:fs/promises';
import type { FailedFoodInspectionRecord, FailedFoodInspectionSummary } from '../src/types';
import { readReport, writeReport } from './dataPipeline';

const RECORDS_PATH = 'public/data/failed-food-inspection-records/records.json';
const SUMMARY_PATH = 'public/data/failed-food-inspection-records/summary.json';
const records = JSON.parse(await readFile(RECORDS_PATH, 'utf8')) as FailedFoodInspectionRecord[];

const count = (items: string[]) => [...items.reduce((counts, item) => counts.set(item, (counts.get(item) ?? 0) + 1), new Map<string, number>())]
  .map(([label, count]) => ({ label, count }))
  .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'zh-Hant'));
const present = (value: string | null): value is string => Boolean(value);
const report = await readReport();
const byYear = count(records.flatMap((record) => record.inspectionYear ? [String(record.inspectionYear)] : []))
  .map(({ label, count }) => ({ year: Number(label), count }))
  .sort((a, b) => a.year - b.year);
const byCategory = count(records.flatMap((record) => record.category ? [record.category] : []))
  .map(({ label: category, count }) => ({ category, count }));
const byReason = count(records.flatMap((record) => record.noncomplianceReason ? [record.noncomplianceReason] : []))
  .map(({ label: reason, count }) => ({ reason, count }));
const byDistrict = count(records.flatMap((record) => record.districtName ? [record.districtName] : []))
  .map(({ label: district, count }) => ({ district, count }));
const dataQuality = report.failedFoodInspectionRecords?.dataQuality ?? { invalidDateCount: 0, duplicateRowCount: 0, missingLocationCount: 0, unknownCategoryCount: 0, unresolvedDistrictCount: 0 };
const summary: FailedFoodInspectionSummary = {
  generatedAt: new Date().toISOString(), totalRecords: records.length,
  latestInspectionDate: records.map((record) => record.inspectionDate).filter(present).sort().at(-1),
  yearsCovered: byYear.length, foodCategoryCount: byCategory.length,
  uniqueSampleNames: new Set(records.map((record) => record.sampleName).filter(Boolean)).size,
  districtCount: byDistrict.length, topNoncomplianceReason: byReason[0]?.reason, topCategory: byCategory[0]?.category,
  byYear, byMonth: count(records.flatMap((record) => record.inspectionDate ? [record.inspectionDate.slice(0, 7)] : [])).map(({ label: month, count }) => ({ month, count })),
  byCategory, byNoncomplianceReason: byReason, byDistrict,
  byCategoryAndYear: count(records.flatMap((record) => record.category && record.inspectionYear ? [`${record.category}\u0000${record.inspectionYear}`] : [])).map(({ label, count }) => { const [category, year] = label.split('\u0000'); return { category, year: Number(year), count }; }),
  dataQuality,
};
await writeFile(SUMMARY_PATH, `${JSON.stringify(summary, null, 2)}\n`);
if (report.failedFoodInspectionRecords) await writeReport({ ...report, failedFoodInspectionRecords: { ...report.failedFoodInspectionRecords, ...summary } });
console.log(`Built failed-food-inspection summary for ${records.length} records.`);
