import { useEffect, useMemo, useState } from 'react';
import type { Language } from '../types';
import { buildPolicy11Export, isPolicy11Snapshot, policy11Csv, reasonLabels, reconcileIdentities, selectReviewRecords, type Policy11Snapshot } from '../lib/policy11';
import '../styles/policy11.css';

const evidencePath = `${import.meta.env.BASE_URL}data/policy-11/`;
type View = 'findings' | 'review' | 'identity' | 'audit';
const factLabels: Record<string, [string, string]> = {
  rawStart: ['Advertised catalogue start', '目錄公布涵蓋起日'], rawEnd: ['Advertised catalogue end', '目錄公布涵蓋迄日'],
  actualSamplingRange: ['Actual sampling dates in retained CSVs', '保留 CSV 實際抽驗日期'],
  actualAssessmentRange: ['Verified assessment-date range', '已確認評核日期範圍'], actualOperatingRange: ['Verified operating-date range', '已確認營業日期範圍'],
  failed: ['Failed-sample cohort', '不合格樣本群體'], grading: ['Passing-list cohort', '通過評核名單群體'], registry: ['Business registrations', '商業登記'],
  sampleCount: ['Published sample rows', '公布樣本列數'], distinctPublishedSampleRows: ['Distinct published sample rows', '不重複公布樣本列數'],
  eventCandidateGroups: ['Candidate event groups', '可能事件分組'], validatedEventCount: ['Validated inspection events', '已驗證抽驗事件'], batchCount: ['Validated batches', '已驗證批次'],
  multiSampleCandidateGroups: ['Candidate groups with multiple samples', '多樣本的候選分組'], eventDateRange: ['Sampling date range', '抽驗日期範圍'],
  from: ['From', '起日'], to: ['To', '迄日'], missingEventDates: ['Missing sampling dates', '缺少抽驗日期'], allResultsNoncompliant: ['All published results noncompliant', '公布結果均不符合規定'],
  denominatorAvailable: ['Comparable inspection denominator available', '具有可比較抽驗分母'], recordCount: ['Published records', '公布紀錄數'],
  assessmentDatesAvailable: ['Assessment dates published', '已公布評核日期'], passingListOnly: ['Passing list only', '僅通過名單'], results: ['Published grades', '公布評核結果'],
  physicalEstablishmentValidated: ['Physical establishment identity validated', '已驗證實體場所身分'],
  sourceId: ['Source', '來源'], retainedRows: ['Retained project rows', '專案保留列數'], officialRows: ['Retrieved official rows', '擷取官方列數'],
  retainedDistinctKeys: ['Retained distinct comparison keys', '保留版本不重複比對鍵'], officialDistinctKeys: ['Official distinct comparison keys', '官方版本不重複比對鍵'],
  unchangedKeys: ['Unchanged comparison keys', '相同比對鍵'], onlyRetainedKeys: ['Keys only in retained edition', '僅保留版本有的比對鍵'], onlyOfficialKeys: ['Keys only in retrieved edition', '僅擷取版本有的比對鍵'],
  publishedRowCount: ['Published sample rows', '公布樣本列數'], duplicatePublishedRows: ['Duplicate published rows', '重複公布列數'], validatedUniqueSampleCount: ['Validated unique samples', '已驗證唯一樣本數'],
  sampleCountMeaning: ['Meaning of sample count', '樣本計數意義'], eventGroupingRule: ['Candidate grouping rule', '候選分組規則'], identifierNamespace: ['Identifier namespace', '識別碼類型'],
};
const fieldDefinitions: Record<string, [string, string]> = {
  專案名稱: ['Published sampling project; not a batch identifier.', '公布抽驗專案，不是批次識別碼。'],
  抽驗日期: ['Sampling date; distinct from catalogue update time.', '抽驗日期，與目錄更新時間不同。'], 分類: ['Published product category.', '公布產品分類。'],
  檢體名稱: ['Product label; not a unique sample identifier.', '檢體產品名稱，不是唯一樣本識別碼。'], 抽驗行政郵遞區號: ['Sampling postal district.', '抽驗地點的郵遞區號。'],
  抽驗地點: ['Published sampling location; can combine trade name and address.', '公布抽驗地點，可能包含商號名稱與地址。'], 檢驗結果: ['Published noncompliance result.', '公布的不符合規定結果。'],
  不符合規定原因: ['Published noncompliance reason; one row may contain multiple analytes.', '公布的不符合規定原因；一列可能包含多項檢驗項目。'],
  行政區域代碼: ['Published administrative area code.', '公布的行政區域代碼。'], 業者名稱店名: ['Published trade or establishment name.', '公布的商號或場所名稱。'],
  食品業者登錄字號: ['Food-business registration ID; distinct from a company registration number.', '食品業者登錄識別碼，與公司統一編號不同。'],
  地址: ['Published establishment address; not independent proof of a cross-source identity.', '公布場所地址，不能單獨證實跨來源身分。'], 評核結果: ['Published passing grade; assessment date is absent.', '公布通過評核結果，未提供評核日期。'],
  統一編號: ['Company/business registration ID; preserve the original string and namespace.', '公司／商業登記識別碼，保留原始字串與識別碼類型。'],
  商業名稱: ['Registered business name; may differ from its trade name.', '登記的商業名稱，可能與店名不同。'], 商業地址: ['Registered address; not proof of a current physical operating establishment.', '登記地址，不能證實現正營業的實體場所。'],
  Longitude: ['Source-published longitude; never transferred across unverified joins.', '來源公布經度，不轉移至未驗證的關聯。'], Latitude: ['Source-published latitude; never transferred across unverified joins.', '來源公布緯度，不轉移至未驗證的關聯。'],
};
function SourceDefinitions({ sources, language }: { sources: unknown; language: Language }) {
  const index = language === 'zh' ? 1 : 0;
  if (!Array.isArray(sources)) return null;
  return <>{sources.map((source: { id: string; title: string; catalogueUrl: string; fieldDefinitions: Record<string, string> }) => <article key={source.id}><h4>{source.title}</h4><p>{source.id === 'failed' ? (index ? '統計單位：公布的不合格樣本列，不代表已驗證唯一樣本。' : 'Statistical unit: a published noncompliant sample row, not a validated unique sample.') : source.id === 'grading' ? (index ? '統計單位：公布的通過評核場所列，不代表所有餐飲場所。' : 'Statistical unit: a published passing establishment row, not all food establishments.') : (index ? '統計單位：商業登記列，不代表實際營業場所。' : 'Statistical unit: a registered business row, not a physical operating establishment.')}</p><a href={source.catalogueUrl} target="_blank" rel="noopener noreferrer">{index ? '官方資料目錄' : 'Official data catalogue'}</a><dl>{Object.keys(source.fieldDefinitions).map(key => <div className="policy11-fact" key={key}><dt>{key}</dt><dd>{fieldDefinitions[key]?.[index] ?? source.fieldDefinitions[key]}</dd></div>)}</dl></article>)}</>;
}
function EvidenceFacts({ value, language }: { value: unknown; language: Language }) {
  const index = language === 'zh' ? 1 : 0;
  if (value == null) return <span>{index ? '無法由權威證據確認' : 'Not established by authoritative evidence'}</span>;
  if (typeof value === 'boolean') return <span>{value ? (index ? '是' : 'Yes') : (index ? '否' : 'No')}</span>;
  if (Array.isArray(value)) return <>{value.map((item, i) => <div key={i}><EvidenceFacts value={item} language={language} /></div>)}</>;
  if (typeof value === 'object') return <dl>{Object.entries(value).filter(([key]) => key in factLabels).map(([key, item]) => <div className="policy11-fact" key={key}><dt>{factLabels[key][index]}</dt><dd>{key === 'sampleCountMeaning' ? (index ? '公布樣本列數，不是已驗證唯一樣本數。' : 'Published sample rows, not validated unique samples.') : key === 'eventGroupingRule' ? (index ? '完全相同的抽驗日期＋公布地點＋專案；僅為候選，不視為唯一抽驗事件。' : 'Exact sampling date + published location + project; candidates only, not validated unique inspections.') : key === 'identifierNamespace' ? (index ? '公司／商業登記識別碼，與食品業者登錄字號不同。' : 'Company/business registration ID; distinct from food-business registration.') : <EvidenceFacts value={item} language={language} />}</dd></div>)}</dl>;
  const sourceNames: Record<string, [string, string]> = { failed: ['Failed samples', '不合格樣本'], grading: ['Hygiene passing list', '衛生評核通過名單'], registry: ['Business registrations', '商業登記'] };
  return <span>{sourceNames[String(value)]?.[index] ?? String(value)}</span>;
}
function saveDownload(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Policy11Module({ language }: { language: Language }) {
  const zh = language === 'zh';
  const t = (en: string, cn: string) => zh ? cn : en;
  const [snapshot, setSnapshot] = useState<Policy11Snapshot | null>(null);
  const [error, setError] = useState(false); const [attempt, setAttempt] = useState(0);
  const [view, setView] = useState<View>('findings');
  const [capacity, setCapacity] = useState<5 | 10 | 'all'>(5);
  const [strategy, setStrategy] = useState<'evidence-first' | 'balanced'>('evidence-first');
  const [page, setPage] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setError(false); setSnapshot(null);
    fetch(`${evidencePath}manifest.json`, { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('Snapshot unavailable');
      const manifest = await response.json();
      if (!manifest || typeof manifest.path !== 'string' || !/^snapshot-[a-f0-9]{20}\.json$/.test(manifest.path) || !/^[a-f0-9]{64}$/.test(manifest.sha256) || !Number.isSafeInteger(manifest.byteLength) || manifest.path !== `snapshot-${manifest.sha256.slice(0, 20)}.json`) throw new Error('Invalid manifest');
      const snapshotResponse = await fetch(`${evidencePath}${manifest.path}`, { signal: controller.signal });
      if (!snapshotResponse.ok) throw new Error('Snapshot unavailable');
      const bytes = await snapshotResponse.arrayBuffer();
      const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), byte => byte.toString(16).padStart(2, '0')).join('');
      if (bytes.byteLength !== manifest.byteLength || digest !== manifest.sha256) throw new Error('Evidence integrity failure');
      const data: unknown = JSON.parse(new TextDecoder().decode(bytes));
      if (!isPolicy11Snapshot(data) || data.snapshotId !== manifest.snapshotId) throw new Error('Invalid snapshot');
      setSnapshot(data);
    }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [attempt]);
  const options = useMemo(() => ({ capacity, strategy }), [capacity, strategy]);
  const result = useMemo(() => snapshot ? selectReviewRecords(snapshot, options) : null, [snapshot, options]);
  const identity = useMemo(() => snapshot ? reconcileIdentities(snapshot.records) : null, [snapshot]);
  useEffect(() => setPage(0), [capacity, strategy]);
  const reason = (code: string) => reasonLabels[code]?.[language] ?? code;
  const unit = (value: string) => ({ sample: t('Published sample', '公布樣本'), grading: t('Passing-list record', '通過名單紀錄'), registry: t('Registration record', '商業登記紀錄') })[value] ?? value;
  const tabs: Array<[View, string]> = [['findings', t('Findings & boundaries', '發現與證據界線')], ['review', t('Mode A · Review queue', '模式 A · 文件查核清單')], ['identity', t('Modes B & C', '模式 B 與 C')], ['audit', t('Source audit', '來源稽核')]];
  return <section className="policy11" aria-labelledby="policy11-title">
    <header className="module-header"><p>{t('POLICY 11 · Evidence before inference', '政策 11 · 先確認證據，再作推論')}</p><h2 id="policy11-title">{t('Food hygiene evidence review', '食品衛生證據查核')}</h2><span>{t('With limited administrative investigation capacity, which published records warrant further documentary verification?', '在行政調查量能有限的情況下，哪些已公布紀錄值得進一步查核文件？')}</span></header>
    <div className="policy11-notice"><p>{t('This tool prioritizes documentation work. Review tiers describe evidence gaps, not current food-safety risk, business quality or enforcement recommendations.', '本工具協助安排文件查核。查核層級代表證據缺口，不代表目前食品安全風險、店家品質或裁罰建議。')}</p></div>
    {error ? <div className="policy11-panel" role="alert"><h3>{t('Evidence snapshot could not be loaded', '無法載入證據快照')}</h3><p>{t('The file is unavailable or its schema is invalid. No review selections have been generated.', '檔案無法取得或格式驗證未通過，尚未產生查核清單。')}</p><button onClick={() => setAttempt(value => value + 1)}>{t('Retry', '重新載入')}</button></div> : !snapshot || !result ? <p role="status">{t('Loading and validating the evidence snapshot…', '正在載入並驗證證據快照…')}</p> : <>
      <div className="policy11-muted"><small>{t('Immutable snapshot', '不可變證據快照')} <code>{snapshot.snapshotId}</code> · {t('Generated', '產生時間')} {snapshot.generatedAt}</small></div>
      <nav className="green-store-tabs" aria-label={t('Evidence review sections', '證據查核區段')}>{tabs.map(([id, label]) => <button key={id} className={view === id ? 'active' : ''} aria-pressed={view === id} onClick={() => setView(id)}>{label}</button>)}</nav>
      {view === 'findings' && <>
        <div className="policy11-grid">{[[snapshot.records.filter(record => record.unit === 'sample').length, t('Published failed-sample rows', '公布不合格樣本列數')], [snapshot.records.filter(record => record.unit === 'grading').length, t('Passing-list records', '通過評核名單紀錄')], [snapshot.records.filter(record => record.unit === 'registry').length, t('Registration records', '商業登記紀錄')], [snapshot.sourceEditions.length, t('Retained source editions', '保留來源版本')]].map(([count, label]) => <article className="summary-tile" key={String(label)}><span>{label}</span><strong>{count}</strong></article>)}</div>
        <article className="policy11-panel"><h3>{t('The engineering approach', '工程方法')}</h3><p>{t('Retain source editions and byte hashes; separate samples, possible inspection events and batches; preserve identifier namespaces; then create a deterministic, capacity-constrained documentary review queue. Every selection carries a source record ID and an explanation.', '保留來源版本與位元組雜湊，區分樣本、可能的抽驗事件與批次，保留不同識別碼命名空間，再建立可重現且受量能限制的文件查核清單。每筆入選紀錄均附來源紀錄識別碼與理由。')}</p></article>
        <div className="policy11-grid"><article className="policy11-panel"><h3>{t('Failed publications are a cohort', '不合格公布資料是特定群體')}</h3><p>{t('Published failed samples do not describe all inspections. Similar names and dates can suggest an event grouping but cannot validate an inspection event or product batch. A comparable denominator is absent; citywide failure rates are unavailable.', '公布的不合格樣本並非所有抽驗。相同名稱與日期僅能提示事件分組，無法證實同一抽驗事件或產品批次。缺少可比較的分母，無法計算全市不合格率。')}</p></article><article className="policy11-panel"><h3>{t('Passing lists have a limited meaning', '通過名單有明確的適用範圍')}</h3><p>{t('A hygiene grading record documents inclusion in a published passing list. The business registry describes registrations, not an inspection universe. Absence from the passing list is not a failed assessment.', '衛生評核紀錄僅表示列入公布的通過名單。商業登記資料描述登記情形，不是抽驗母體。未列入通過名單不代表評核不合格。')}</p></article></div>
        <article className="policy11-panel"><h3>{t('Observed validation results', '實際驗證結果')}</h3><p>{t('Counts below refer to this retained snapshot, not current operating establishments. Null event or batch counts mean that authoritative identifiers are insufficient.', '下列數字僅描述本次保留快照，不代表現正營業的場所。事件或批次數為 null 時，表示權威識別碼不足。')}</p><EvidenceFacts value={snapshot.validation} language={language} /></article>
      </>}
      {view === 'review' && <article className="policy11-panel"><h3>{t('Mode A · Source and documentation review', '模式 A · 來源與文件查核')}</h3><p>{t('T1: compare changed source editions. T2: verify missing original bytes, dates or identifier namespaces. T3: review other documentary flags or routine source confirmation. Tiers are deterministic documentary priorities; they are not hazard scores.', 'T1：比對來源版本差異。T2：查核缺少的原始位元組、日期或識別碼類型。T3：查核其他文件標記或例行來源確認。這些層級為可重現的文件工作優先序，不是危害分數。')}</p>
        <div className="policy11-controls"><label>{t('Investigation capacity (records)', '調查量能（筆數）')}<select value={capacity} onChange={event => setCapacity(event.target.value === 'all' ? 'all' : Number(event.target.value) as 5 | 10)}><option value="5">5</option><option value="10">10</option><option value="all">{t('All', '全部')}</option></select></label><label>{t('Selection strategy', '選取策略')}<select value={strategy} onChange={event => setStrategy(event.target.value as typeof strategy)}><option value="evidence-first">{t('Evidence first', '證據優先')}</option><option value="balanced">{t('Administratively balanced', '行政分配均衡')}</option></select></label></div>
        <p>{strategy === 'evidence-first' ? t('Evidence first orders documentary tiers with stable record-ID tie breaking.', '證據優先依文件層級排序，並以固定紀錄識別碼決定同層順序。') : t('Balanced selection distributes review capacity across source cohorts while retaining tier order within each cohort. It is a workload choice, not a statement of equal risk.', '均衡策略將查核量能分配至不同來源群體，各群體內保留層級順序。這是工作分配選擇，不表示風險相同。')}</p>
        <p role="status"><strong>{result.selected.length}</strong> {t('selected from', '筆入選，候選共')} <strong>{result.eligibleCount}</strong> {t('eligible records', '筆')}</p>
        <div className="policy11-downloads"><button onClick={() => saveDownload(JSON.stringify(buildPolicy11Export(snapshot, options), null, 2), `policy11-${snapshot.snapshotId}-${strategy}-${capacity}.json`, 'application/json;charset=utf-8')}>{t('Export evidence JSON', '匯出證據 JSON')}</button><button onClick={() => saveDownload(policy11Csv(snapshot, options), `policy11-${snapshot.snapshotId}-${strategy}-${capacity}.csv`, 'text/csv;charset=utf-8')}>{t('Export safe CSV', '匯出安全 CSV')}</button></div><small>{t('Exports preserve selected IDs, source provenance and limitations. CSV neutralizes spreadsheet formulas. Source names are retained verbatim.', '匯出保留入選識別碼、來源脈絡與限制。CSV 會防止試算表公式執行，來源名稱依原文保留。')}</small>
        <div className="policy11-scroll"><table className="policy11-table"><caption>{t('Selected documentary review records (25 per page)', '入選文件查核紀錄（每頁 25 筆）')}</caption><thead><tr>{[t('Record / original name', '紀錄／原始名稱'), t('Tier / unit', '層級／統計單位'), t('Event date / source edition', '事件日期／來源版本'), t('Why verify?', '查核理由')].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{result.selected.slice(page * 25, page * 25 + 25).map(selection => <tr key={selection.record.id}><td><strong>{selection.record.name || t('Unnamed record', '未具名紀錄')}</strong><br /><code>{selection.record.id}</code><br /><small>{selection.record.address}</small></td><td><span className="policy11-badge">{selection.tier}</span><br />{unit(selection.record.unit)}</td><td>{selection.record.eventDate ?? t('Not provided', '未提供')}<br /><code>{selection.record.editionId}</code><br /><code>{selection.record.sourceId}</code></td><td><ul>{selection.reasons.map(code => <li key={code}>{reason(code)}</li>)}</ul></td></tr>)}</tbody></table></div>
        {result.selected.length > 25 && <div className="policy11-pagination"><button disabled={page === 0} onClick={() => setPage(value => value - 1)}>{t('Previous', '上一頁')}</button><span>{page + 1} / {Math.ceil(result.selected.length / 25)}</span><button disabled={(page + 1) * 25 >= result.selected.length} onClick={() => setPage(value => value + 1)}>{t('Next', '下一頁')}</button></div>}
        <h4>{t('Sensitivity: what changes with capacity and strategy?', '敏感度：量能與策略改變時有何差異？')}</h4><p>{t('Compare actual selected IDs and overlap. A changed queue is an administrative sensitivity, not evidence of changing food-safety risk.', '比較實際入選識別碼與重疊程度。清單改變反映行政選取敏感度，不是食品安全風險改變的證據。')}</p><div className="policy11-scroll"><table className="policy11-table"><thead><tr>{[t('Strategy', '策略'), t('Capacity', '量能'), t('Selected / overlap', '入選／重疊'), t('Added / removed', '新增／移除'), t('Record IDs', '紀錄識別碼')].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{result.sensitivity.map(row => <tr key={`${row.strategy}-${row.capacity}`}><td>{row.strategy === 'balanced' ? t('Administratively balanced', '行政分配均衡') : t('Evidence first', '證據優先')}</td><td>{row.capacity === 'all' ? t('All', '全部') : row.capacity}</td><td>{row.selectedIds.length} / {row.overlap}</td><td>+{row.addedIds.length} / −{row.removedIds.length}</td><td><details><summary>{t('Preview first 25 IDs', '預覽前 25 筆識別碼')}</summary><pre>{row.selectedIds.slice(0, 25).join('\n')}</pre></details></td></tr>)}</tbody></table></div><small>{t('Overlap is measured against the current selection. Full ID lists for every scenario are included in JSON exports.', '重疊筆數以目前選取清單為基準。JSON 匯出包含各情境的完整識別碼。')}</small>
      </article>}
      {view === 'identity' && <>
        <article className="policy11-panel"><h3>{t('Mode B · Independently validated associations only', '模式 B · 僅接受獨立驗證的關聯')}</h3><p>{t('Company numbers, food-business registration IDs, trade names, addresses, physical establishments and sampled products represent different entities. Exact-looking names or addresses alone do not independently verify a link. Unresolved or ambiguous associations are excluded; inspection findings are never transferred through them.', '公司統一編號、食品業者登錄字號、商號名稱、地址、實體營業場所與抽驗產品是不同實體。名稱或地址相同仍不足以獨立驗證關聯。未解決或有歧義的關聯均排除，不會據此轉移抽驗結果。')}</p><div className="policy11-grid">{[[identity?.matchingCoverage.matchedRecords ?? 0, t('Independently validated records', '獨立驗證紀錄')], [identity?.unresolvedIds.length ?? 0, t('Unresolved identities', '未解決身分')], [identity?.excludedSampleIds.length ?? 0, t('Samples excluded from establishment joins', '排除場所配對的樣本')], [identity?.candidates.length ?? 0, t('Unvalidated name/address candidates', '未驗證名稱／地址候選')]].map(([count, label]) => <div className="summary-tile" key={String(label)}><span>{label}</span><strong>{count}</strong></div>)}</div><p>{t('Validated coverage', '已驗證涵蓋率')}: {identity?.matchingCoverage.matchedRecords ?? 0} / {identity?.matchingCoverage.totalRecords ?? 0}</p><button disabled>{t('Establishment comparison unavailable without validated links', '缺少已驗證關聯，無法比較營業場所')}</button><p>{t('Matching coverage, unresolved identity counts and exclusions are computed from this snapshot and included in evidence exports. No coordinates are inferred.', '配對涵蓋範圍、未解決身分數與排除情形由此快照計算，並納入證據匯出，不推估座標。')}</p><EvidenceFacts value={snapshot.validation} language={language} /></article>
        <article className="policy11-panel"><h3>{t('Source-version comparisons', '來源版本比較')}</h3><p>{t('A catalogue update, local retrieval and inspection event date are distinct timestamps. A newer catalogue entry does not prove a newer inspection or continued business operation.', '目錄更新時間、本機擷取時間與抽驗事件日期是不同時間。較新的目錄版本不代表較新的抽驗事件或持續營業。')}</p><EvidenceFacts value={snapshot.sourceComparisons} language={language} /></article>
        <article className="policy11-panel"><h3>{t('Mode C · Current risk and business hazard ranking', '模式 C · 即時風險與業者危害排名')}</h3><button disabled>{t('Unavailable · authoritative evidence insufficient', '無法使用 · 權威證據不足')}</button><p>{t('These publications do not establish current exposure, severity, comparable inspection coverage or verified establishment identity. Current food-safety risk and business hazard rankings cannot be supported.', '這些公布資料不足以確認目前暴露、嚴重程度、可比較抽驗涵蓋範圍或經驗證的場所身分，因此無法支持即時食品安全風險或業者危害排名。')}</p></article>
      </>}
      {view === 'audit' && <article className="policy11-panel"><h3>{t('Source editions and provenance', '來源版本與溯源')}</h3><p>{t('A SHA-256 hash identifies the bytes of the retained file. It only represents original publication bytes when explicitly recorded as such; a transformed project snapshot is not the original CSV. Unknown timestamps remain unknown.', 'SHA-256 雜湊識別保留檔案的位元組。只有明確註記時才代表原始發布位元組，轉換後的專案快照不等於原始 CSV。未知時間仍保留為未知。')}</p>{snapshot.sourceEditions.map(edition => <details key={edition.id}><summary>{edition.title} · <code>{edition.id}</code></summary><dl><dt>{t('Official source', '官方來源')}</dt><dd><a href={edition.url} target="_blank" rel="noopener noreferrer">{edition.url}</a></dd><dt>{t('Retained file / byte type', '保留檔案／位元組類型')}</dt><dd><code>{String(edition.path ?? '')}</code><br />{edition.originalBytesAvailable ? t('Original official publication bytes', '官方原始公布位元組') : t('Transformed project JSON; original bytes unavailable', '轉換後專案 JSON；無原始位元組')}</dd><dt>SHA-256</dt><dd><code>{edition.sha256}</code></dd><dt>{t('Catalogue updated', '目錄更新時間')}</dt><dd>{edition.catalogueUpdatedAt ?? t('Unknown', '未知')}</dd><dt>{t('Resource updated', '資源更新時間')}</dt><dd>{String(edition.resourceUpdatedAt ?? t('Unknown', '未知'))}</dd><dt>{t('Published rows / bytes', '公布列數／位元組')}</dt><dd>{String(edition.rowCount ?? t('Unknown', '未知'))} / {String(edition.byteLength ?? t('Unknown', '未知'))}</dd><dt>{t('Locally retrieved', '本機擷取時間')}</dt><dd>{edition.retrievedAt ?? t('Unknown', '未知')}</dd></dl><details><summary>{t('Full edition metadata and field definitions', '完整版本中繼資料與欄位定義')}</summary><pre>{JSON.stringify(edition, null, 2)}</pre></details></details>)}<details><summary>{t('Source definitions and statistical units', '來源定義與統計單位')}</summary><SourceDefinitions sources={snapshot.sources} language={language} /><details><summary>{t('Verbatim source metadata', '來源中繼資料原文')}</summary><pre>{JSON.stringify(snapshot.sources, null, 2)}</pre></details></details><h4>{t('Advertised coverage versus actual observation dates', '目錄涵蓋範圍與實際觀測日期')}</h4><p>{t('These are the retrieved catalogue claims, not historical inspection dates. Null ranges remain unverified.', '以下為本次擷取的目錄敘述，不是歷史抽驗日期；空值範圍仍未獲確認。')}</p><EvidenceFacts value={snapshot.catalogueTemporalCoverage} language={language} /><h4>{t('Recorded limitations', '已記錄限制')}</h4><ul>{[
          t('No comparable inspection denominator; no citywide failure rate.', '沒有可比較抽驗分母，不計算全市不合格率。'),
          t('No published unique sample, event or batch IDs; event groups are candidates only.', '沒有公布唯一樣本、事件或批次識別碼；事件分組僅為候選。'),
          t('Passing-list absence is not failure. Assessment dates and a failed-grading universe are absent.', '未列入通過名單不代表不合格；缺少評核日期與完整未通過評核母體。'),
          t('Historical project JSON lacks original CSV bytes and historical acquisition times.', '歷史專案 JSON 缺少原始 CSV 位元組與歷史擷取時間。'),
          t('Catalogue updates describe publication metadata, not inspection dates.', '目錄更新描述發布中繼資料，不是抽驗日期。'),
          t('Registration IDs, trade names, addresses, establishments and products remain distinct.', '登記識別碼、商號、地址、場所與產品維持各自不同的實體意義。'),
          t('Current risk assessment and business hazard ranking remain unavailable.', '無法提供即時風險評估與業者危害排名。'),
        ].map(item => <li key={item}>{item}</li>)}</ul><details><summary>{t('Snapshot limitation statements (verbatim)', '快照限制敘述（原文）')}</summary><pre>{JSON.stringify(snapshot.limitations, null, 2)}</pre></details></article>}
    </>}
  </section>;
}
