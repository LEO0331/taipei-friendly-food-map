import { cp, mkdir, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { readReport, writeReport } from './dataPipeline';

const RAW_DIR = 'data/raw/restaurant-hygiene-grading-records';
const TARGET = path.join(RAW_DIR, 'restaurant-hygiene-grading-records.csv');
const SOURCE_URL = 'https://data.taipei/api/frontstage/tpeod/dataset/resource.download?rid=c5646d80-9118-4439-b924-075f96371d75';
const args = process.argv.slice(2);
const localIndex = args.indexOf('--local');
const localFile = localIndex >= 0 ? args[localIndex + 1] : undefined;
const force = args.includes('--force');

if (localIndex >= 0 && !localFile) throw new Error('Expected a CSV path after --local.');
await mkdir(RAW_DIR, { recursive: true });
let sourceUrl = SOURCE_URL;
let notes: string;
if (localFile) {
  await cp(localFile, TARGET);
  sourceUrl = `local:${localFile}`;
  notes = `Copied manual restaurant hygiene grading CSV from ${localFile}.`;
} else if (!force && existsSync(TARGET)) {
  console.log(`${TARGET} already exists. Use --force to download again or --local to replace it.`);
  process.exit(0);
} else {
  const response = await fetch(SOURCE_URL);
  if (!response.ok) throw new Error(`Restaurant hygiene grading download failed: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.subarray(0, 128).toString('utf8').toLowerCase().includes('<html')) {
    throw new Error('Download returned HTML instead of CSV. Use --local with an official CSV export.');
  }
  await writeFile(TARGET, bytes);
  notes = 'Downloaded official Taipei restaurant hygiene grading CSV.';
}
const report = await readReport();
await writeReport({
  ...report,
  downloads: [...(report.downloads ?? []), { sourceUrl, downloadedAt: new Date().toISOString(), filePath: TARGET, fileSize: (await stat(TARGET)).size, notes }],
});
console.log(notes);
