import { mkdir, readFile, readdir, writeFile, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import type {
  TaipeiFoodTraceabilityBrandSummary,
  TaipeiFoodTraceabilityIngredientSummary,
  TaipeiFoodTraceabilityProductDetail,
  TaipeiFoodTraceabilityProductIndexItem,
  TaipeiFoodTraceabilitySearchItem,
  TaipeiFoodTraceabilitySummary,
} from '../src/types';
import { parseCsv, readReport, writeReport } from './dataPipeline';

const RAW_DIR = 'data/raw/taipei-food-traceability-products';
const PUBLIC_DIR = 'public/data/food-traceability';
const DETAIL_DIR = path.join(PUBLIC_DIR, 'product-details');
const SOURCE = '臺北市食材登錄平台';
const SOURCE_AGENCY = '臺北市政府衛生局';
const LOCAL_UPLOAD = '/Users/Leo/Downloads/foodtracer_all_productV320241108.csv';

type ProductBuilder = TaipeiFoodTraceabilityProductIndexItem & {
  ingredientNames: Set<string>;
  ingredientBrands: Set<string>;
  traceabilityUrls: Set<string>;
  calories: number[];
  ingredients: Map<string, { ingredientName: string; ingredientBrand?: string; rowIds: string[] }>;
};

const cleanText = (raw: unknown): string | undefined => {
  const text = String(raw ?? '').replace(/\u3000/g, ' ').trim();
  return text && !['-', '--', 'nan', 'null'].includes(text.toLowerCase()) ? text : undefined;
};

const normalizeName = (raw: unknown): string | undefined =>
  cleanText(raw)?.replace(/[，,。．.、／/（）()［\][\]\s]+/g, '').toLowerCase();

const key = (prefix: string, parts: Array<string | undefined>) =>
  `${prefix}_${createHash('sha1').update(parts.filter(Boolean).join('|')).digest('hex').slice(0, 14)}`;

const parseCalories = (raw: unknown) => {
  const caloriesRaw = cleanText(raw);
  if (!caloriesRaw) return {};
  const normalized = caloriesRaw.replace(/,/g, '').replace(/(大卡|kcal)/gi, '').trim();
  const caloriesKcal = Number(normalized);
  return Number.isFinite(caloriesKcal) ? { caloriesRaw, caloriesKcal } : { caloriesRaw, warning: caloriesRaw };
};

const parseServingSize = (raw: unknown) => {
  const servingSizeRaw = cleanText(raw);
  if (!servingSizeRaw) return {};
  const match = servingSizeRaw.match(/^約?\s*(\d+(?:\.\d+)?)\s*([a-zA-Z\u4e00-\u9fff]+)$/);
  return {
    servingSizeRaw,
    servingSizeValue: match ? Number(match[1]) : undefined,
    servingSizeUnit: match?.[2],
  };
};

const parseUrl = (raw: unknown) => {
  const traceabilityUrl = cleanText(raw);
  if (!traceabilityUrl) return {};
  try {
    const url = new URL(traceabilityUrl);
    if (!['http:', 'https:'].includes(url.protocol)) return { warning: traceabilityUrl };
    return { traceabilityUrl, traceabilityHostname: url.hostname };
  } catch {
    return { warning: traceabilityUrl };
  }
};

const top = <T extends string>(counts: Map<T, number>, limit = 10) =>
  [...counts].sort((a, b) => b[1] - a[1]).slice(0, limit);

const add = <T extends string>(counts: Map<T, number>, value?: T) => {
  if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
};

const firstCsv = async () => {
  await mkdir(RAW_DIR, { recursive: true });
  const files = (await readdir(RAW_DIR).catch(() => [])).filter((file) => file.endsWith('.csv'));
  if (files[0]) return path.join(RAW_DIR, files[0]);
  if (existsSync(LOCAL_UPLOAD)) {
    const target = path.join(RAW_DIR, path.basename(LOCAL_UPLOAD));
    await cp(LOCAL_UPLOAD, target);
    return target;
  }
  throw new Error(`Missing CSV. Put foodtracer_all_productV320241108.csv in ${RAW_DIR}.`);
};

const readCsvText = async (filePath: string) => {
  const bytes = await readFile(filePath);
  const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  return utf8.includes('\uFFFD') ? new TextDecoder('big5').decode(bytes) : utf8;
};

await mkdir(DETAIL_DIR, { recursive: true });
const sourceFile = await firstCsv();
const rows = parseCsv(await readCsvText(sourceFile));

