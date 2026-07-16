import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { readReport, writeReport } from './dataPipeline';

const rawDir = 'data/raw/failed-food-inspection-records';
const source = [
  { year: 113, name: '113年度臺北市衛生局食品抽驗不合格清冊', rid: '3fc106cb-c8aa-4f74-8dbc-3272c7ffcae0' },
  { year: 112, name: '112年度臺北市衛生局食品抽驗不合格清冊', rid: 'bb347e3d-626a-46e5-bb96-9061e8d08c26' },
  { year: 111, name: '111年度臺北市衛生局食品抽驗不合格清冊', rid: 'bc24a40f-5687-4338-8f9a-449de248ab93' },
];
await mkdir(rawDir, { recursive: true });
const downloads = [];
for (const item of source) {
  const filePath = path.join(rawDir, `${item.year}.csv`);
  const url = `https://data.taipei/api/frontstage/tpeod/dataset/resource.download?rid=${item.rid}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${item.name} download failed: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.subarray(0, 128).toString('utf8').toLowerCase().includes('<html')) throw new Error(`${item.name} returned HTML instead of CSV.`);
  await writeFile(filePath, bytes);
  downloads.push({ sourceUrl: url, downloadedAt: new Date().toISOString(), filePath, fileSize: (await stat(filePath)).size, notes: item.name });
}
const report = await readReport();
await writeReport({ ...report, downloads: [...(report.downloads ?? []), ...downloads] });
console.log(`Downloaded ${downloads.length} annual failed-food-inspection CSV resources.`);
