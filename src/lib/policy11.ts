/** Documentary review only. No score in this module estimates food-safety risk. */
export type Capacity = 5 | 10 | 'all';
export type ReviewStrategy = 'evidence-first' | 'balanced';
export type ReviewOptions = { capacity: Capacity; strategy: ReviewStrategy };
export type Identifier = { namespace: string; value: string };
export type ReviewRecord = {
  id: string; sourceId: string; editionId: string; unit: string; name: string;
  address?: string; district?: string; eventDate: string | null; flags: string[];
  identifiers?: Identifier[]; originalRecordId?: string | null; [key: string]: unknown;
};
export type SourceEdition = {
  id: string; sourceId: string; title: string; url: string; sha256: string;
  catalogueUpdatedAt: string | null; retrievedAt: string | null;
  originalBytesAvailable?: boolean; [key: string]: unknown;
};
export type Policy11Snapshot = {
  snapshotId: string; generatedAt: string; sourceEditions: SourceEdition[];
  records: ReviewRecord[]; limitations?: string[]; [key: string]: unknown;
};
export type ReviewTier = 'T1' | 'T2' | 'T3';
export type ReviewSelection = { record: ReviewRecord; tier: ReviewTier; reasons: string[] };
export const reasonLabels: Record<string, { en: string; zh: string }> = {
  'duplicate-published-row': { en: 'Verify duplicate published row; preserve its separate source-row identity', zh: '查核重複公布列；保留各筆來源列身分' },
  'source-edition-changed': { en: 'Compare changed source editions', zh: '比對來源版本差異' },
  'original-bytes-unavailable': { en: 'Recover original publication bytes', zh: '查核原始公布位元組' },
  'event-date-unavailable': { en: 'Verify the event date; catalogue dates are not event dates', zh: '查核事件日期；目錄日期不等於事件日期' },
  'event-id-unavailable': { en: 'Verify inspection-event identity', zh: '查核檢驗事件識別' },
  'batch-id-unavailable': { en: 'Verify batch evidence; do not infer batch counts', zh: '查核批次證據；不可推算批次數' },
  'assessment-date-unavailable': { en: 'Verify grading assessment date', zh: '查核評核日期' },
  'identifier-namespace-unverified': { en: 'Verify identifier namespace', zh: '查核識別碼所屬類型' },
  'identity-unresolved': { en: 'Resolve identity before any cross-source use', zh: '跨來源使用前先釐清身分' },
  'routine-documentation-review': { en: 'Routine source and documentation check', zh: '例行來源與文件查核' },
};

function nonemptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
function nullableTimestamp(value: unknown): boolean {
  return value === null || (nonemptyString(value) && Number.isFinite(Date.parse(value)));
}
function optionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string';
}
export function isPolicy11Snapshot(value: unknown): value is Policy11Snapshot {
  if (!value || typeof value !== 'object') return false;
  const s = value as Partial<Policy11Snapshot>;
  if (!nonemptyString(s.snapshotId) || !nonemptyString(s.generatedAt) || !Number.isFinite(Date.parse(s.generatedAt))
    || !Array.isArray(s.sourceEditions) || !Array.isArray(s.records)) return false;
  const editions = new Set<string>();
  for (const e of s.sourceEditions) {
    if (!e || typeof e !== 'object' || !nonemptyString(e.id) || !nonemptyString(e.sourceId)
      || !nonemptyString(e.title) || !nonemptyString(e.url) || !/^https:\/\//i.test(e.url)
      || typeof e.sha256 !== 'string' || !/^[a-f0-9]{64}$/i.test(e.sha256)
      || !nullableTimestamp(e.catalogueUpdatedAt) || !nullableTimestamp(e.retrievedAt)
      || (e.originalBytesAvailable !== undefined && typeof e.originalBytesAvailable !== 'boolean')) return false;
    const key = JSON.stringify([e.sourceId, e.id]);
    if (editions.has(key)) return false;
    editions.add(key);
  }
  const ids = new Set<string>();
  for (const r of s.records) {
    if (!r || typeof r !== 'object' || !nonemptyString(r.id) || !nonemptyString(r.sourceId)
      || !nonemptyString(r.editionId) || typeof r.name !== 'string' || !nonemptyString(r.unit)
      || !optionalString(r.address) || !optionalString(r.district)
      || (r.originalRecordId !== null && !optionalString(r.originalRecordId))
      || !nullableTimestamp(r.eventDate)
      || !Array.isArray(r.flags) || !r.flags.every(f => nonemptyString(f))
      || (r.identifiers !== undefined && (!Array.isArray(r.identifiers)
        || !r.identifiers.every(i => i && typeof i === 'object' && nonemptyString(i.namespace) && typeof i.value === 'string')))
      || ids.has(r.id) || !editions.has(JSON.stringify([r.sourceId, r.editionId]))) return false;
    ids.add(r.id);
  }
  return s.limitations === undefined || (Array.isArray(s.limitations) && s.limitations.every(l => typeof l === 'string'));
}

