// Acquisition is deliberately separate from deterministic offline reproduction.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = 'public/data/policy-11/evidence';
const resources = [
  ['failed-113', '3fc106cb-c8aa-4f74-8dbc-3272c7ffcae0'],
  ['failed-112', 'bb347e3d-626a-46e5-bb96-9061e8d08c26'],
  ['failed-111', 'bc24a40f-5687-4338-8f9a-449de248ab93'],
  ['grading', 'c5646d80-9118-4439-b924-075f96371d75'],
  ['registry', 'e94a712a-be5b-4d8b-89c9-30a5ee21f25d'],
];
const catalogues = [['failed', '09a917a0-0fb5-47e1-957c-5f1268fba517'], ['grading', '59579c19-a561-4564-8c0f-545bfb32c0f6'], ['registry', '178abc4e-fe32-4fc9-af3a-7baf1c15082c']];
await mkdir(root, { recursive: true });
try { await readFile(`${root}/acquisition.json`); throw new Error('Evidence exists. Use a separate edition directory for a new acquisition; never overwrite retained evidence.'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const acquisition = [];
for (const [id, url, extension] of [...resources.map(([id,rid]) => [id,`https://data.taipei/api/frontstage/tpeod/dataset/resource.download?rid=${rid}`,'csv']), ...catalogues.map(([id,uuid]) => [`${id}-catalogue`,`https://data.taipei/dataset/detail?id=${uuid}`,'html'])]) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (extension === 'csv' && bytes.subarray(0,128).toString().toLowerCase().includes('<html')) throw new Error(`${id}: HTML instead of CSV`);
  const file = `${id}.${extension}`;
  await writeFile(`${root}/${file}`, bytes, { flag: 'wx' });
  acquisition.push({ id, url, file, retrievedAt: new Date().toISOString(), byteLength: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), contentType: response.headers.get('content-type'), httpLastModified: response.headers.get('last-modified'), httpDate: response.headers.get('date') });
}
await writeFile(`${root}/acquisition.json`, `${JSON.stringify(acquisition,null,2)}\n`, { flag:'wx' });
console.log(`Retained ${acquisition.length} original official response bodies.`);
