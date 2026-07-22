import { mkdir, writeFile } from 'node:fs/promises';
const url = 'https://data.taipei/api/frontstage/tpeod/dataset/resource.download?rid=732295f8-1bf9-4d2b-8514-de19b1bb8d99';
await mkdir('data/raw/supermarkets', { recursive: true });
const response = await fetch(url);
if (!response.ok) throw new Error(`Supermarkets download failed: HTTP ${response.status}`);
await writeFile('data/raw/supermarkets/supermarkets.csv', Buffer.from(await response.arrayBuffer()));
console.log('Downloaded official Taipei Supermarkets CSV.');
