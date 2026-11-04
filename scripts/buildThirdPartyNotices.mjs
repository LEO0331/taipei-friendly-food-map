import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const digest = text => createHash('sha256').update(text).digest('hex');

export async function buildThirdPartyNotices(root = new URL('../', import.meta.url)) {
  const lock = JSON.parse(await readFile(new URL('package-lock.json', root), 'utf8'));
  const packages = [];
  const sections = ['THIRD-PARTY NOTICES\n\nRuntime dependency notices copied from the exact locked installed packages.\nThis inventory supplies notices, not a legal compliance certification.\n'];
  for (const [path, entry] of Object.entries(lock.packages).sort(([a], [b]) => a.localeCompare(b))) {
    if (!path.includes('node_modules/') || entry.dev) continue;
    const directory = new URL(`${path}/`, root);
    const metadata = JSON.parse(await readFile(new URL('package.json', directory), 'utf8'));
    if (metadata.version !== entry.version) throw new Error(`Installed version differs from lockfile: ${path}`);
    const files = (await readdir(directory)).filter(name => /licen[cs]e|^copying|^notice/i.test(name)).sort();
    if (!files.length) throw new Error(`Missing runtime license text: ${metadata.name}`);
    const item = { name: metadata.name, version: metadata.version, license: metadata.license, path, notices: [] };
    for (const file of files) {
      const bytes = await readFile(new URL(file, directory));
      item.notices.push({ file, sha256: digest(bytes), bytes: bytes.length });
      sections.push(`\n===== ${metadata.name}@${metadata.version} (${metadata.license}) — ${file} =====\n\n${bytes.toString('utf8')}`);
    }
    packages.push(item);
  }
  const sourcePath = 'src/components/explorer/HexHub.tsx';
  const source = await readFile(new URL(sourcePath, root), 'utf8');
  const comment = source.match(/^\/\*([\s\S]*?)\*\//)?.[1];
  if (!comment?.includes('Copyright (c) 2026 LeoChen') || !comment.includes('Permission is hereby granted')) throw new Error('Copied geometry MIT notice missing');
  const text = comment.trim().split(/\r?\n/).map(line => line.replace(/^ \* ?/, '')).join('\n');
  sections.push(`\n===== Copied Explorer geometry — MIT =====\n\n${text}\n`);
  const inventory = { schemaVersion: 1, packages, copiedGeometry: { path: sourcePath, license: 'MIT', copyright: 'Copyright (c) 2026 LeoChen', textSha256: digest(text) } };
  return { notices: sections.join('\n'), inventory: `${JSON.stringify(inventory, null, 2)}\n` };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const output = await buildThirdPartyNotices();
  for (const [path, text] of [['THIRD_PARTY_NOTICES.txt', output.notices], ['third-party-licenses.json', output.inventory]]) {
    const target = new URL(`../public/${path}`, import.meta.url);
    if (process.argv.includes('--check')) {
      if (await readFile(target, 'utf8') !== text) throw new Error(`Distribution notices differ: ${path}`);
    } else await writeFile(target, text);
  }
  console.log('Runtime distribution notices verified for the locked installed packages and copied geometry.');
}
