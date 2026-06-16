import { access, stat, writeFile } from 'node:fs/promises';
import {
  DATA_SOURCES,
  FRIENDLY_EN_RAW,
  FRIENDLY_ZH_RAW,
  RESTAURANTS_RAW,
  ensureDataDirs,
  readReport,
  writeReport,
} from './dataPipeline';

const shouldForce = process.argv.includes('--force');

const exists = async (filePath: string) => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

const download = async (sourceUrl: string, filePath: string) => {
  if (!shouldForce && (await exists(filePath))) {
    const file = await stat(filePath);
    return {
      sourceUrl,
      downloadedAt: new Date(file.mtime).toISOString(),
      filePath,
      fileSize: file.size,
      notes: 'Skipped because file already exists. Pass --force to re-download.',
    };
  }
  const response = await fetch(sourceUrl);
  if (!response.ok) throw new Error(`Download failed ${response.status}: ${sourceUrl}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(filePath, bytes);
  return {
    sourceUrl,
    downloadedAt: new Date().toISOString(),
    filePath,
    fileSize: bytes.length,
    notes: 'Downloaded CSV resource directly from Taipei Open Data resource.download endpoint.',
  };
};

await ensureDataDirs();
const downloads = await Promise.all([
  download(DATA_SOURCES.friendlyZh, FRIENDLY_ZH_RAW),
  download(DATA_SOURCES.friendlyEn, FRIENDLY_EN_RAW),
  download(DATA_SOURCES.restaurants, RESTAURANTS_RAW),
]);
const report = await readReport();
report.downloads = downloads;
report.notes = Array.from(new Set([...(report.notes ?? []), 'Fetch script stores raw CSV files locally and avoids repeat downloads unless --force is passed.']));
await writeReport(report);
console.log(`Fetched ${downloads.length} resources.`);
