import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import type { ConversionReport, FriendlyStore, RestaurantBusiness } from '../src/types';
import {
  extractDistrictFromAddress,
  matchEnglishFriendlyStore,
  matchRestaurantToFriendlyStore,
  normalizeColumnName,
  parseCoordinate,
  parseFriendlyServiceCounts,
  parseFriendlyServiceTags,
  validateTaipeiCoordinate,
} from '../src/lib/friendlyFood';

export const RAW_DIR = 'data/raw/friendly-food';
export const PUBLIC_DATA_DIR = 'public/data';
export const FRIENDLY_ZH_RAW = path.join(RAW_DIR, 'friendly-stores-zh.csv');
export const FRIENDLY_EN_RAW = path.join(RAW_DIR, 'friendly-stores-en.csv');
export const RESTAURANTS_RAW = path.join(RAW_DIR, 'restaurant-businesses.csv');
export const REPORT_PATH = path.join(PUBLIC_DATA_DIR, 'conversion-report.json');

export const DATA_SOURCES = {
  friendlyZh:
    'https://data.taipei/api/frontstage/tpeod/dataset/resource.download?rid=5a5b36e0-f870-4b7f-8378-c91ac5f57941',
  friendlyEn:
    'https://data.taipei/api/frontstage/tpeod/dataset/resource.download?rid=ea1dba51-513d-4b43-bb1a-78cc02363177',
  restaurants:
    'https://data.taipei/api/frontstage/tpeod/dataset/resource.download?rid=e94a712a-be5b-4d8b-89c9-30a5ee21f25d',
};

export const ensureDataDirs = async () => {
  await mkdir(RAW_DIR, { recursive: true });
  await mkdir(PUBLIC_DATA_DIR, { recursive: true });
};

export const parseCsv = (text: string): Record<string, string>[] => {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  const source = text.replace(/^\uFEFF/, '');
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(field);
      field = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(field);
      if (row.some((cell) => cell.trim() !== '')) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  row.push(field);
  if (row.some((cell) => cell.trim() !== '')) rows.push(row);
  const headers = rows.shift()?.map(normalizeColumnName) ?? [];
  return rows.map((cells) =>
    headers.reduce<Record<string, string>>((record, header, index) => {
      record[header] = (cells[index] ?? '').trim();
      return record;
    }, {}),
  );
};

export const readCsvRows = async (filePath: string): Promise<Record<string, string>[]> =>
  parseCsv(await readFile(filePath, 'utf8'));

export const stableId = (prefix: string, parts: Array<string | undefined>): string => {
  const hash = createHash('sha1').update(parts.filter(Boolean).join('|')).digest('hex').slice(0, 12);
  return `${prefix}_${hash}`;
};

export const readReport = async (): Promise<ConversionReport> => {
  try {
    return JSON.parse(await readFile(REPORT_PATH, 'utf8')) as ConversionReport;
  } catch {
    return { generatedAt: new Date().toISOString(), notes: [] };
  }
};

export const writeReport = async (report: ConversionReport) => {
  await ensureDataDirs();
  await writeFile(REPORT_PATH, `${JSON.stringify({ ...report, generatedAt: new Date().toISOString() }, null, 2)}\n`);
};

export const convertFriendlyStoresFromRows = (
  zhRows: Record<string, string>[],
  enRows: Record<string, string>[],
): { stores: FriendlyStore[]; englishMatches: number } => {
  let englishMatches = 0;
  const stores = zhRows.map((row) => {
    const longitude = parseCoordinate(row['經度']);
    const latitude = parseCoordinate(row['緯度']);
    const serviceTagCounts = parseFriendlyServiceCounts(row);
    const base: FriendlyStore = {
      id: stableId('friendly', [row['友善店家名稱'], row['地址'], row['經度'], row['緯度']]),
      layer: 'friendly_store',
      nameZh: row['友善店家名稱'] || '未命名友善店家',
      addressZh: row['地址'] || '',
      district: extractDistrictFromAddress(row['地址'] || ''),
      longitude,
      latitude,
      coordinateStatus: validateTaipeiCoordinate(longitude, latitude),
      phone: row['電話'] || undefined,
      descriptionZh: row['簡介'] || undefined,
      serviceTags: parseFriendlyServiceTags(row),
      serviceTagCounts,
      totalFriendlyItems: Number(row['友善項目總計']) || Object.values(serviceTagCounts).reduce((sum, count) => sum + count, 0),
      websiteUrl: row['友善店家網站個別店家介紹網址'] || undefined,
      source: '友善店家清冊（繁體中文）',
    };
    const english = matchEnglishFriendlyStore(base, enRows);
    if (english.nameEn || english.addressEn || english.descriptionEn) englishMatches += 1;
    return { ...base, ...english };
  });
  return { stores, englishMatches };
};

export const convertRestaurantBusinessesFromRows = (
  rows: Record<string, string>[],
  friendlyStores: FriendlyStore[],
): RestaurantBusiness[] =>
  rows.map((row) => {
    const longitude = parseCoordinate(row.Longitude);
    const latitude = parseCoordinate(row.Latitude);
    const base: RestaurantBusiness = {
      id: stableId('restaurant', [row['統一編號'], row['商業名稱'], row['商業地址'], row.Longitude, row.Latitude]),
      layer: 'registered_restaurant_business',
      businessRegistrationId: row['統一編號'] || undefined,
      name: row['商業名稱'] || '未命名餐館業登記店家',
      address: row['商業地址'] || '',
      district: extractDistrictFromAddress(row['商業地址'] || ''),
      longitude,
      latitude,
      coordinateStatus: validateTaipeiCoordinate(longitude, latitude),
      source: '設址臺北市所營事業含餐館業清冊',
    };
    return { ...base, ...matchRestaurantToFriendlyStore(base, friendlyStores) };
  });
