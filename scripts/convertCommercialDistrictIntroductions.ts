import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import type {
  CommercialDistrictIntroductionRecord,
  CommercialDistrictIntroductionSummary,
  CommercialDistrictTagCategory,
  CommercialDistrictTypeCategory,
} from '../src/types';
import { parseCsv, readReport, stableId, writeReport } from './dataPipeline';

const RAW_DIR = 'data/raw/commercial-district-introductions';
const RECORDS_PATH = 'public/data/commercial-district-introductions.json';
const SUMMARY_PATH = 'public/data/commercial-district-introduction-summary.json';
const LOCAL_UPLOAD = '/Users/Leo/Downloads/114年6月臺北市商圈介紹.csv';
const SOURCE = '臺北市商圈介紹';
const SOURCE_AGENCY = '臺北市政府產業發展局商業處';

const AREA_CODE_TO_DISTRICT: Record<string, string> = {
  '63000010': '松山區',
  '63000020': '信義區',
  '63000030': '大安區',
  '63000040': '中山區',
  '63000050': '中正區',
  '63000060': '大同區',
  '63000070': '萬華區',
  '63000080': '文山區',
  '63000090': '南港區',
  '63000100': '內湖區',
  '63000110': '士林區',
  '63000120': '北投區',
};

const cleanText = (raw: unknown, preserveBreaks = false): string | undefined => {
  const text = String(raw ?? '')
    .replace(/\u3000/g, ' ')
    .replace(preserveBreaks ? /[ \t]+/g : /\s+/g, ' ')
    .trim();
  return text && !['-', '--', 'nan', 'null', '尚無資料'].includes(text.toLowerCase()) ? text : undefined;
};

const parseIntegerText = (raw: unknown) => {
  const text = cleanText(raw)?.replace(/,/g, '');
  if (!text) return undefined;
  const value = Number.parseInt(text, 10);
  return Number.isFinite(value) ? value : undefined;
};

const classifyTag = (raw?: string): CommercialDistrictTagCategory => {
  if (raw?.includes('吃')) return 'food';
  if (raw?.includes('買')) return 'shopping';
  if (raw?.includes('玩')) return 'leisure';
  return 'unknown';
};

const classifyType = (raw?: string): CommercialDistrictTypeCategory[] => {
  const text = raw ?? '';
  const categories = new Set<CommercialDistrictTypeCategory>();
  if (!text) return ['unknown'];
  if (/[餐飲小吃美食咖啡茶山產]/.test(text)) categories.add('food');
  if (text.includes('夜市')) categories.add('night_market');
  if (text.includes('市場')) categories.add('traditional_market');
  if (/服飾|精品|百貨|量販|零售|購物/.test(text)) categories.add('shopping');
  if (/百貨|影城|飯店/.test(text)) categories.add('department_store');
  if (text.includes('溫泉')) categories.add('hot_spring');
  if (/文創|藝文|古玩|創意|藝術/.test(text)) categories.add('cultural_creative');
  if (/旅館|飯店|酒店/.test(text)) categories.add('hospitality');
  if (/電腦|3C|電器|影音/.test(text)) categories.add('electronics');
  if (/寵物|鳥禽|水族/.test(text)) categories.add('pet');
  if (/汽車|機車/.test(text)) categories.add('automotive');
  if (/家具|家飾|生活用品|日用品/.test(text)) categories.add('home_living');
  if (/補習|才藝/.test(text)) categories.add('education');
  if (/醫療|養生|推拿|中醫/.test(text)) categories.add('medical_lifestyle');
  if (categories.size > 1) categories.add('mixed');
  return categories.size ? [...categories] : ['other'];
};

const parseNearbyMrt = (raw: unknown) => {
  const nearbyMrtRaw = cleanText(raw);
  const parts = nearbyMrtRaw?.split(/[、/,，]/).map((item) => item.trim()).filter(Boolean) ?? [];
  const lineCodes = new Set<string>();
  const stationNames = new Set<string>();
  parts.forEach((part) => {
    part.match(/\b[A-Z]{1,2}\d{0,2}A?\b/g)?.forEach((code) => lineCodes.add(code));
    part.match(/[\u4e00-\u9fffA-Za-z0-9]+站/g)?.forEach((station) => stationNames.add(station.replace(/^[A-Z]{1,2}\d{0,2}A?\s*/, '')));
  });
  return {
    nearbyMrtRaw,
    nearbyMrt: nearbyMrtRaw,
    nearbyMrtLineCodes: [...lineCodes],
    nearbyMrtStationNames: [...stationNames],
  };
};

const add = <T extends string>(map: Map<T, number>, value?: T) => {
  if (value) map.set(value, (map.get(value) ?? 0) + 1);
};

const top = <T extends string>(map: Map<T, number>) => [...map].sort((a, b) => b[1] - a[1]);

