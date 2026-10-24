import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePolicy11Headers } from '../../scripts/policy11EvidenceValidation';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
test('source audit fails closed when an official edition adds an event or batch field', () => {
  const expected=['抽驗日期','檢體名稱'];
  assert.doesNotThrow(()=>validatePolicy11Headers(['檢體名稱','抽驗日期'],expected,'sample'));
  assert.throws(()=>validatePolicy11Headers([...expected,'批次編號'],expected,'sample'),/unexpected \[批次編號\]/);
  assert.throws(()=>validatePolicy11Headers(['檢體名稱'],expected,'sample'),/missing \[抽驗日期\]/);
});

test('offline reproduction rejects altered original bytes and altered generated snapshots', async () => {
  const temporary = await mkdtemp(path.join(tmpdir(), 'policy11-integrity-'));
  const evidenceRoot = path.join(temporary, 'public/data/policy-11');
  const run = () => promisify(execFile)(process.execPath, [
    '--import', pathToFileURL(path.resolve('node_modules/tsx/dist/loader.mjs')).href,
    path.resolve('scripts/buildPolicy11Evidence.ts'), '--check',
  ], { cwd: temporary, timeout: 30000 });
  try {
    await cp(path.resolve('public/data/policy-11'), evidenceRoot, { recursive: true });
    await run();
    const originalPath = path.join(evidenceRoot, 'evidence/failed-111.csv');
    const original = await readFile(originalPath);
    await writeFile(originalPath, Buffer.concat([original, Buffer.from('\n')]));
    await assert.rejects(run(), /Evidence integrity failure: failed-111.csv/);
    await writeFile(originalPath, original);
    const manifest = JSON.parse(await readFile(path.join(evidenceRoot, 'manifest.json'), 'utf8'));
    const snapshotPath = path.join(evidenceRoot, manifest.path);
    await writeFile(snapshotPath, (await readFile(snapshotPath, 'utf8')) + '\n');
    await assert.rejects(run(), /Snapshot differs from deterministic reproduction/);
  } finally {
    // Only remove the unique test directory created above, never a supplied path.
    assert.equal(path.dirname(temporary), path.resolve(tmpdir()));
    assert.ok(path.basename(temporary).startsWith('policy11-integrity-'));
    await rm(temporary, { recursive: true, force: true });
  }
});
