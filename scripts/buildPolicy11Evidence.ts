import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parseCsv } from './dataPipeline';
import { validatePolicy11Headers } from './policy11EvidenceValidation';
const base = 'public/data/policy-11';
const hash = (bytes: Uint8Array | string) => createHash('sha256').update(bytes).digest('hex');
const clean = (value: unknown) => String(value ?? '').replace(/\s+/g,' ').trim();
const acquisition = JSON.parse(await readFile(`${base}/evidence/acquisition.json`,'utf8'));
for (const item of acquisition) {
  const bytes = await readFile(`${base}/evidence/${item.file}`);
  if (hash(bytes) !== item.sha256 || bytes.length !== item.byteLength) throw new Error(`Evidence integrity failure: ${item.file}`);
}
for (const sourceId of ['failed','grading','registry']) {
  const html=await readFile(`${base}/evidence/${sourceId}-catalogue.html`,'utf8');
  const published=[...new Set([...html.matchAll(/resource\.download\?rid=([a-z0-9-]+)/g)].map(m=>m[1]))].sort();
  const acquired=acquisition.filter((i:any)=>i.file.endsWith('.csv') && (i.id===sourceId || i.id.startsWith(`${sourceId}-`))).map((i:any)=>i.url.split('rid=')[1]).sort();
  if (JSON.stringify(published)!==JSON.stringify(acquired)) throw new Error(`Incomplete catalogue resource inventory: ${sourceId}`);
}
const retained: Record<string, any[]> = {};
const manifest: any[] = [];
for (const sourceId of ['failed','grading','registry']) {
  const bytes = await readFile(`${base}/retained/${sourceId}.json`);
  retained[sourceId] = JSON.parse(bytes.toString());
  manifest.push({sourceId,path:`retained/${sourceId}.json`,sha256:hash(bytes),byteLength:bytes.length,origin:'retained-project-json',originalBytesAvailable:false,originalRetrievalAt:null});
}
const manifestPath = `${base}/retained-manifest.json`;
if (process.argv.includes('--seal-retained')) await writeFile(manifestPath,`${JSON.stringify(manifest,null,2)}\n`,{flag:'wx'});
if (JSON.stringify(JSON.parse(await readFile(manifestPath,'utf8'))) !== JSON.stringify(manifest)) throw new Error('Retained project evidence integrity failure');
const urls: Record<string,string> = {failed:'https://data.taipei/dataset/detail?id=09a917a0-0fb5-47e1-957c-5f1268fba517',grading:'https://data.taipei/dataset/detail?id=59579c19-a561-4564-8c0f-545bfb32c0f6',registry:'https://data.taipei/dataset/detail?id=178abc4e-fe32-4fc9-af3a-7baf1c15082c'};
const titles: Record<string,string> = {failed:'臺北市衛生局食品抽驗不合格清冊',grading:'臺北市通過餐飲衛生管理分級評核業者',registry:'設址臺北市所營事業含餐館業清冊'};
const metadata: Record<string,string> = {failed:'2026-07-14T10:44:49+08:00',grading:'2026-07-15T09:33:57+08:00',registry:'2026-09-23T16:00:04+08:00'};
const resourceUpdated: Record<string,string> = {'failed-113':'2025-12-16T10:22:17+08:00','failed-112':'2025-12-16T10:22:01+08:00','failed-111':'2025-12-16T10:21:49+08:00',grading:'2025-12-19T13:53:20+08:00',registry:'2026-09-23T15:59:54+08:00'};
const fields: Record<string,Record<string,string>> = {
  failed:{專案名稱:'Published sampling project; not a batch identifier',抽驗日期:'Sampling date, not catalogue update time',分類:'Product category',檢體名稱:'Sampled product label; not a unique sample identifier',抽驗行政郵遞區號:'Sampling postal district',抽驗地點:'Published sampling location; may combine trade name and address',檢驗結果:'Published noncompliance result',不符合規定原因:'Published reason; multiple analytes may appear in one sample row'},
  grading:{行政區域代碼:'Administrative area code',業者名稱店名:'Published trade or establishment name',食品業者登錄字號:'Food-business registration namespace; not company registration',地址:'Published establishment address',評核結果:'Published passing grade; no assessment date in resource'},
  registry:{統一編號:'Company/business registration namespace; preserve source string, do not pad or equate to food-business ID',商業名稱:'Registered business name; not necessarily trade name',商業地址:'Registered business address; not proof of operating establishment',Longitude:'Published longitude; not transferable to unverified associations',Latitude:'Published latitude; not transferable to unverified associations'},
};
const sourceEditions: any[] = [];
const official: Record<string,any[]> = {failed:[],grading:[],registry:[]};
for (const item of acquisition.filter((i:any) => i.file.endsWith('.csv'))) {
  const sourceId = item.id.startsWith('failed')?'failed':item.id;
  const rows = parseCsv(new TextDecoder('utf-8',{fatal:true}).decode(await readFile(`${base}/evidence/${item.file}`)));
  validatePolicy11Headers(Object.keys(rows[0]??{}),Object.keys(fields[sourceId]),item.id);
  const editionId = `${item.id}-official-${item.sha256.slice(0,12)}`;
  official[sourceId].push(...rows.map((raw:any) => ({raw,editionId,sourceYear:Number(item.id.split('-')[1])||null})));
  sourceEditions.push({...item,id:editionId,sourceId,title:titles[sourceId],path:`evidence/${item.file}`,catalogueUrl:urls[sourceId],catalogueUpdatedAt:metadata[sourceId],resourceUpdatedAt:resourceUpdated[item.id],originalBytesAvailable:true,origin:'official-resource',rowCount:rows.length,fieldDefinitions:fields[sourceId]});
}
for (const item of manifest) sourceEditions.push({...item,id:`${item.sourceId}-retained-${item.sha256.slice(0,12)}`,title:titles[item.sourceId],url:urls[item.sourceId],catalogueUpdatedAt:null,retrievedAt:null,rowCount:retained[item.sourceId].length,notes:'Hash authenticates retained transformed project JSON only; historical original CSV bytes and acquisition timestamp are unavailable.'});
const failedKey = (r:any) => [r['抽驗日期'],r['檢體名稱'],r['抽驗地點'],r['檢驗結果'],r['不符合規定原因']].map(clean).join('|');
const retainedFailedKey = (r:any) => [r.inspectionDateRaw,r.sampleName,r.inspectionLocation,r.inspectionResult,r.noncomplianceReason].map(clean).join('|');
const key = (id:string,r:any) => id==='failed'?failedKey(r):id==='grading'?[r['食品業者登錄字號'],r['業者名稱店名'],r['地址'],r['評核結果']].map(clean).join('|'):[r['統一編號'],r['商業名稱'],r['商業地址']].map(clean).join('|');
const retainedKey = (id:string,r:any) => id==='failed'?retainedFailedKey(r):id==='grading'?[r.foodBusinessRegistrationNumber,r.businessName,r.address,r.assessmentResult].map(clean).join('|'):[r.businessRegistrationId,r.name,r.address].map(clean).join('|');
const sourceComparisons = Object.keys(official).map(sourceId => {
  const before = new Set(retained[sourceId].map(r=>retainedKey(sourceId,r)));
  const after = new Set(official[sourceId].map(r=>key(sourceId,r.raw)));
  return {sourceId,retainedRows:retained[sourceId].length,officialRows:official[sourceId].length,retainedDistinctKeys:before.size,officialDistinctKeys:after.size,unchangedKeys:[...before].filter(k=>after.has(k)).length,onlyRetainedKeys:[...before].filter(k=>!after.has(k)).length,onlyOfficialKeys:[...after].filter(k=>!before.has(k)).length,comparisonUnit:sourceId==='failed'?'date + product + sampling location + result + reason':'identifier + name + address (+ grading result)',interpretation:'Edition differences are documentary changes, not new inspection events or business safety changes.'};
});
const records: any[] = [];
const usedIds = new Set<string>();
const retainedIndexes = Object.fromEntries(Object.keys(retained).map(id=>[id,new Map(retained[id].map(r=>[retainedKey(id,r),r]))]));
for (const sourceId of Object.keys(official)) for (const {raw:r,editionId,sourceYear} of official[sourceId]) {
  const failed = sourceId==='failed'; const grading=sourceId==='grading';
  const k=key(sourceId,r); const old=retainedIndexes[sourceId].get(k);
  const date = failed && /^\d{8}$/.test(r['抽驗日期']) ? `${r['抽驗日期'].slice(0,4)}-${r['抽驗日期'].slice(4,6)}-${r['抽驗日期'].slice(6)}`:null;
  const flags=failed?['event-id-unavailable','batch-id-unavailable','identity-unresolved']:grading?['assessment-date-unavailable','identity-unresolved']:['identifier-namespace-unverified','identity-unresolved'];
  if (!old) flags.push('source-edition-changed');
  let id=old?.id??`policy11_${sourceId}_${hash(k).slice(0,16)}`;
  if (usedIds.has(id)) { id=`${id}_published_duplicate_${records.length}`; flags.push('duplicate-published-row'); }
  usedIds.add(id);
  records.push({id,sourceId,editionId,unit:failed?'sample':grading?'grading':'registry',name:failed?r['檢體名稱']:grading?r['業者名稱店名']:r['商業名稱'],address:failed?r['抽驗地點']:grading?r['地址']:r['商業地址'],district:old?.districtName??old?.district??'',eventDate:date,flags,identifiers:failed?[]:[{namespace:grading?'food-business-registration':'company-business-registration',value:grading?r['食品業者登錄字號']:r['統一編號']}],originalRecordId:old?.id??null,sourceYear,sourceRowKey:k,...(failed?{project:r['專案名稱'],category:r['分類'],result:r['檢驗結果'],reason:r['不符合規定原因']} : grading?{grade:r['評核結果']}:{})});
}
const failed=records.filter(r=>r.sourceId==='failed'); const dates=failed.map(r=>r.eventDate).filter(Boolean).sort();
const groups=new Map<string,string[]>();
for (const r of failed) { const k=[r.eventDate,r.address,r.project].join('|'); groups.set(k,[...(groups.get(k)??[]),r.id]); }
const validation={failed:{sampleCount:failed.length,distinctPublishedSampleRows:new Set(failed.map(r=>r.sourceRowKey)).size,eventCandidateGroups:groups.size,validatedEventCount:null,batchCount:null,eventGroupingRule:'Exact sampling date + published location + project; candidates only, not asserted unique inspections',multiSampleCandidateGroups:[...groups.values()].filter(g=>g.length>1).length,eventDateRange:{from:dates[0],to:dates.at(-1)},missingEventDates:failed.filter(r=>!r.eventDate).length,allResultsNoncompliant:failed.every(r=>r.result==='不符合規定'),denominatorAvailable:false},grading:{recordCount:official.grading.length,assessmentDatesAvailable:false,passingListOnly:true,results:[...new Set(records.filter(r=>r.sourceId==='grading').map(r=>r.grade))]},registry:{recordCount:official.registry.length,physicalEstablishmentValidated:false,identifierNamespace:'company-business-registration'}};
Object.assign(validation.failed,{publishedRowCount:failed.length,duplicatePublishedRows:failed.length-validation.failed.distinctPublishedSampleRows,validatedUniqueSampleCount:null,sampleCountMeaning:'Published sample rows, not independently validated unique samples'});
const limitations=['Failed-only published sample rows do not provide a comparable total-inspection denominator; no citywide failure rate is calculated.','No official unique sample, inspection-event or batch identifiers are published. Event groups are documentary candidates, never validated inspection counts.','Passing-list absence is not failure. No assessment dates or failed grading universe are published.','Historical retained project JSON lacks historical original CSV bytes and retrieval timestamps. Its hash is not an original-source-byte hash.','Catalogue coverage and update dates describe publication metadata; actual failed sample dates must be read separately.','Company registration, food-business registration, trade names, addresses, physical establishments and sampled products remain distinct. Matching is not evidence of current safety.','Mode C current food-safety risk or hazard ranking remains unavailable.'];
const generatedAt=acquisition.map((i:any)=>i.retrievedAt).sort().at(-1);
const catalogueEvidence=acquisition.filter((i:any)=>i.file.endsWith('.html')).map((i:any)=>({...i,sourceId:i.id.replace('-catalogue',''),path:`evidence/${i.file}`,origin:'official-catalogue-html',originalBytesAvailable:true}));
const catalogueTemporalCoverage={failed:{rawStart:'2022-03-26',rawEnd:'2026-07-14',actualSamplingRange:validation.failed.eventDateRange},grading:{rawStart:'2025-12-19',rawEnd:'2026-07-15',actualAssessmentRange:null},registry:{rawStart:null,rawEnd:null,actualOperatingRange:null}};
const snapshotBody={schemaVersion:1,generatedAt,sourceEditions,catalogueEvidence,catalogueTemporalCoverage,sources:Object.keys(official).map(id=>({id,title:titles[id],catalogueUrl:urls[id],unit:id==='failed'?'published noncompliant sample row':id==='grading'?'published passing grading establishment row':'registered business row',fieldDefinitions:fields[id]})),records,validation,sourceComparisons,limitations};
const snapshot={snapshotId:`policy-11-${hash(JSON.stringify(snapshotBody))}`,...snapshotBody};
const output=`${JSON.stringify(snapshot,null,2)}\n`;
const filename=`snapshot-${hash(output).slice(0,20)}.json`;
const pointer=`${JSON.stringify({schemaVersion:1,snapshotId:snapshot.snapshotId,path:filename,sha256:hash(output),byteLength:Buffer.byteLength(output)},null,2)}\n`;
if (process.argv.includes('--check')) {
  if (await readFile(`${base}/${filename}`,'utf8')!==output || await readFile(`${base}/manifest.json`,'utf8')!==pointer) throw new Error('Snapshot differs from deterministic reproduction');
} else {
  try { await writeFile(`${base}/${filename}`,output,{flag:'wx'}); }
  catch (error: any) { if (error.code!=='EEXIST' || await readFile(`${base}/${filename}`,'utf8')!==output) throw error; }
  await writeFile(`${base}/manifest.json`,pointer);
}
console.log(JSON.stringify({snapshotId:snapshot.snapshotId,records:records.length,validation,sourceComparisons},null,2));