const products = new Map<string, ProductBuilder>();
const companies = new Map<string, { companyKey: string; companyName: string; rowCount: number; products: Set<string>; brands: Set<string> }>();
const brands = new Map<string, TaipeiFoodTraceabilityBrandSummary & { products: Set<string>; ingredients: Set<string>; ingredientBrands: Set<string> }>();
const ingredients = new Map<string, TaipeiFoodTraceabilityIngredientSummary & { products: Set<string>; brands: Set<string>; companies: Set<string>; ingredientBrands: Set<string>; brandCounts: Map<string, number>; ingredientBrandCounts: Map<string, number> }>();
const administrativeAreaCodes = new Map<string, number>();
const companyRows = new Map<string, number>();
const brandRows = new Map<string, number>();
const ingredientBrandRows = new Map<string, number>();
const invalidCaloriesExamples = new Set<string>();
const invalidUrlExamples = new Set<string>();

let recordsWithServingSize = 0;
let recordsWithCalories = 0;
let recordsWithTraceabilityUrl = 0;

rows.forEach((row, index) => {
  const rowIndex = index + 1;
  const administrativeAreaCode = cleanText(row['行政區域代碼']);
  const companyName = cleanText(row['公司名稱']) ?? '未命名公司';
  const brandName = cleanText(row['品牌名稱']) ?? '未命名品牌';
  const productName = cleanText(row['產品名稱']) ?? '未命名產品';
  const ingredientName = cleanText(row['原料名稱']) ?? '未命名原料';
  const ingredientBrand = cleanText(row['原料品牌']);
  const companyNameNormalized = normalizeName(companyName);
  const brandNameNormalized = normalizeName(brandName);
  const productNameNormalized = normalizeName(productName);
  const ingredientNameNormalized = normalizeName(ingredientName);
  const ingredientBrandNormalized = normalizeName(ingredientBrand);
  const companyKey = key('company', [companyNameNormalized]);
  const brandKey = key('brand', [companyNameNormalized, brandNameNormalized]);
  const productKey = key('product', [companyNameNormalized, brandNameNormalized, productNameNormalized]);
  const ingredientKey = key('ingredient', [ingredientNameNormalized]);
  const rowId = key('trace_row', [String(rowIndex), productKey, ingredientNameNormalized, ingredientBrandNormalized]);
  const serving = parseServingSize(row['每一份量']);
  const calories = parseCalories(row['熱量大卡']);
  const url = parseUrl(row['相關資訊連結']);

  add(administrativeAreaCodes, administrativeAreaCode);
  add(companyRows, companyName);
  add(brandRows, brandName);
  add(ingredientBrandRows, ingredientBrand);
  if (serving.servingSizeRaw) recordsWithServingSize += 1;
  if (calories.caloriesKcal !== undefined) recordsWithCalories += 1;
  if (url.traceabilityUrl) recordsWithTraceabilityUrl += 1;
  if (calories.warning) invalidCaloriesExamples.add(calories.warning);
  if (url.warning) invalidUrlExamples.add(url.warning);

  if (!companies.has(companyKey)) companies.set(companyKey, { companyKey, companyName, rowCount: 0, products: new Set(), brands: new Set() });
  const company = companies.get(companyKey)!;
  company.rowCount += 1;
  company.products.add(productKey);
  company.brands.add(brandKey);

  if (!brands.has(brandKey)) {
    brands.set(brandKey, {
      brandKey,
      brandName,
      companyName,
      companyKey,
      productCount: 0,
      ingredientRowCount: 0,
      uniqueIngredientCount: 0,
      uniqueIngredientBrandCount: 0,
      hasTraceabilityUrlCount: 0,
      products: new Set(),
      ingredients: new Set(),
      ingredientBrands: new Set(),
    });
  }
  const brand = brands.get(brandKey)!;
  brand.ingredientRowCount += 1;
  if (url.traceabilityUrl) brand.hasTraceabilityUrlCount += 1;
  brand.products.add(productKey);
  brand.ingredients.add(ingredientKey);
  if (ingredientBrand) brand.ingredientBrands.add(ingredientBrand);

  if (!ingredients.has(ingredientKey)) {
    ingredients.set(ingredientKey, {
      ingredientKey,
      ingredientName,
      productCount: 0,
      brandCount: 0,
      companyCount: 0,
      ingredientBrandCount: 0,
      topBrands: [],
      topIngredientBrands: [],
      products: new Set(),
      brands: new Set(),
      companies: new Set(),
      ingredientBrands: new Set(),
      brandCounts: new Map(),
      ingredientBrandCounts: new Map(),
    });
  }
  const ingredient = ingredients.get(ingredientKey)!;
  ingredient.products.add(productKey);
  ingredient.brands.add(brandKey);
  ingredient.companies.add(companyKey);
  if (ingredientBrand) ingredient.ingredientBrands.add(ingredientBrand);
  add(ingredient.brandCounts, brandName);
  add(ingredient.ingredientBrandCounts, ingredientBrand);

  if (!products.has(productKey)) {
    products.set(productKey, {
      productKey,
      productName,
      productNameNormalized,
      companyName,
      brandName,
      companyKey,
      brandKey,
      ingredientCount: 0,
      uniqueIngredientBrandCount: 0,
      servingSizeRawExamples: [],
      caloriesKcalExamples: [],
      hasTraceabilityUrl: false,
      traceabilityUrl: undefined,
      detailChunkId: '',
      ingredientNames: new Set(),
      ingredientBrands: new Set(),
      traceabilityUrls: new Set(),
      calories: [],
      ingredients: new Map(),
    });
  }
  const product = products.get(productKey)!;
  product.ingredientNames.add(ingredientName);
  if (ingredientBrand) product.ingredientBrands.add(ingredientBrand);
  if (serving.servingSizeRaw && !product.servingSizeRawExamples.includes(serving.servingSizeRaw)) product.servingSizeRawExamples.push(serving.servingSizeRaw);
  if (calories.caloriesKcal !== undefined && !product.caloriesKcalExamples.includes(calories.caloriesKcal)) product.caloriesKcalExamples.push(calories.caloriesKcal);
  if (calories.caloriesKcal !== undefined) product.calories.push(calories.caloriesKcal);
  if (url.traceabilityUrl) {
    product.hasTraceabilityUrl = true;
    product.traceabilityUrl ??= url.traceabilityUrl;
    product.traceabilityUrls.add(url.traceabilityUrl);
  }
  const ingredientRowKey = `${ingredientName}|${ingredientBrand ?? ''}`;
  const existing = product.ingredients.get(ingredientRowKey) ?? { ingredientName, ingredientBrand, rowIds: [] };
  existing.rowIds.push(rowId);
  product.ingredients.set(ingredientRowKey, existing);
});

