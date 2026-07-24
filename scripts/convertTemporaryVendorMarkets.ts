import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { parseCsv, stableId } from './dataPipeline';
import type { TemporaryVendorMarketRecord, TemporaryVendorMarketSummary } from '../src/types';

const sourcePath = 'data/raw/temporary-vendor-markets/temporary-vendor-markets.csv';
const normalize = (value: string | undefined) => (value ?? '').replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
const parseTime = (value: string) => {
  const match = value.match(/^(\d{1,2}):(\d{2})$/) ?? value.match(/^(\d{1,2})(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]); const minutes = Number(match[2]);
  return hours < 24 && minutes < 60 ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}` : null;
};
const parseDms = (value: string, axis: 'longitude' | 'latitude') => {
  const withinTaipei = (number: number) => axis === 'longitude' ? number >= 121.3 && number <= 121.8 : number >= 24.85 && number <= 25.3;
  const decimal = Number(value); if (Number.isFinite(decimal)) return withinTaipei(decimal) ? decimal : null;
  const match = value.match(/^(\d{1,3})°(\d{1,2})'(\d{1,2}(?:\.\d+)?)$/);
  if (!match) return null;
  const result = Number(match[1]) + Number(match[2]) / 60 + Number(match[3]) / 3600;
  return withinTaipei(result) ? result : null;
};
const daysFor = (raw: string) => raw === '每日' ? ['每日'] : raw ? [raw] : [];

const bytes = await readFile(sourcePath);
const rows = parseCsv(new TextDecoder('big5').decode(bytes));
const seen = new Set<string>(); let duplicateCount = 0;
const records: TemporaryVendorMarketRecord[] = rows.flatMap((source) => {
  const rawSource = Object.fromEntries(Object.entries(source).map(([key, value]) => [key, normalize(value)]));
  const sourceSequenceNumber = rawSource.seqno ?? '';
  const districtName = rawSource.stitle ?? '';
  const operatorName = rawSource.xbody ?? '';
  const operatingDayRaw = rawSource.xcreatedDate ?? '';
  const startTimeRaw = rawSource.xstartTime ?? '';
  const endTimeRaw = rawSource.xendTime ?? '';
  const locationScope = rawSource.xAddress ?? '';
  const longitudeRaw = rawSource.GTag_longitude ?? '';
  const latitudeRaw = rawSource.GTag_latitude ?? '';
  const key = [sourceSequenceNumber, districtName, operatorName, operatingDayRaw, startTimeRaw, endTimeRaw, locationScope, longitudeRaw, latitudeRaw].join('|');
  if (seen.has(key)) { duplicateCount += 1; return []; } seen.add(key);
  const longitude = parseDms(longitudeRaw, 'longitude'); const latitude = parseDms(latitudeRaw, 'latitude');
  const hasValidCoordinates = longitude !== null && latitude !== null;
  return [{
    id: sourceSequenceNumber || stableId('temporary_vendor_market', [districtName, operatorName, locationScope, longitudeRaw, latitudeRaw, operatingDayRaw, startTimeRaw, endTimeRaw]),
    sourceSequenceNumber, districtName, operatorName, operatingDayRaw, operatingDays: daysFor(operatingDayRaw),
    startTimeRaw, startTime: parseTime(startTimeRaw), endTimeRaw, endTime: parseTime(endTimeRaw), locationScope,
    longitudeRaw, latitudeRaw, longitude, latitude, hasValidCoordinates, rawSource,
  }];
});
const countBy = (values: string[]) => [...values.reduce((map, value) => map.set(value, (map.get(value) ?? 0) + 1), new Map<string, number>()).entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'zh-Hant'));
const summary: TemporaryVendorMarketSummary = {
  sourceUrl: 'https://data.taipei/dataset/detail?id=c013d9ec-a550-46bd-ac60-45f085930706', sourceUpdatedAt: '2025-08-26 15:58:47', totalRecords: records.length, duplicateRecordCount: duplicateCount,
  districtCount: new Set(records.map((record) => record.districtName).filter(Boolean)).size, operatorCount: new Set(records.map((record) => record.operatorName).filter(Boolean)).size,
  validCoordinateCount: records.filter((record) => record.hasValidCoordinates).length, completeHoursCount: records.filter((record) => record.startTime && record.endTime).length,
  operatingDayCount: records.filter((record) => record.operatingDayRaw).length, byDistrict: countBy(records.map((record) => record.districtName).filter(Boolean)),
};
await mkdir('public/data/temporary-vendor-markets', { recursive: true });
await writeFile('public/data/temporary-vendor-markets/records.json', `${JSON.stringify(records, null, 2)}\n`);
await writeFile('public/data/temporary-vendor-markets/summary.json', `${JSON.stringify(summary, null, 2)}\n`);
console.log(`Converted ${records.length} temporary vendor market records (${duplicateCount} exact duplicates removed).`);
