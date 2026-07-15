import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import type { RestaurantHygieneGradingRecord } from '../src/types';
import { normalizeAddress, normalizeStoreName } from '../src/lib/friendlyFood';
import { parseCsv, readReport, stableId, writeReport } from './dataPipeline';

const RAW_DIR = 'data/raw/restaurant-hygiene-grading-records';
const RECORDS_PATH = 'public/data/restaurant-hygiene-grading-records/records.json';
const SOURCE = 'https://data.taipei/dataset/detail?id=59579c19-a561-4564-8c0f-545bfb32c0f6';
const SOURCE_AGENCY = '臺北市政府衛生局';
const DISTRICTS: Record<string, string> = {
  '63000010': '松山區', '63000020': '信義區', '63000030': '大安區', '63000040': '中山區',
  '63000050': '中正區', '63000060': '大同區', '63000070': '萬華區', '63000080': '文山區',
  '63000090': '南港區', '63000100': '內湖區', '63000110': '士林區', '63000120': '北投區',
};
const districtFromAddress = (address: string) => Object.values(DISTRICTS).find((district) => address.replaceAll('台', '臺').includes(district));
const clean = (value: unknown) => String(value ?? '').replace(/\u3000/g, ' ').replace(/\s+/g, ' ').trim();
const normalizedCode = (value: string) => value.replace(/\D/g, '');
const roadName = (address: string) => address.match(/[\u4e00-\u9fff]+(?:路|街|大道)/)?.[0];

async function sourceCsv() {
  await mkdir(RAW_DIR, { recursive: true });
  const preferred = path.join(RAW_DIR, 'restaurant-hygiene-grading-records.csv');
  if (existsSync(preferred)) return preferred;
  const file = (await readdir(RAW_DIR)).find((entry) => entry.toLowerCase().endsWith('.csv'));
  if (!file) throw new Error(`Missing CSV. Run data:fetch:restaurant-hygiene-grading or put an official CSV in ${RAW_DIR}.`);
  return path.join(RAW_DIR, file);
}

const sourceFile = await sourceCsv();
const bytes = await readFile(sourceFile);
const candidates = ['utf-8', 'big5', 'cp950'].flatMap((encoding) => {
  try { return [{ encoding, text: new TextDecoder(encoding).decode(bytes).replace(/^\uFEFF/, '') }]; } catch { return []; }
});
const requiredHeaders = ['行政區域代碼', '業者名稱店名', '食品業者登錄字號', '地址', '評核結果'];
const decoded = candidates.sort((a, b) => requiredHeaders.filter((header) => b.text.includes(header)).length - requiredHeaders.filter((header) => a.text.includes(header)).length || (a.text.match(/\uFFFD/g)?.length ?? 0) - (b.text.match(/\uFFFD/g)?.length ?? 0))[0];
if (!decoded || !requiredHeaders.every((header) => decoded.text.includes(header))) throw new Error('Unable to decode CSV as UTF-8-SIG, Big5, or CP950 with the required source fields.');
const rows = parseCsv(decoded.text);
const missing = { businessName: 0, registration: 0, address: 0, assessment: 0, unknownDistrict: 0, unknownAssessment: 0 };
const duplicateKeys = new Set<string>();
let duplicateRecordCount = 0;
const records: RestaurantHygieneGradingRecord[] = [];
for (const row of rows) {
  const rawSource = { districtCode: clean(row['行政區域代碼']), businessName: clean(row['業者名稱店名']), foodBusinessRegistrationNumber: clean(row['食品業者登錄字號']), address: clean(row['地址']), assessmentResult: clean(row['評核結果']) };
  const districtCodeNormalized = normalizedCode(rawSource.districtCode);
  const districtName = DISTRICTS[districtCodeNormalized] ?? districtFromAddress(rawSource.address);
  const businessNameNormalized = normalizeStoreName(rawSource.businessName);
  const registrationNumberNormalized = rawSource.foodBusinessRegistrationNumber.replace(/\s+/g, '').toUpperCase();
  const addressNormalized = normalizeAddress(rawSource.address);
  const assessmentResultNormalized = normalizeStoreName(rawSource.assessmentResult);
  const duplicateKey = [registrationNumberNormalized, businessNameNormalized, addressNormalized, assessmentResultNormalized].join('|');
  if (duplicateKeys.has(duplicateKey)) { duplicateRecordCount += 1; continue; }
  duplicateKeys.add(duplicateKey);
  if (!rawSource.businessName) missing.businessName += 1;
  if (!rawSource.foodBusinessRegistrationNumber) missing.registration += 1;
  if (!rawSource.address) missing.address += 1;
  if (!rawSource.assessmentResult) missing.assessment += 1;
  if (!districtName) missing.unknownDistrict += 1;
  if (!assessmentResultNormalized) missing.unknownAssessment += 1;
  records.push({ id: stableId('restaurant_hygiene_grading', [duplicateKey]), module: 'restaurant_hygiene_grading_records', districtCode: rawSource.districtCode, districtName, districtCodeNormalized, businessName: rawSource.businessName, businessNameNormalized, foodBusinessRegistrationNumber: rawSource.foodBusinessRegistrationNumber, registrationNumberNormalized, address: rawSource.address, addressNormalized, roadName: roadName(rawSource.address), assessmentResult: rawSource.assessmentResult, assessmentResultNormalized, googleMapsQuery: [rawSource.businessName, rawSource.address].filter(Boolean).join(' '), rawSource, source: SOURCE, sourceAgency: SOURCE_AGENCY });
}
await mkdir(path.dirname(RECORDS_PATH), { recursive: true });
await writeFile(RECORDS_PATH, `${JSON.stringify(records, null, 2)}\n`);
const report = await readReport();
await writeReport({ ...report, restaurantHygieneGradingRecords: { generatedAt: new Date().toISOString(), totalRecords: records.length, uniqueBusinesses: new Set(records.map((record) => record.registrationNumberNormalized || `${record.businessNameNormalized}|${record.addressNormalized}`)).size, districtCount: new Set(records.map((record) => record.districtName).filter(Boolean)).size, assessmentResultCategoryCount: new Set(records.map((record) => record.assessmentResultNormalized).filter(Boolean)).size, recordsWithRegistrationNumbers: records.filter((record) => Boolean(record.registrationNumberNormalized)).length, byDistrict: [], byAssessmentResult: [], byAssessmentResultAndDistrict: [], topDistrict: undefined, dataQuality: { duplicateRecordCount, missingBusinessNameCount: missing.businessName, missingRegistrationNumberCount: missing.registration, missingAddressCount: missing.address, missingAssessmentResultCount: missing.assessment, unknownDistrictCount: missing.unknownDistrict, unknownAssessmentValueCount: missing.unknownAssessment }, source: SOURCE, sourceAgency: SOURCE_AGENCY, sourceFile: `${sourceFile} (${decoded.encoding})` }, notes: Array.from(new Set([...(report.notes ?? []), 'Restaurant hygiene grading records have addresses but no confirmed official coordinates; exact map markers are not generated.'])) });
console.log(`Converted ${records.length} restaurant hygiene grading records from ${sourceFile} (${decoded.encoding}); skipped ${duplicateRecordCount} duplicates.`);