const firstCsv = async () => {
  await mkdir(RAW_DIR, { recursive: true });
  const files = (await readdir(RAW_DIR).catch(() => [])).filter((file) => file.endsWith('.csv'));
  if (files[0]) return path.join(RAW_DIR, files[0]);
  if (existsSync(LOCAL_UPLOAD)) {
    const target = path.join(RAW_DIR, path.basename(LOCAL_UPLOAD));
    await cp(LOCAL_UPLOAD, target);
    return target;
  }
  throw new Error(`Missing CSV. Put 114年6月臺北市商圈介紹.csv in ${RAW_DIR}.`);
};

const readCsvText = async (filePath: string) => {
  const bytes = await readFile(filePath);
  const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  return utf8.includes('\uFFFD') ? new TextDecoder('big5').decode(bytes) : utf8;
};

const sourceFile = await firstCsv();
const rows = parseCsv(await readCsvText(sourceFile));
const invalidAreaCodeExamples = new Set<string>();
const unparsedMrtExamples = new Set<string>();

const records: CommercialDistrictIntroductionRecord[] = rows.map((row) => {
  const sourceSequenceNumber = parseIntegerText(row.SeqNo);
  const commercialDistrictName = cleanText(row['商圈']) ?? '未命名商圈';
  const district = cleanText(row['區']) ?? '';
  const areaCode = cleanText(row.AreaCode);
  const districtFromAreaCode = areaCode ? AREA_CODE_TO_DISTRICT[areaCode] : undefined;
  const districtMismatch = Boolean(district && districtFromAreaCode && district !== districtFromAreaCode);
  const districtTag = cleanText(row['標籤']);
  const organizationName = cleanText(row['組織名稱']);
  const locationDescription = cleanText(row['坐落位置']) ?? '';
  const nearbyMrt = parseNearbyMrt(row['鄰近捷運']);
  const commercialDistrictType = cleanText(row['商圈類型']);
  const categories = classifyType(commercialDistrictType);
  const description = cleanText(row['說明'], true) ?? '';
  const googleMapsQuery = ['臺北市', district, commercialDistrictName].filter(Boolean).join(' ');
  if (areaCode && !districtFromAreaCode) invalidAreaCodeExamples.add(areaCode);
  if (nearbyMrt.nearbyMrt && nearbyMrt.nearbyMrtStationNames.length === 0) unparsedMrtExamples.add(nearbyMrt.nearbyMrt);

  return {
    id: stableId('commercial_district', [String(sourceSequenceNumber), commercialDistrictName, areaCode, locationDescription]),
    module: 'commercial_district_introductions',
    sourceSequenceNumber,
    commercialDistrictName,
    district,
    areaCode,
    districtFromAreaCode,
    districtMismatch,
    districtTagRaw: districtTag,
    districtTag,
    districtTagCategory: classifyTag(districtTag),
    organizationName,
    hasOrganizationName: Boolean(organizationName),
    locationDescription,
    ...nearbyMrt,
    commercialDistrictTypeRaw: commercialDistrictType,
    commercialDistrictType,
    commercialDistrictTypeCategories: categories,
    foodRelated: categories.some((item) => ['food', 'night_market', 'traditional_market'].includes(item)),
    shoppingRelated: categories.some((item) => ['shopping', 'department_store', 'home_living', 'electronics', 'pet'].includes(item)),
    leisureRelated: categories.some((item) => ['hot_spring', 'cultural_creative', 'hospitality'].includes(item)),
    nightMarketRelated: categories.includes('night_market'),
    traditionalMarketRelated: categories.includes('traditional_market'),
    hotSpringRelated: categories.includes('hot_spring'),
    culturalCreativeRelated: categories.includes('cultural_creative'),
    departmentStoreRelated: categories.includes('department_store'),
    transportationRelated: Boolean(nearbyMrt.nearbyMrt),
    description,
    descriptionPlainText: description.replace(/\s+/g, ' '),
    descriptionLength: description.length,
    locationPrecision: district ? 'district_centroid' : 'location_description_only',
    googleMapsQuery,
    source: SOURCE,
    sourceAgency: SOURCE_AGENCY,
  };
});

const districts = new Map<string, { areaCode?: string; records: CommercialDistrictIntroductionRecord[] }>();
const tags = new Map<string, number>();
const types = new Map<string, number>();
const typeCategories = new Map<CommercialDistrictTypeCategory, number>();
const mrtStations = new Map<string, { lineCodes: Set<string>; count: number }>();
const names = new Map<string, number>();
const locations = new Map<string, number>();

records.forEach((record) => {
  if (!districts.has(record.district)) districts.set(record.district, { areaCode: record.areaCode, records: [] });
  districts.get(record.district)!.records.push(record);
  add(tags, record.districtTag);
  add(types, record.commercialDistrictType);
  add(names, record.commercialDistrictName);
  add(locations, record.locationDescription);
  record.commercialDistrictTypeCategories.forEach((category) => add(typeCategories, category));
  record.nearbyMrtStationNames.forEach((stationName) => {
    const current = mrtStations.get(stationName) ?? { lineCodes: new Set<string>(), count: 0 };
    record.nearbyMrtLineCodes.forEach((code) => current.lineCodes.add(code));
    current.count += 1;
    mrtStations.set(stationName, current);
  });
});