function review(record: ReviewRecord, snapshot: Policy11Snapshot): ReviewSelection {
  const reasons = new Set(record.flags);
  const edition = snapshot.sourceEditions.find(e => e.id === record.editionId && e.sourceId === record.sourceId);
  if (edition?.originalBytesAvailable === false) reasons.add('original-bytes-unavailable');
  if (!record.eventDate && record.unit === 'sample') reasons.add('event-date-unavailable');
  if (!record.eventDate && record.unit === 'grading') reasons.add('assessment-date-unavailable');
  if (!reasons.size) reasons.add('routine-documentation-review');
  const tier: ReviewTier = reasons.has('source-edition-changed') ? 'T1'
    : [...reasons].some(r => ['original-bytes-unavailable', 'event-date-unavailable', 'assessment-date-unavailable', 'identifier-namespace-unverified'].includes(r)) ? 'T2' : 'T3';
  return { record, tier, reasons: [...reasons].sort() };
}

function ordered(snapshot: Policy11Snapshot, strategy: ReviewStrategy): ReviewSelection[] {
  const records = snapshot.records.map(r => review(r, snapshot));
  const compare = (a: ReviewSelection, b: ReviewSelection) => a.record.sourceId.localeCompare(b.record.sourceId, 'en') || a.record.id.localeCompare(b.record.id, 'en');
  const result: ReviewSelection[] = [];
  for (const tier of ['T1', 'T2', 'T3'] as const) {
    const items = records.filter(r => r.tier === tier).sort(compare);
    if (strategy === 'evidence-first') result.push(...items);
    else {
      const queues = [...new Set(items.map(r => r.record.sourceId))].sort().map(source => items.filter(r => r.record.sourceId === source));
      while (queues.some(q => q.length)) for (const queue of queues) { const next = queue.shift(); if (next) result.push(next); }
    }
  }
  return result;
}

export function selectReviewRecords(snapshot: Policy11Snapshot, options: ReviewOptions) {
  if (!isPolicy11Snapshot(snapshot)) throw new Error('Invalid policy 11 snapshot or record provenance');
  if (![5, 10, 'all'].includes(options.capacity) || !['evidence-first', 'balanced'].includes(options.strategy)) throw new Error('Invalid review options');
  const limit = options.capacity === 'all' ? snapshot.records.length : options.capacity;
  const orders = { 'evidence-first': ordered(snapshot, 'evidence-first'), balanced: ordered(snapshot, 'balanced') };
  const selected = orders[options.strategy].slice(0, limit);
  const selectedIds = selected.map(r => r.record.id);
  const selectedSet = new Set(selectedIds);
  const sensitivity = (['evidence-first', 'balanced'] as const).flatMap(strategy => ([5, 10, 'all'] as const).map(capacity => {
    const ids = orders[strategy].slice(0, capacity === 'all' ? snapshot.records.length : capacity).map(r => r.record.id);
    const idsSet = new Set(ids);
    const overlap = ids.filter(id => selectedSet.has(id)).length;
    return { strategy, capacity, selectedIds: ids, overlap, addedIds: ids.filter(id => !selectedSet.has(id)), removedIds: selectedIds.filter(id => !idsSet.has(id)) };
  }));
  return { selected, selectedIds, eligibleCount: snapshot.records.length, sensitivity };
}