const productValues = [...products.values()].sort((a, b) => a.productName.localeCompare(b.productName, 'zh-Hant'));
const manifest: Record<string, string> = {};
const chunks: TaipeiFoodTraceabilityProductDetail[][] = [];

productValues.forEach((product, index) => {
  product.ingredientCount = product.ingredientNames.size;
  product.uniqueIngredientBrandCount = product.ingredientBrands.size;
  product.servingSizeRawExamples = product.servingSizeRawExamples.slice(0, 3);
  product.caloriesKcalExamples = product.caloriesKcalExamples.slice(0, 3);
  const chunkId = `chunk-${String(Math.floor(index / 500)).padStart(3, '0')}.json`;
  product.detailChunkId = chunkId;
  manifest[product.productKey] = chunkId;
  const chunkIndex = Math.floor(index / 500);
  chunks[chunkIndex] ??= [];
  chunks[chunkIndex].push({
    productKey: product.productKey,
    productName: product.productName,
    companyName: product.companyName,
    brandName: product.brandName,
    servingSizeRawExamples: product.servingSizeRawExamples,
    caloriesKcalExamples: product.caloriesKcalExamples,
    traceabilityUrls: [...product.traceabilityUrls],
    ingredients: [...product.ingredients.values()],
    source: SOURCE,
    sourceAgency: SOURCE_AGENCY,
  });
});

await Promise.all(
  chunks.map((chunk, index) => writeFile(path.join(DETAIL_DIR, `chunk-${String(index).padStart(3, '0')}.json`), `${JSON.stringify(chunk)}\n`)),
);

const productIndex: TaipeiFoodTraceabilityProductIndexItem[] = productValues.map(({ ingredientNames, ingredientBrands, traceabilityUrls, calories, ingredients, ...item }) => item);
const searchIndex: TaipeiFoodTraceabilitySearchItem[] = productValues.map((product) => ({
  ...productIndex.find((item) => item.productKey === product.productKey)!,
  topIngredientNames: [...product.ingredientNames].slice(0, 6),
  topIngredientBrands: [...product.ingredientBrands].slice(0, 6),
  hasCalories: product.calories.length > 0,
  hasServingSize: product.servingSizeRawExamples.length > 0,
  minCaloriesKcal: product.calories.length ? Math.min(...product.calories) : undefined,
  maxCaloriesKcal: product.calories.length ? Math.max(...product.calories) : undefined,
}));