const summary: CommercialDistrictIntroductionSummary = {
  totalRecords: records.length,
  districtCount: new Set(records.map((record) => record.district)).size,
  areaCodeCount: new Set(records.map((record) => record.areaCode).filter(Boolean)).size,
  districtTagCount: tags.size,
  organizationCount: new Set(records.map((record) => record.organizationName).filter(Boolean)).size,
  nearbyMrtStationCount: mrtStations.size,
  commercialDistrictTypeCount: types.size,
  recordsWithOrganizationName: records.filter((record) => record.hasOrganizationName).length,
  recordsWithCommercialDistrictType: records.filter((record) => record.commercialDistrictType).length,
  recordsWithNearbyMrt: records.filter((record) => record.nearbyMrt).length,
  foodRelatedCount: records.filter((record) => record.foodRelated).length,
  shoppingRelatedCount: records.filter((record) => record.shoppingRelated).length,
  leisureRelatedCount: records.filter((record) => record.leisureRelated).length,
  nightMarketRelatedCount: records.filter((record) => record.nightMarketRelated).length,
  traditionalMarketRelatedCount: records.filter((record) => record.traditionalMarketRelated).length,
  hotSpringRelatedCount: records.filter((record) => record.hotSpringRelated).length,
  culturalCreativeRelatedCount: records.filter((record) => record.culturalCreativeRelated).length,
  departmentStoreRelatedCount: records.filter((record) => record.departmentStoreRelated).length,
  byDistrict: [...districts].map(([district, item]) => ({
    district,
    areaCode: item.areaCode,
    commercialDistrictCount: item.records.length,
    foodRelatedCount: item.records.filter((record) => record.foodRelated).length,
    shoppingRelatedCount: item.records.filter((record) => record.shoppingRelated).length,
    leisureRelatedCount: item.records.filter((record) => record.leisureRelated).length,
    nightMarketRelatedCount: item.records.filter((record) => record.nightMarketRelated).length,
  })).sort((a, b) => b.commercialDistrictCount - a.commercialDistrictCount),
  byDistrictTag: top(tags).map(([districtTag, count]) => ({ districtTag, districtTagCategory: classifyTag(districtTag), count })),
  byCommercialDistrictTypeCategory: top(typeCategories).map(([category, count]) => ({ category, count })),
  byMrtStation: [...mrtStations].map(([stationName, value]) => ({
    stationName,
    lineCodes: [...value.lineCodes],
    count: value.count,
  })).sort((a, b) => b.count - a.count),
  topCommercialDistrictTypes: top(types).slice(0, 10).map(([commercialDistrictType, count]) => ({ commercialDistrictType, count })),
  dataQuality: {
    missingOrganizationNameCount: records.filter((record) => !record.organizationName).length,
    missingCommercialDistrictTypeCount: records.filter((record) => !record.commercialDistrictType).length,
    missingNearbyMrtCount: records.filter((record) => !record.nearbyMrt).length,
    districtMismatchCount: records.filter((record) => record.districtMismatch).length,
    duplicateCommercialDistrictNameCount: [...names.values()].filter((count) => count > 1).length,
    duplicateLocationDescriptionCount: [...locations.values()].filter((count) => count > 1).length,
    invalidAreaCodeCount: invalidAreaCodeExamples.size,
  },
};

await Promise.all([
  writeFile(RECORDS_PATH, `${JSON.stringify(records, null, 2)}\n`),
  writeFile(SUMMARY_PATH, `${JSON.stringify(summary, null, 2)}\n`),
]);

const report = await readReport();
await writeReport({
  ...report,
  commercialDistricts: {
    ...summary,
    source: SOURCE,
    sourceAgency: SOURCE_AGENCY,
    sourceFile,
    invalidAreaCodeExamples: [...invalidAreaCodeExamples],
    unparsedMrtExamples: [...unparsedMrtExamples].slice(0, 10),
  },
  notes: Array.from(
    new Set([
      ...(report.notes ?? []),
      'Commercial district introductions are district/context records, not exact store locations, boundaries, recommendations, or real-time business status.',
    ]),
  ),
});

try {
  const friendlySummaryPath = 'public/data/friendly-food-summary.json';
  const friendlySummary = JSON.parse(await readFile(friendlySummaryPath, 'utf8'));
  await writeFile(friendlySummaryPath, `${JSON.stringify({ ...friendlySummary, commercialDistricts: summary }, null, 2)}\n`);
} catch {
  // Existing summary is optional for standalone conversion.
}

console.log(`Converted ${records.length} commercial district introductions.`);
