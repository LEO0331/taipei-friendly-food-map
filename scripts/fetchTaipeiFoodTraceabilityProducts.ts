import { mkdir, stat, writeFile, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { readReport, writeReport } from './dataPipeline';

const RAW_DIR = 'data/raw/taipei-food-traceability-products';
const TARGET = path.join(RAW_DIR, 'foodtracer_all_product.csv');
const LOCAL_UPLOAD = '/Users/Leo/Downloads/foodtracer_all_productV320241108.csv';
const SOURCE_URL =
  'https://data.taipei/api/frontstage/tpeod/dataset/resource.download?rid=29869b6f-1cd3-4ce8-8c78-eb85aeea8583';
const args = new Set(process.argv.slice(2));

await mkdir(RAW_DIR, { recursive: true });

if (!args.has('--force') && existsSync(TARGET)) {
  console.log(`${TARGET} already exists.`);
  process.exit(0);
}

let note = '';
try {
  const response = await fetch(SOURCE_URL);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  await writeFile(TARGET, Buffer.from(await response.arrayBuffer()));
  note = 'Downloaded official Taipei Food Traceability CSV.';
} catch (error) {
  if (!existsSync(LOCAL_UPLOAD)) throw error;
  await cp(LOCAL_UPLOAD, TARGET);
  note = `Official download failed; copied local upload. ${String(error)}`;
}

const report = await readReport();
await writeReport({
  ...report,
  downloads: [
    ...(report.downloads ?? []),
    {
      sourceUrl: SOURCE_URL,
      downloadedAt: new Date().toISOString(),
      filePath: TARGET,
      fileSize: (await stat(TARGET)).size,
      notes: note,
    },
  ],
});
console.log(note);
