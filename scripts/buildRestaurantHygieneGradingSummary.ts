import { readFile, writeFile } from 'node:fs/promises';
import type { RestaurantHygieneGradingRecord, RestaurantHygieneGradingSummary } from '../src/types';
import { readReport, writeReport } from './dataPipeline';

const records = JSON.parse(await readFile('public/data/restaurant-hygiene-grading-records/records.json', 'utf8')) as RestaurantHygieneGradingRecord[];
const count = (values: string[]) => [...values.reduce((map, value) => map.set(value, (map.get(value) ?? 0) + 1), new Map<string, number>()).entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'zh-Hant'));
const byDistrict = count(records.flatMap((record) => record.districtName ? [record.districtName] : [])).map(({ label: district, count }) => ({ district, count }));
const byAssessmentResult = count(records.flatMap((record) => record.assessmentResult ? [record.assessmentResult] : [])).map(({ label: assessmentResult, count }) => ({ assessmentResult, count }));
const byAssessmentResultAndDistrict = count(records.flatMap((record) => record.districtName && record.assessmentResult ? [`${record.districtName}\u0000${record.assessmentResult}`] : [])).map(({ label, count }) => { const [district, assessmentResult] = label.split('\u0000'); return { district, assessmentResult, count }; });
const report = await readReport();
const quality = report.restaurantHygieneGradingRecords?.dataQuality ?? { duplicateRecordCount: 0, missingBusinessNameCount: 0, missingRegistrationNumberCount: 0, missingAddressCount: 0, missingAssessmentResultCount: 0, unknownDistrictCount: 0, unknownAssessmentValueCount: 0 };
const summary: RestaurantHygieneGradingSummary = { generatedAt: new Date().toISOString(), totalRecords: records.length, uniqueBusinesses: new Set(records.map((record) => record.registrationNumberNormalized || `${record.businessNameNormalized}|${record.addressNormalized}`)).size, districtCount: byDistrict.length, assessmentResultCategoryCount: byAssessmentResult.length, recordsWithRegistrationNumbers: records.filter((record) => Boolean(record.registrationNumberNormalized)).length, topDistrict: byDistrict[0]?.district, byDistrict, byAssessmentResult, byAssessmentResultAndDistrict, dataQuality: quality };
await writeFile('public/data/restaurant-hygiene-grading-records/summary.json', `${JSON.stringify(summary, null, 2)}\n`);
if (report.restaurantHygieneGradingRecords) await writeReport({ ...report, restaurantHygieneGradingRecords: { ...report.restaurantHygieneGradingRecords, ...summary } });
console.log(`Built restaurant hygiene grading summary for ${records.length} records.`);