export type IndependentValidation = {
  leftId: string; rightId: string; leftEditionId: string; rightEditionId: string;
  evidenceUrl: string; evidenceReference: string; verifiedAt: string;
  confirmsPhysicalEstablishment: boolean;
};
const normalize = (s: string) => s.normalize('NFKC').trim().replace(/\s+/g, '').toLowerCase();
/** Name/address equality generates documentary candidates, never validated associations. */
export function reconcileIdentities(records: ReviewRecord[], validations: IndependentValidation[] = []) {
  const buckets = new Map<string, ReviewRecord[]>();
  for (const record of records) {
    if (!record.name.trim() || !record.address?.trim() || record.unit === 'sample') continue;
    const key = `${normalize(record.name)}\u0000${normalize(record.address)}`;
    buckets.set(key, [...(buckets.get(key) ?? []), record]);
  }
  const candidates: { leftId: string; rightId: string; status: 'unvalidated' | 'ambiguous' }[] = [];
  for (const group of buckets.values()) for (let i = 0; i < group.length; i++) for (let j = i + 1; j < group.length; j++) {
    if (group[i].sourceId === group[j].sourceId) continue;
    const ambiguous = group.some(r => group.filter(x => x.sourceId === r.sourceId).length > 1);
    candidates.push({ leftId: group[i].id, rightId: group[j].id, status: ambiguous ? 'ambiguous' : 'unvalidated' });
  }
  const validEvidence = validations.filter(v => {
    const left = records.find(r => r.id === v.leftId && r.editionId === v.leftEditionId);
    const right = records.find(r => r.id === v.rightId && r.editionId === v.rightEditionId);
    return left && right && left.sourceId !== right.sourceId && left.unit !== 'sample' && right.unit !== 'sample'
      && v.confirmsPhysicalEstablishment && /^https:\/\/(?:[a-z0-9-]+\.)*(?:gov\.tw|gov\.taipei|data\.taipei)(?:\/|$)/i.test(v.evidenceUrl)
      && Boolean(v.evidenceReference.trim()) && /^\d{4}-\d{2}-\d{2}/.test(v.verifiedAt)
      && !candidates.some(c => c.status === 'ambiguous' && [c.leftId, c.rightId].some(id => id === left.id || id === right.id));
  });
  const associations = validEvidence.filter(v => validEvidence.filter(x => x.leftId === v.leftId || x.rightId === v.leftId).length === 1
    && validEvidence.filter(x => x.leftId === v.rightId || x.rightId === v.rightId).length === 1);
  const matchedIds = new Set(associations.flatMap(v => [v.leftId, v.rightId]));
  return { available: associations.length > 0, associations, candidates, matchingCoverage: { matchedRecords: matchedIds.size, totalRecords: records.length },
    unresolvedIds: records.filter(r => !matchedIds.has(r.id)).map(r => r.id), excludedSampleIds: records.filter(r => r.unit === 'sample').map(r => r.id),
    modeC: { available: false as const, reason: 'Current food-safety risk and business hazard ranking require adequate authoritative evidence.' } };
}

export function buildPolicy11Export(snapshot: Policy11Snapshot, options: ReviewOptions) {
  const selection = selectReviewRecords(snapshot, options);
  return { schemaVersion: 1, purpose: 'documentary-review-only', riskAssessmentAvailable: false, options,
    snapshot, ...selection, identity: reconcileIdentities(snapshot.records),
    caveats: ['Selected records are documentation review tasks, not unsafe establishments.', 'Failed-only publications do not supply a citywide inspection denominator.', 'Absence from a passing list is not failure.', 'Catalogue update dates are not inspection dates.'] };
}
export function policy11Json(snapshot: Policy11Snapshot, options: ReviewOptions): string {
  return JSON.stringify(buildPolicy11Export(snapshot, options), null, 2);
}
function csvCell(value: unknown): string {
  let text = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (/^[\s\u0000-\u001f]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
export function policy11Csv(snapshot: Policy11Snapshot, options: ReviewOptions): string {
  const selection = selectReviewRecords(snapshot, options);
  // First data row carries all snapshot metadata once. Later rows reference its snapshotId.
  // recordEvidence preserves each selected source row; edition columns remain self-contained.
  const { records: _records, ...snapshotMetadata } = snapshot;
  const headers = ['snapshotId', 'strategy', 'capacity', 'recordId', 'sourceId', 'editionId', 'unit', 'name', 'address', 'eventDate', 'tier', 'reasons', 'identifiers', 'sourceUrl', 'sha256', 'catalogueUpdatedAt', 'retrievedAt', 'recordEvidence', 'snapshotProvenance'];
  const rows = selection.selected.map(({ record, tier, reasons }, index) => {
    const edition = snapshot.sourceEditions.find(e => e.id === record.editionId && e.sourceId === record.sourceId)!;
    return [snapshot.snapshotId, options.strategy, options.capacity, record.id, record.sourceId, record.editionId, record.unit, record.name, record.address, record.eventDate, tier, reasons, record.identifiers ?? [], edition.url, edition.sha256, edition.catalogueUpdatedAt, edition.retrievedAt, record, index === 0 ? { csvMetadataSchema: 'policy11-csv-metadata-v1', ...snapshotMetadata } : { csvMetadataReference: snapshot.snapshotId }];
  });
  return '\uFEFF' + [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n');
}
