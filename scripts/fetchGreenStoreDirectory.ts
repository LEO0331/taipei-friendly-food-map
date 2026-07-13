import { cp, mkdir, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { readReport, writeReport } from './dataPipeline';

const RAW_DIR = 'data/raw/green-store-directory';
const TARGET = path.join(RAW_DIR, 'green-store-directory.csv');
const SOURCE_URL =
  'https://data.taipei/api/dataset/1756cb64-0066-444a-a323-9f3b5a961045/resource/209123b3-335f-432f-9521-711e18ce3388/download';
const args = process.argv.slice(2);
const localIndex = args.indexOf('--local');
const localFile = localIndex >= 0 ? args[localIndex + 1] : undefined;
const force = args.includes('--force');

if (localIndex >= 0 && !localFile) throw new Error('Expected a CSV path after --local.');
await mkdir(RAW_DIR, { recursive: true });

let note: string;
let sourceUrl = SOURCE_URL;
if (localFile) {
  await cp(localFile, TARGET);
  note = `Copied manual Green Store CSV from ${localFile}.`;
  sourceUrl = `local:${localFile}`;
} else if (!force && existsSync(TARGET)) {
  console.log(`${TARGET} already exists. Use --force to download again or --local to replace it.`);
  process.exit(0);
} else {
  const response = await fetch(SOURCE_URL);
  if (!response.ok) throw new Error(`Green Store download failed: HTTP ${response.status}`);
  const contentType = response.headers.get('content-type') ?? '';
  const bytes = Buffer.from(await response.arrayBuffer());
  if (contentType.includes('text/html') || bytes.subarray(0, 128).toString('utf8').toLowerCase().includes('<html')) {
    throw new Error('Green Store download returned HTML instead of CSV. Use --local with an official CSV export.');
  }
  await writeFile(TARGET, bytes);
  note = 'Downloaded official Taipei Green Store CSV.';
}

const report = await readReport();
await writeReport({
  ...report,
  downloads: [
    ...(report.downloads ?? []),
    {
      sourceUrl,
      downloadedAt: new Date().toISOString(),
      filePath: TARGET,
      fileSize: (await stat(TARGET)).size,
      notes: note,
    },
  ],
});
console.log(note);
