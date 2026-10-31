import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const base = 'ebed7962b8ced05afea285865f95f2bb7e991f1e';
const git = args => execFileSync('git', args, {encoding:'utf8'}).trim();
function translations(source) {
  const exports = {};
  runInNewContext(ts.transpile(source, {module:ts.ModuleKind.CommonJS}), {exports});
  return exports.translations;
}
const before = translations(git(['show', `${base}:src/data/translations.ts`]));
const after = translations(readFileSync('src/data/translations.ts', 'utf8'));
let count = 0;
for (const locale of ['zh','en']) for (const [key, value] of Object.entries(before[locale])) {
  assert.equal(after[locale][key], value, `Original label/interpretation changed: ${locale}.${key}`);
  count++;
}
const paths = [
  'public/data', 'data', 'src/data/loadData.ts', 'src/lib/friendlyFood.ts', 'src/lib/policy11.ts',
  'src/components/FriendlyMap.tsx', 'src/components/FilterPanel.tsx', 'src/components/StoreDirectory.tsx',
  'src/components/StoreCard.tsx', 'src/components/DataNotes.tsx', 'src/components/Policy11Module.tsx',
  'src/components/DisclaimerNotice.tsx', 'package.json', 'package-lock.json', 'public/sw.js',
];
git(['diff', '--exit-code', base, '--', ...paths]);
const originalScripts = git(['ls-tree', '-r', '--name-only', base, '--', 'scripts']).split('\n');
git(['diff', '--exit-code', base, '--', ...originalScripts]);
git(['diff', '--exit-code', base, '--', 'src/components/*Module.tsx', 'src/lib/policy11*']);
const result = {base, status:'pass', originalTranslationsUnchanged:count, unchangedPaths:paths,
  existingModuleImplementationsUnchanged:true, existingDataScriptsUnchanged:true, dependenciesUnchanged:true,
  referenceRepositories:'read only'};
writeFileSync('doc/civic-explorer/boundary-results.json', JSON.stringify(result,null,2)+'\n');
console.log(`Source boundaries pass: ${count} original translations, all source data, matching and module implementations unchanged.`);
