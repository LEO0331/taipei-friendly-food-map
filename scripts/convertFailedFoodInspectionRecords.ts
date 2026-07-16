import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { FailedFoodInspectionRecord } from '../src/types';
import { parseCsv, readReport, stableId, writeReport } from './dataPipeline';

const rawDir = 'data/raw/failed-food-inspection-records';
const output = 'public/data/failed-food-inspection-records/records.json';
const source = 'https://data.taipei/dataset/detail?id=09a917a0-0fb5-47e1-957c-5f1268fba517';
const agency = '臺北市政府衛生局';
const resourceNames: Record<string, string> = { '113': '113年度臺北市衛生局食品抽驗不合格清冊', '112': '112年度臺北市衛生局食品抽驗不合格清冊', '111': '111年度臺北市衛生局食品抽驗不合格清冊' };
const postalDistricts: Record<string, string> = { '100': '中正區', '103': '大同區', '104': '中山區', '105': '松山區', '106': '大安區', '108': '萬華區', '110': '信義區', '111': '士林區', '112': '北投區', '114': '內湖區', '115': '南港區', '116': '文山區' };
const districtFromLocation = (value: string) => Object.values(postalDistricts).find((district) => value.replaceAll('台', '臺').includes(district)) ?? '';
const clean = (value: unknown) => String(value ?? '').replace(/\u3000/g, ' ').replace(/\s+/g, ' ').trim();
function decode(bytes: Buffer) {
  const fields = ['專案名稱', '抽驗日期', '分類', '檢體名稱', '抽驗行政郵遞區號', '抽驗地點', '檢驗結果', '不符合規定原因'];
  const candidates = ['utf-8', 'big5', 'cp950'].flatMap((encoding) => { try { return [{ encoding, text: new TextDecoder(encoding).decode(bytes).replace(/^\uFEFF/, '') }]; } catch { return []; } });
  const item = candidates.sort((a, b) => fields.filter((field) => b.text.includes(field)).length - fields.filter((field) => a.text.includes(field)).length)[0];
  if (!item || !fields.every((field) => item.text.includes(field))) throw new Error('CSV has unexpected headers after UTF-8-SIG, Big5, and CP950 decoding.');
  return { ...item, rows: parseCsv(item.text) };
}
function parseDate(raw: string): { date: string | null; year: number | null } {
  const value = raw.trim().replace(/[.]/g, '/');
  const compact = value.match(/^(\d{4}|\d{3})(\d{2})(\d{2})$/);
  const match = compact ?? value.match(/(\d{2,4})\s*[/-]\s*(\d{1,2})\s*[/-]\s*(\d{1,2})/);
  if (!match) return { date: null, year: null };
  let year = Number(match[1]); if (year < 1911) year += 1911;
  const month = Number(match[2]); const day = Number(match[3]);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (month < 1 || month > 12 || day < 1 || candidate.getUTCFullYear() !== year || candidate.getUTCMonth() !== month - 1 || candidate.getUTCDate() !== day) return { date: null, year: null };
  return { date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`, year };
}
await mkdir(rawDir, { recursive: true });
const files = (await readdir(rawDir)).filter((file) => file.endsWith('.csv')).sort().reverse();
if (!files.length) throw new Error('Missing annual CSVs. Run data:fetch:failed-food-inspections first.');
const records: FailedFoodInspectionRecord[] = []; const keys = new Set<string>();
const quality = { invalidDateCount: 0, duplicateRowCount: 0, missingLocationCount: 0, unknownCategoryCount: 0, unresolvedDistrictCount: 0 };
for (const file of files) {
  const sourceYear = Number(file.match(/\d{3}/)?.[0]) || null; const decoded = decode(await readFile(path.join(rawDir, file)));
  for (const row of decoded.rows) {
    const projectName = clean(row['專案名稱']); const inspectionDateRaw = clean(row['抽驗日期']); const category = clean(row['分類']); const sampleName = clean(row['檢體名稱']); const inspectionPostalCode = clean(row['抽驗行政郵遞區號']); const inspectionLocation = clean(row['抽驗地點']); const inspectionResult = clean(row['檢驗結果']); const noncomplianceReason = clean(row['不符合規定原因']);
    const parsed = parseDate(inspectionDateRaw); const districtName = postalDistricts[inspectionPostalCode.match(/\d{3}/)?.[0] ?? ''] ?? districtFromLocation(inspectionLocation);
    const key = [parsed.date ?? inspectionDateRaw, sampleName, inspectionLocation, inspectionResult, noncomplianceReason].join('|');
    if (keys.has(key)) { quality.duplicateRowCount += 1; continue; } keys.add(key);
    if (inspectionDateRaw && !parsed.date) quality.invalidDateCount += 1; if (!inspectionLocation) quality.missingLocationCount += 1; if (!category) quality.unknownCategoryCount += 1; if (!districtName) quality.unresolvedDistrictCount += 1;
    records.push({ id: stableId('failed_food_inspection', [String(sourceYear), key]), sourceYear, sourceResourceName: resourceNames[String(sourceYear)] ?? file, projectName, inspectionDateRaw, inspectionDate: parsed.date, inspectionYear: parsed.year, category, sampleName, inspectionPostalCode, districtName, inspectionLocation, inspectionResult, noncomplianceReason, googleMapsQuery: inspectionLocation, rawSource: { projectName, inspectionDateRaw, category, sampleName, inspectionPostalCode, inspectionLocation, inspectionResult, noncomplianceReason }, source, sourceAgency: agency });
  }
}
await mkdir(path.dirname(output), { recursive: true }); await writeFile(output, `${JSON.stringify(records, null, 2)}\n`);
const report = await readReport();
await writeReport({ ...report, failedFoodInspectionRecords: { generatedAt: new Date().toISOString(), totalRecords: records.length, latestInspectionDate: undefined, yearsCovered: 0, foodCategoryCount: 0, uniqueSampleNames: 0, districtCount: 0, byYear: [], byMonth: [], byCategory: [], byNoncomplianceReason: [], byDistrict: [], byCategoryAndYear: [], dataQuality: quality, source, sourceAgency: agency, sourceFiles: files } });
console.log(`Converted ${records.length} failed food inspection records from ${files.length} annual CSV resources.`);
