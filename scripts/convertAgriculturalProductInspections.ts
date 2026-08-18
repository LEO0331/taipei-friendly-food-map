import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { AgriculturalProductInspectionRecord, AgriculturalProductInspectionSummary } from '../src/types';
import { parseCsv, readReport, stableId, writeReport } from './dataPipeline';

const raw = 'data/raw/agricultural-product-inspections/inspections.csv';
const outputDir = 'public/data/agricultural-product-inspections';
const source = 'https://data.taipei/dataset/detail?id=8ab917b0-1029-4003-b776-f169b4e561f1';
const fields = { year: '\u5e74\u5ea6', category: '\u985e\u5225', item: '\u9805\u76ee', inspected: '\u62bd\u9a57\u4ef6\u6578/\u5834', qualified: '\u5408\u683c[\u4ef6/\u5834]', unqualified: '\u4e0d\u5408\u683c[\u4ef6/\u5834]', passRate: '\u5408\u683c\u7387' };
const normalize = (value: unknown) => String(value ?? '').replace(/\u3000/g, ' ').replace(/\s+/g, ' ').trim();
const numberValue = (value: unknown): number | null => {
  const normalized = normalize(value).replaceAll(',', '').replace('%', '');
  if (!normalized) return null;
  const result = Number(normalized);
  return Number.isFinite(result) ? result : null;
};
const bytes = await readFile(raw);
let decoded = '';
for (const encoding of ['big5', 'cp950', 'utf-8']) {
  try {
    const text = new TextDecoder(encoding).decode(bytes).replace(/^\uFEFF/, '');
    if (text.includes(fields.year) && text.includes(fields.inspected)) { decoded = text; break; }
  } catch { /* Try the next supported encoding. */ }
}
if (!decoded) throw new Error('Could not decode inspection CSV with Big5, CP950, or UTF-8.');
const quality = { inconsistentRowCount: 0, passRateDiscrepancyCount: 0, malformedNumericCount: 0 };
const records: AgriculturalProductInspectionRecord[] = parseCsv(decoded).map((row) => {
  const rocYear = numberValue(row[fields.year]);
  const inspected = numberValue(row[fields.inspected]);
  const qualified = numberValue(row[fields.qualified]);
  const unqualified = numberValue(row[fields.unqualified]);
  const officialPassRate = numberValue(row[fields.passRate]);
  if ([row[fields.year], row[fields.inspected], row[fields.qualified], row[fields.unqualified]].some((value) => normalize(value) && numberValue(value) === null)) quality.malformedNumericCount += 1;
  if (inspected !== null && qualified !== null && unqualified !== null && qualified + unqualified > inspected) quality.inconsistentRowCount += 1;
  if (inspected && qualified !== null && officialPassRate !== null && Math.abs((qualified / inspected) * 100 - officialPassRate) > 0.15) quality.passRateDiscrepancyCount += 1;
  const category = normalize(row[fields.category]); const item = normalize(row[fields.item]);
  return { id: stableId('agricultural_inspection', [String(rocYear), category, item]), rocYear, year: rocYear === null ? null : rocYear + 1911, category, item, inspected, qualified, unqualified, officialPassRate, source };
});
const years = records.flatMap((record) => record.rocYear === null ? [] : [record.rocYear]);
const summary: AgriculturalProductInspectionSummary = { generatedAt: new Date().toISOString(), sourceUpdatedAt: '2026-07-09T16:54:51+08:00', source, sourceAgency: '\u81fa\u5317\u5e02\u653f\u5e9c\u7522\u696d\u767c\u5c55\u5c40', importedRowCount: records.length, earliestRocYear: years.length ? Math.min(...years) : undefined, latestRocYear: years.length ? Math.max(...years) : undefined, dataQuality: quality };
await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, 'records.json'), `${JSON.stringify(records, null, 2)}\n`);
await writeFile(path.join(outputDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
const report = await readReport();
await writeReport({ ...report, agriculturalProductInspections: summary });
console.log(`Converted ${records.length} agricultural product inspection records.`);
