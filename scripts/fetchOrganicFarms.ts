import { mkdir, writeFile } from 'node:fs/promises';
const url = 'https://data.taipei/api/frontstage/tpeod/dataset/resource.download?rid=cb8bccd9-81e1-4e20-835e-a04080037f1e';
await mkdir('data/raw/organic-farms', { recursive: true }); const response = await fetch(url); if (!response.ok) throw new Error(`Organic farms download failed: HTTP ${response.status}`); await writeFile('data/raw/organic-farms/organic-farms.csv', Buffer.from(await response.arrayBuffer())); console.log('Downloaded official Taipei Organic Farms CSV.');
