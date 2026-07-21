import { readFile, writeFile } from 'node:fs/promises';
import type { OrganicFarmRecord, OrganicFarmSummary } from '../src/types';
import { readReport, writeReport } from './dataPipeline';

const records = JSON.parse(await readFile('public/data/organic-farms/records.json', 'utf8')) as OrganicFarmRecord[];
const districtNames = [...new Set(records.map((record) => record.districtName).filter(Boolean))];
const byDistrict = districtNames.map((district) => ({
  district,
  count: records.filter((record) => record.districtName === district).length,
  areaHectares: records.filter((record) => record.districtName === district).reduce((sum, record) => sum + (record.areaHectares ?? 0), 0),
})).sort((a, b) => b.count - a.count);
const report = await readReport();
const summary: OrganicFarmSummary = {
  generatedAt: new Date().toISOString(), totalFarms: records.length,
  uniqueFarms: new Set(records.map((record) => record.farmName).filter(Boolean)).size,
  districtCount: byDistrict.length, totalAreaHectares: records.reduce((sum, record) => sum + (record.areaHectares ?? 0), 0),
  foodEducationCount: records.filter((record) => record.hasFoodEducationExperience).length,
  beekeepingCount: records.filter((record) => record.hasBeekeeping).length,
  poultryRaisingCount: records.filter((record) => record.hasPoultryRaising).length,
  certificationCount: records.filter((record) => Boolean(record.certificationNumber)).length,
  byDistrict,
  areaDistribution: [['0–1', 0, 1], ['1–5', 1, 5], ['5+', 5, Infinity]].map(([range, min, max]) => ({ range: String(range), count: records.filter((record) => record.areaHectares !== null && record.areaHectares >= Number(min) && record.areaHectares < Number(max)).length })),
  dataQuality: report.organicFarms?.dataQuality ?? { duplicateCount: 0, invalidAreaCount: 0, missingFarmNameCount: 0, unknownDistrictCount: 0, unrecognizedYesNoValueCount: 0 },
};
await writeFile('public/data/organic-farms/summary.json', `${JSON.stringify(summary, null, 2)}\n`);
if (report.organicFarms) await writeReport({ ...report, organicFarms: { ...report.organicFarms, ...summary } });
console.log(`Built organic farm summary for ${records.length} records.`);