const brandIndex = [...brands.values()].map(({ products, ingredients: ingredientSet, ingredientBrands, ...brand }) => ({
  ...brand,
  productCount: products.size,
  uniqueIngredientCount: ingredientSet.size,
  uniqueIngredientBrandCount: ingredientBrands.size,
}));
const ingredientIndex: TaipeiFoodTraceabilityIngredientSummary[] = [...ingredients.values()].map((ingredient) => ({
  ingredientKey: ingredient.ingredientKey,
  ingredientName: ingredient.ingredientName,
  productCount: ingredient.products.size,
  brandCount: ingredient.brands.size,
  companyCount: ingredient.companies.size,
  ingredientBrandCount: ingredient.ingredientBrands.size,
  topBrands: top(ingredient.brandCounts).map(([brandName, count]) => ({ brandName, count })),
  topIngredientBrands: top(ingredient.ingredientBrandCounts).map(([ingredientBrand, count]) => ({ ingredientBrand, count })),
}));
const companyIndex = [...companies.values()].map((company) => ({
  companyKey: company.companyKey,
  companyName: company.companyName,
  rowCount: company.rowCount,
  productCount: company.products.size,
  brandCount: company.brands.size,
}));

const summary: TaipeiFoodTraceabilitySummary = {
  totalRows: rows.length,
  companyCount: companies.size,
  brandCount: brands.size,
  productCount: products.size,
  ingredientCount: ingredients.size,
  ingredientBrandCount: ingredientBrandRows.size,
  recordsWithServingSize,
  recordsWithCalories,
  recordsWithTraceabilityUrl,
  administrativeAreaCodes: top(administrativeAreaCodes).map(([administrativeAreaCode, count]) => ({ administrativeAreaCode, count })),
  topCompaniesByRowCount: top(companyRows).map(([companyName, count]) => ({ companyName, count })),
  topBrandsByRowCount: top(brandRows).map(([brandName, count]) => ({ brandName, companyName: brandIndex.find((brand) => brand.brandName === brandName)?.companyName, count })),
  topProductsByIngredientCount: productValues
    .slice()
    .sort((a, b) => b.ingredientCount - a.ingredientCount)
    .slice(0, 10)
    .map((item) => ({
      productName: item.productName,
      brandName: item.brandName,
      companyName: item.companyName,
      ingredientCount: item.ingredientCount,
    })),
  topIngredientsByProductCount: ingredientIndex
    .slice()
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, 10)
    .map((item) => ({ ingredientName: item.ingredientName, productCount: item.productCount })),
  topIngredientBrandsByRowCount: top(ingredientBrandRows).map(([ingredientBrand, count]) => ({ ingredientBrand, count })),
};

await Promise.all([
  writeFile(path.join(PUBLIC_DIR, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`),
  writeFile(path.join(PUBLIC_DIR, 'companies.json'), `${JSON.stringify(companyIndex, null, 2)}\n`),
  writeFile(path.join(PUBLIC_DIR, 'brands.json'), `${JSON.stringify(brandIndex, null, 2)}\n`),
  writeFile(path.join(PUBLIC_DIR, 'products-index.json'), `${JSON.stringify(productIndex)}\n`),
  writeFile(path.join(PUBLIC_DIR, 'ingredients-index.json'), `${JSON.stringify(ingredientIndex)}\n`),
  writeFile(path.join(PUBLIC_DIR, 'search-index.json'), `${JSON.stringify(searchIndex)}\n`),
  writeFile(path.join(PUBLIC_DIR, 'chunk-manifest.json'), `${JSON.stringify(manifest)}\n`),
]);

const report = await readReport();
await writeReport({
  ...report,
  foodTraceability: {
    ...summary,
    source: SOURCE,
    sourceAgency: SOURCE_AGENCY,
    sourceFile,
    invalidCaloriesExamples: [...invalidCaloriesExamples].slice(0, 10),
    invalidUrlExamples: [...invalidUrlExamples].slice(0, 10),
  },
  notes: Array.from(
    new Set([
      ...(report.notes ?? []),
      'Food Traceability Platform records are source-field lookup data, not store locations, safety certification, nutrition advice, or product recommendations.',
    ]),
  ),
});

try {
  const friendlySummaryPath = 'public/data/friendly-food-summary.json';
  const friendlySummary = JSON.parse(await readFile(friendlySummaryPath, 'utf8'));
  await writeFile(friendlySummaryPath, `${JSON.stringify({ ...friendlySummary, foodTraceability: summary }, null, 2)}\n`);
} catch {
  // Existing summary is optional for standalone conversion.
}

console.log(`Converted ${rows.length} food-traceability rows into ${products.size} products.`);
