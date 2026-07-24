import { mkdir, writeFile } from 'node:fs/promises';

const sourceUrl = 'https://data.taipei/api/frontstage/tpeod/dataset/resource.download?rid=4874f750-b972-4c42-ad76-986960670c70';
const destination = 'data/raw/temporary-vendor-markets/temporary-vendor-markets.csv';

await mkdir('data/raw/temporary-vendor-markets', { recursive: true });
const response = await fetch(sourceUrl);
if (!response.ok) throw new Error(`Temporary vendor markets download failed: HTTP ${response.status}`);
await writeFile(destination, Buffer.from(await response.arrayBuffer()));
console.log(`Downloaded official temporary vendor markets CSV to ${destination}.`);
