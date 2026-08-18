import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { readReport, writeReport } from './dataPipeline';

const source = 'https://data.taipei/api/dataset/8ab917b0-1029-4003-b776-f169b4e561f1/resource/b93ade0e-8492-4f82-97f3-e30fdd13cd9f/download';
const output = 'data/raw/agricultural-product-inspections/inspections.csv';
await mkdir(path.dirname(output), { recursive: true });
const response = await fetch(source);
if (!response.ok) throw new Error(`Agricultural product inspection download failed: HTTP ${response.status}`);
const bytes = Buffer.from(await response.arrayBuffer());
if (bytes.subarray(0, 128).toString('utf8').toLowerCase().includes('<html')) throw new Error('Dataset returned HTML instead of CSV.');
await writeFile(output, bytes);
const report = await readReport();
await writeReport({ ...report, downloads: [...(report.downloads ?? []), { sourceUrl: source, downloadedAt: new Date().toISOString(), filePath: output, fileSize: (await stat(output)).size, notes: '臺北市政府標章農產品抽檢清冊' }] });
console.log(`Downloaded agricultural product inspection CSV (${(await stat(output)).size} bytes).`);
