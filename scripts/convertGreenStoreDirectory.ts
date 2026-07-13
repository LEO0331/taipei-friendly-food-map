import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import type { GreenStoreDirectoryRecord } from '../src/types';
import { extractDistrictFromAddress, normalizeAddress, normalizeStoreName } from '../src/lib/friendlyFood';
import { parseCsv, readReport, stableId, writeReport } from './dataPipeline';

const RAW_DIR = 'data/raw/green-store-directory';
const RECORDS_PATH = 'public/data/green-store-directory/records.json';
const SOURCE = '臺北市綠色商店';
const SOURCE_AGENCY = '臺北市政府環境保護局';
const EMPTY_VALUES = new Set(['', '-', '--', 'null', 'nan', 'n/a']);

const clean = (value: unknown): string | undefined => {
  const text = String(value ?? '').replace(/\u3000/g, ' ').replace(/\s+/g, ' ').trim();
  return EMPTY_VALUES.has(text.toLowerCase()) ? undefined : text;
};

const digits = (value?: string) => value?.replace(/[^0-9]/g, '') || undefined;
const roadNameFromAddress = (address: string) =>
  address.match(/[\u4e00-\u9fff]+(?:路|街|大道|巷|弄)/)?.[0];

const decodeCsv = async (filePath: string) => {
  const bytes = await readFile(filePath);
  const decoders = ['utf-8', 'big5', 'cp950'];
  const candidates = decoders.flatMap((encoding) => {
    try {
      return [{ encoding, text: new TextDecoder(encoding).decode(bytes).replace(/^\uFEFF/, '') }];
    } catch {
      return [];
    }
  });
  const selected = candidates.sort((a, b) => {
    const score = (text: string) => (text.match(/\uFFFD/g)?.length ?? 0) * 100 + (text.match(/[序號綠色商店名稱聯絡地址]/g)?.length ?? 0) * -1;
    return score(a.text) - score(b.text);
  })[0];
  if (!selected) throw new Error('Unable to decode Green Store CSV as UTF-8-SIG, Big5, or CP950.');
  return { ...selected, rows: parseCsv(selected.text) };
};

const findSourceCsv = async () => {
  await mkdir(RAW_DIR, { recursive: true });
  const preferred = path.join(RAW_DIR, 'green-store-directory.csv');
  if (existsSync(preferred)) return preferred;
  const csv = (await readdir(RAW_DIR)).find((file) => file.toLowerCase().endsWith('.csv'));
  if (!csv) throw new Error(`Missing CSV. Run data:fetch:green-stores or put a CSV in ${RAW_DIR}.`);
  return path.join(RAW_DIR, csv);
};

const sourceFile = await findSourceCsv();
const { rows, encoding } = await decodeCsv(sourceFile);
const duplicateKeys = new Map<string, number>();
let missingStoreNameCount = 0;
let missingAddressCount = 0;
let unknownGreenStoreTypeCount = 0;

const records: GreenStoreDirectoryRecord[] = rows.map((row) => {
  const rawSource = {
    sourceSequenceNumber: clean(row['序號']),
    storeName: clean(row['綠色商店名稱']),
    address: clean(row['聯絡地址']),
    storeNumber: clean(row['商店編號']),
    contactPerson: clean(row['聯絡人']),
    phone: clean(row['聯絡電話']),
    extension: clean(row['分機']),
    mobile: clean(row['手機號碼']),
    greenStoreType: clean(row['綠色商店類型']),
  };
  const storeName = rawSource.storeName ?? '';
  const address = rawSource.address ?? '';
  const storeNameNormalized = normalizeStoreName(storeName);
  const addressNormalized = normalizeAddress(address);
  const storeNumberNormalized = digits(rawSource.storeNumber);
  const phoneNormalized = digits(rawSource.phone);
  const mobileNormalized = digits(rawSource.mobile);
  const primaryKey = rawSource.storeNumber
    ? `store-number:${storeNumberNormalized ?? rawSource.storeNumber}`
    : `name-address:${storeNameNormalized}|${addressNormalized}`;
  duplicateKeys.set(primaryKey, (duplicateKeys.get(primaryKey) ?? 0) + 1);
  if (!storeName) missingStoreNameCount += 1;
  if (!address) missingAddressCount += 1;
  if (!rawSource.greenStoreType) unknownGreenStoreTypeCount += 1;
  const fullContactNumber = [rawSource.phone, rawSource.extension && `ext. ${rawSource.extension}`]
    .filter(Boolean)
    .join(' ') || rawSource.mobile;

  return {
    id: stableId('green_store', [primaryKey, rawSource.sourceSequenceNumber]),
    module: 'green_store_directory',
    primaryKey,
    sourceSequenceNumber: rawSource.sourceSequenceNumber,
    storeName,
    storeNameNormalized,
    address,
    addressNormalized,
    districtNameFromAddress: extractDistrictFromAddress(address),
    roadName: roadNameFromAddress(address),
    storeNumber: rawSource.storeNumber,
    storeNumberNormalized,
    contactPerson: rawSource.contactPerson,
    phone: rawSource.phone,
    phoneNormalized,
    extension: rawSource.extension,
    mobile: rawSource.mobile,
    mobileNormalized,
    fullContactNumber: fullContactNumber || undefined,
    hasPhone: Boolean(phoneNormalized),
    greenStoreType: rawSource.greenStoreType,
    greenStoreTypeNormalized: normalizeStoreName(rawSource.greenStoreType),
    googleMapsQuery: [storeName, address].filter(Boolean).join(' '),
    rawSource,
    source: SOURCE,
    sourceAgency: SOURCE_AGENCY,
  };
});

await mkdir(path.dirname(RECORDS_PATH), { recursive: true });
await writeFile(RECORDS_PATH, `${JSON.stringify(records, null, 2)}\n`);

const report = await readReport();
await writeReport({
  ...report,
  greenStoreDirectory: {
    generatedAt: new Date().toISOString(),
    totalStores: records.length,
    uniqueStoreNames: new Set(records.map((record) => record.storeNameNormalized).filter(Boolean)).size,
    districtCount: new Set(records.map((record) => record.districtNameFromAddress).filter(Boolean)).size,
    greenStoreTypeCount: new Set(records.map((record) => record.greenStoreTypeNormalized).filter(Boolean)).size,
    recordsWithPhone: records.filter((record) => record.hasPhone).length,
    recordsWithMobile: records.filter((record) => record.mobileNormalized).length,
    recordsWithContactNumber: records.filter((record) => record.fullContactNumber).length,
    byDistrict: [], byGreenStoreType: [], byPhoneAvailability: [],
    topDistrict: undefined, topGreenStoreType: undefined,
    dataQuality: {
      duplicateRecordCount: records.length - new Set(records.map((record) => record.primaryKey)).size,
      duplicatePrimaryKeyCount: [...duplicateKeys.values()].filter((count) => count > 1).length,
      missingStoreNameCount, missingAddressCount, unknownGreenStoreTypeCount,
    },
    source: SOURCE, sourceAgency: SOURCE_AGENCY, sourceFile: `${sourceFile} (${encoding})`,
    duplicateRecordCount: records.length - new Set(records.map((record) => record.primaryKey)).size,
    duplicatePrimaryKeyCount: [...duplicateKeys.values()].filter((count) => count > 1).length,
    missingStoreNameCount, missingAddressCount, unknownGreenStoreTypeCount,
  },
  notes: Array.from(new Set([...(report.notes ?? []), 'Green Store records have addresses but no confirmed official coordinates; exact map markers are not generated.'])),
});
console.log(`Converted ${records.length} Green Store records from ${sourceFile} (${encoding}).`);
