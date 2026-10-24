import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { parseCsv } from '../../scripts/dataPipeline';
import { buildPolicy11Export, isPolicy11Snapshot, policy11Csv, reconcileIdentities, selectReviewRecords, type IndependentValidation, type Policy11Snapshot, type ReviewRecord } from './policy11';

const record = (id: string, sourceId = 'grading', extra: Partial<ReviewRecord> = {}): ReviewRecord => ({ id, sourceId, editionId: `${sourceId}-1`, unit: 'grading', name: '同名店', address: '臺北市中正區一號', eventDate: null, flags: [], ...extra });
const snapshot = (records: ReviewRecord[]): Policy11Snapshot => ({ snapshotId: 'immutable-1', generatedAt: '2026-10-24T00:00:00Z', sourceEditions: ['grading', 'registry', 'failed'].map(sourceId => ({ id: `${sourceId}-1`, sourceId, title: sourceId, url: 'https://data.taipei/dataset/test', sha256: 'a'.repeat(64), retrievedAt: null, catalogueUpdatedAt: '2026-10-24', originalBytesAvailable: true })), records });

test('deterministic tiers and capacities select real IDs with stable tie ordering', () => {
  const records = Array.from({ length: 14 }, (_, i) => record(`g-${String(i).padStart(2, '0')}`));
  records.push(record('priority', 'failed', { unit: 'sample', flags: ['source-edition-changed'] }));
  const original = JSON.stringify(records);
  const result = selectReviewRecords(snapshot(records), { capacity: 5, strategy: 'evidence-first' });
  assert.equal(result.selected.length, 5);
  assert.equal(result.selected[0].record.id, 'priority');
  assert.equal(result.selected[0].tier, 'T1');
  assert.deepEqual(result.selectedIds, selectReviewRecords(snapshot([...records].reverse()), { capacity: 5, strategy: 'evidence-first' }).selectedIds);
  assert.equal(JSON.stringify(records), original);
  assert.equal(selectReviewRecords(snapshot(records), { capacity: 10, strategy: 'balanced' }).selected.length, 10);
  assert.equal(selectReviewRecords(snapshot(records), { capacity: 'all', strategy: 'balanced' }).selected.length, 15);
  assert.equal(result.sensitivity.length, 6);
  assert.deepEqual(result.sensitivity.find(s => s.capacity === 5 && s.strategy === 'evidence-first')?.removedIds, []);
});

test('administrative balancing alternates source queues within documentary tier', () => {
  const s = snapshot([...Array.from({ length: 7 }, (_, i) => record(`g-${i}`)), ...Array.from({ length: 7 }, (_, i) => record(`r-${i}`, 'registry'))]);
  const first = selectReviewRecords(s, { capacity: 5, strategy: 'evidence-first' });
  const balanced = selectReviewRecords(s, { capacity: 5, strategy: 'balanced' });
  assert.equal(new Set(first.selected.map(s => s.record.sourceId)).size, 1);
  assert.equal(new Set(balanced.selected.map(s => s.record.sourceId)).size, 2);
  assert.ok(balanced.sensitivity.some(s => s.addedIds.length > 0));
});

test('null dates never acquire catalogue dates and missing grading does not become failure', () => {
  const s = snapshot([record('r', 'registry')]);
  const result = selectReviewRecords(s, { capacity: 5, strategy: 'evidence-first' });
  assert.equal(result.selected[0].record.eventDate, null);
  assert.ok(!result.selected[0].reasons.includes('event-date-unavailable'));
  assert.ok(selectReviewRecords(snapshot([record('sample', 'failed', { unit: 'sample' })]), { capacity: 5, strategy: 'balanced' }).selected[0].reasons.includes('event-date-unavailable'));
  assert.ok(!JSON.stringify(result).includes('unsafe'));
  assert.equal(buildPolicy11Export(s, { capacity: 'all', strategy: 'balanced' }).riskAssessmentAvailable, false);
});

test('matching names and addresses are unvalidated; different identifier namespaces do not join', () => {
  const rows = [record('g', 'grading', { identifiers: [{ namespace: 'foodBusinessRegistrationNumber', value: '12345678' }] }), record('r', 'registry', { identifiers: [{ namespace: 'companyRegistrationNumber', value: '12345678' }] })];
  const result = reconcileIdentities(rows);
  assert.equal(result.associations.length, 0);
  assert.equal(result.candidates.length, 1);
  assert.equal(result.available, false);
  assert.equal(result.modeC.available, false);
});

const validation: IndependentValidation = { leftId: 'g', rightId: 'r', leftEditionId: 'grading-1', rightEditionId: 'registry-1', evidenceUrl: 'https://www.gov.taipei/doc', evidenceReference: 'Official physical-establishment confirmation p. 2', verifiedAt: '2026-10-24', confirmsPhysicalEstablishment: true };
const officialValidation = { ...validation, evidenceUrl: 'https://www.fda.gov.tw/doc' };
test('only independently validated physical establishments can associate; ambiguity, stale editions and products reject', () => {
  const rows = [record('g'), record('r', 'registry')];
  assert.equal(reconcileIdentities(rows, [officialValidation]).associations.length, 1);
  assert.equal(reconcileIdentities(rows, [validation]).associations.length, 1);
  assert.equal(reconcileIdentities(rows, [{ ...validation, evidenceUrl: 'https://gov.tw.evil.example/doc' }]).associations.length, 0);
  assert.equal(reconcileIdentities(rows, [{ ...officialValidation, leftEditionId: 'old' }]).associations.length, 0);
  assert.equal(reconcileIdentities(rows, [{ ...officialValidation, confirmsPhysicalEstablishment: false }]).associations.length, 0);
  assert.equal(reconcileIdentities([...rows, record('duplicate')], [officialValidation]).associations.length, 0);
  assert.equal(reconcileIdentities([record('g', 'grading', { unit: 'sample' }), rows[1]], [officialValidation]).associations.length, 0);
  assert.equal(reconcileIdentities(rows, [officialValidation, officialValidation]).associations.length, 0);
});

