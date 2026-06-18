import { copyFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  WATER_REFILL_RAW,
  ensureDataDirs,
  readReport,
  writeReport,
} from './dataPipeline';

const SOURCE_URL =
  'https://data.taipei/api/frontstage/tpeod/dataset/resource.download?rid=0cf29b84-56d7-4d19-8cc8-7edf4183984d';
const force = process.argv.includes('--force');
const localIndex = process.argv.indexOf('--local');
const localPath = localIndex >= 0 ? process.argv[localIndex + 1] : undefined;

await ensureDataDirs();

let notes: string;
if (localPath) {
  await copyFile(localPath, WATER_REFILL_RAW);
  notes = `Copied local CSV ${path.basename(localPath)}.`;
} else {
  try {
    if (!force) {
      const existing = await stat(WATER_REFILL_RAW);
      notes = 'Skipped because file already exists. Pass --force to re-download.';
      const report = await readReport();
      report.downloads = [
        ...(report.downloads ?? []).filter((item) => item.filePath !== WATER_REFILL_RAW),
        {
          sourceUrl: SOURCE_URL,
          downloadedAt: existing.mtime.toISOString(),
          filePath: WATER_REFILL_RAW,
          fileSize: existing.size,
          notes,
        },
      ];
      await writeReport(report);
      console.log(notes);
      process.exit(0);
    }
  } catch {
    // Download below.
  }

  const response = await fetch(SOURCE_URL);
  if (!response.ok) throw new Error(`Download failed ${response.status}: ${SOURCE_URL}`);
  await writeFile(WATER_REFILL_RAW, Buffer.from(await response.arrayBuffer()));
  notes = 'Downloaded official Taipei Open Data CSV.';
}

const file = await stat(WATER_REFILL_RAW);
const report = await readReport();
report.downloads = [
  ...(report.downloads ?? []).filter((item) => item.filePath !== WATER_REFILL_RAW),
  {
    sourceUrl: localPath ? `local-file:${path.basename(localPath)}` : SOURCE_URL,
    downloadedAt: new Date().toISOString(),
    filePath: WATER_REFILL_RAW,
    fileSize: file.size,
    notes,
  },
];
await writeReport(report);
console.log(`Stored water-refill CSV (${file.size} bytes).`);