test('safe CSV quotes injection strings and retains complete edition and record evidence', () => {
  const s = snapshot([record('g', 'grading', { name: '=HYPERLINK("https://evil")', address: '\t=1+1', raw: { original: 'a,b\n"quoted"' } })]);
  const csv = policy11Csv(s, { capacity: 5, strategy: 'evidence-first' });
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes("'=HYPERLINK"));
  assert.ok(csv.includes("'\t=1+1"));
  assert.ok(csv.includes('a'.repeat(64)));
  assert.ok(csv.includes('snapshotProvenance'));
  assert.deepEqual(buildPolicy11Export(s, { capacity: 5, strategy: 'balanced' }).snapshot, s);
});

test('snapshot guard rejects duplicate IDs, unknown provenance and malformed flags', () => {
  assert.ok(isPolicy11Snapshot(snapshot([record('g')])));
  assert.equal(isPolicy11Snapshot(snapshot([record('g'), record('g')])), false);
  assert.equal(isPolicy11Snapshot(snapshot([record('g', 'missing')])), false);
  assert.equal(isPolicy11Snapshot({ ...snapshot([record('g')]), records: [{ ...record('g'), flags: [1] }] }), false);
});


test('retained real snapshot supports unique selected IDs and conservative identity coverage', async () => {
  const manifest = JSON.parse(await readFile('public/data/policy-11/manifest.json', 'utf8'));
  const s: unknown = JSON.parse(await readFile(`public/data/policy-11/${manifest.path}`, 'utf8'));
  assert.ok(isPolicy11Snapshot(s));
  const result = selectReviewRecords(s, { capacity: 10, strategy: 'balanced' });
  assert.equal(result.selectedIds.length, 10);
  assert.equal(new Set(result.selectedIds).size, 10);
  assert.ok(result.selectedIds.every(id => s.records.some(r => r.id === id)));
  assert.equal(reconcileIdentities(s.records).matchingCoverage.matchedRecords, 0);
});


test('snapshot guard fails closed on malformed optional fields and incomplete or ambiguous editions', () => {
  const s = snapshot([record('g')]);
  const invalidRecord = (extra: unknown) => ({ ...s, records: [{ ...record('g'), ...(extra as object) }] });
  assert.equal(isPolicy11Snapshot(invalidRecord({ address: 123 })), false);
  assert.equal(isPolicy11Snapshot(invalidRecord({ identifiers: [{ namespace: 'company', value: 123 }] })), false);
  assert.equal(isPolicy11Snapshot(invalidRecord({ eventDate: 'not a date' })), false);
  for (const extra of [{ sha256: '' }, { title: undefined }, { url: undefined }, { retrievedAt: undefined }, { catalogueUpdatedAt: 'invalid' }]) {
    assert.equal(isPolicy11Snapshot({ ...s, sourceEditions: [{ ...s.sourceEditions[0], ...extra }, ...s.sourceEditions.slice(1)] }), false);
  }
  assert.equal(isPolicy11Snapshot({ ...s, sourceEditions: [...s.sourceEditions, { ...s.sourceEditions[0], sha256: 'b'.repeat(64) }] }), false);
});


test('all-capacity CSV preserves every selected ID with full metadata once and bounded size', async () => {
  const manifest = JSON.parse(await readFile('public/data/policy-11/manifest.json', 'utf8'));
  const s: unknown = JSON.parse(await readFile(`public/data/policy-11/${manifest.path}`, 'utf8'));
  assert.ok(isPolicy11Snapshot(s));
  const options = { capacity: 'all', strategy: 'balanced' } as const;
  const csv = policy11Csv(s, options);
  const rows = parseCsv(csv.replace(/^\uFEFF/, ''));
  assert.equal(rows.length, s.records.length);
  assert.deepEqual(new Set(rows.map(r => r.recordId)), new Set(s.records.map(r => r.id)));
  const firstMetadata = JSON.parse(rows[0].snapshotProvenance);
  const { records: _records, ...metadata } = s;
  assert.deepEqual(firstMetadata, { csvMetadataSchema: 'policy11-csv-metadata-v1', ...metadata });
  for (const row of rows.slice(1)) assert.deepEqual(JSON.parse(row.snapshotProvenance), { csvMetadataReference: s.snapshotId });
  assert.ok(rows.every(row => JSON.parse(row.recordEvidence).id === row.recordId));
  assert.ok(Buffer.byteLength(csv, 'utf8') < 100 * 1024 * 1024, 'All-capacity CSV must remain below 100 MiB');
});
