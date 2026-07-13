import { useEffect, useMemo, useState } from 'react';
import type { TranslationKey } from '../data/translations';
import type { GreenStoreDirectoryRecord, GreenStoreDirectorySummary, Language } from '../types';
import { DisclaimerNotice } from './DisclaimerNotice';

type Props = {
  summary?: GreenStoreDirectorySummary;
  language: Language;
  t: (key: TranslationKey) => string;
};

type View = 'overview' | 'districts' | 'types' | 'directory' | 'quality' | 'notes';
type SummaryShape = Record<string, unknown>;

const dataPath = `${import.meta.env.BASE_URL}data/green-store-directory/records.json`;
const chineseDisclaimer =
  '本資料集供臺北市綠色商店與綠色消費相關業者之公開查詢使用，不代表即時營業狀態、目前認證狀態、商品供應、環境表現、價格、服務品質、食品安全或官方推薦。請向店家或相關主管機關確認目前營業、商品、服務及認證資訊。';
const englishDisclaimer =
  'This dataset is for public lookup of Taipei green stores and sustainable-consumption businesses. It does not represent real-time operating status, current certification status, product availability, environmental performance, prices, service quality, food safety, or official recommendation. Confirm current business, product, service, and certification information with the store or relevant authority.';

const copy = (language: Language) =>
  language === 'zh'
    ? {
        eyebrow: '友善商家、綠色消費與永續生活', title: '臺北市綠色商店名錄', intro: '依行政區與商店類型瀏覽公開名錄；地址僅用於外部查詢，不顯示地圖或座標。',
        overview: '總覽', districts: '行政區分布', types: '綠色商店類型', directory: '商店名錄', quality: '資料品質', notes: '資料說明',
        total: '商店筆數', uniqueNames: '不重複店名', districtsCovered: '涵蓋行政區', storeTypes: '商店類型', withPhone: '有電話的資料', topDistrict: '商店最多行政區', topType: '最常見商店類型',
        search: '搜尋', searchPlaceholder: '店名、店號、行政區、地址、類型或電話', allDistricts: '全部行政區', allTypes: '全部類型', phoneOnly: '僅顯示有電話資料', results: '筆結果',
        storeName: '商店名稱', storeType: '綠色商店類型', district: '行政區', address: '地址', phone: '電話', mobile: '行動電話', storeNumber: '商店編號', map: '地圖查詢', noResults: '沒有符合目前篩選條件的資料。',
        districtChart: '各行政區商店數', typeChart: '各綠色商店類型筆數', phoneChart: '電話資料完整度', withPhoneChart: '有電話', withoutPhoneChart: '無電話',
        qualityTitle: '轉換與欄位完整度', missingNames: '缺少店名', missingAddresses: '缺少地址', duplicates: '重複資料', unknownTypes: '未知商店類型',
        notesTitle: '使用資料前請留意', source: '資料來源', noCoordinates: '此資料集僅提供地址，未包含經官方確認的座標；本模組不會自動地理編碼或建立精確地圖標記。', publicLookup: '外部地圖連結只會將店名與地址交由地圖服務查詢，請自行確認目的地與店家現況。',
      }
    : {
        eyebrow: 'Friendly Businesses, Green Consumption & Sustainable Living', title: 'Taipei Green Store Directory', intro: 'Browse the public directory by district and store type. Addresses are for external lookup only; no map or coordinates are shown.',
        overview: 'Overview', districts: 'District Distribution', types: 'Green Store Types', directory: 'Green Store Directory', quality: 'Data Quality', notes: 'Data Notes',
        total: 'Total stores', uniqueNames: 'Unique store names', districtsCovered: 'Districts covered', storeTypes: 'Green store types', withPhone: 'Records with phone', topDistrict: 'District with most stores', topType: 'Most common type',
        search: 'Search', searchPlaceholder: 'Store name, number, district, address, type, or phone', allDistricts: 'All districts', allTypes: 'All store types', phoneOnly: 'Only records with phone', results: 'results',
        storeName: 'Store name', storeType: 'Green store type', district: 'District', address: 'Address', phone: 'Phone', mobile: 'Mobile', storeNumber: 'Store number', map: 'Map lookup', noResults: 'No records match the current filters.',
        districtChart: 'Stores by district', typeChart: 'Stores by green store type', phoneChart: 'Phone coverage', withPhoneChart: 'With phone', withoutPhoneChart: 'Without phone',
        qualityTitle: 'Conversion and field completeness', missingNames: 'Missing names', missingAddresses: 'Missing addresses', duplicates: 'Duplicate records', unknownTypes: 'Unknown store types',
        notesTitle: 'Before using this data', source: 'Source', noCoordinates: 'This dataset provides addresses but no officially confirmed coordinates. This module does not automatically geocode records or create exact map markers.', publicLookup: 'External map links submit the store name and address to a mapping service. Please confirm the destination and current business information yourself.',
      };

function value(record: GreenStoreDirectoryRecord, key: string): string {
  const raw = (record as unknown as Record<string, unknown>)[key];
  return raw == null ? '' : String(raw);
}

function metric(summary: SummaryShape | undefined, names: string[], fallback: number | string) {
  for (const name of names) if (summary?.[name] != null) return summary[name] as number | string;
  return fallback;
}

function BarChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...data.map((item) => item.value));
  return <div className="bar-chart">{data.map((item) => <div className="bar-row" key={item.label}><span title={item.label}>{item.label}</span><div className="bar-track"><div className="bar-fill green-store-fill" style={{ width: `${(item.value / max) * 100}%` }} /></div><strong>{item.value}</strong></div>)}</div>;
}

export function GreenStoreDirectoryModule({ summary, language, t: _t }: Props) {
  const [records, setRecords] = useState<GreenStoreDirectoryRecord[]>([]);
  const [view, setView] = useState<View>('overview');
  const [query, setQuery] = useState('');
  const [district, setDistrict] = useState('');
  const [storeType, setStoreType] = useState('');
  const [phoneOnly, setPhoneOnly] = useState(false);
  const text = copy(language);
  const summaryShape = summary as unknown as SummaryShape | undefined;

  useEffect(() => { fetch(dataPath).then((response) => response.ok ? response.json() : []).then(setRecords).catch(() => setRecords([])); }, []);

  const options = useMemo(() => ({
    districts: [...new Set(records.map((record) => value(record, 'districtNameFromAddress') || value(record, 'district')).filter(Boolean))].sort(),
    types: [...new Set(records.map((record) => value(record, 'greenStoreTypeNormalized') || value(record, 'greenStoreType')).filter(Boolean))].sort(),
  }), [records]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return records.filter((record) => {
      const recordDistrict = value(record, 'districtNameFromAddress') || value(record, 'district');
      const recordType = value(record, 'greenStoreTypeNormalized') || value(record, 'greenStoreType');
      const phone = value(record, 'fullContactNumber') || value(record, 'phone');
      if (district && recordDistrict !== district) return false;
      if (storeType && recordType !== storeType) return false;
      if (phoneOnly && !value(record, 'hasPhone') && !phone) return false;
      return !needle || [value(record, 'storeName'), value(record, 'storeNumber'), recordDistrict, value(record, 'address'), recordType, phone, value(record, 'mobile')].join(' ').toLocaleLowerCase().includes(needle);
    });
  }, [district, phoneOnly, query, records, storeType]);
  const districtData = useMemo(() => options.districts.map((label) => ({ label, value: records.filter((record) => (value(record, 'districtNameFromAddress') || value(record, 'district')) === label).length })).sort((a, b) => b.value - a.value), [options.districts, records]);
  const typeData = useMemo(() => options.types.map((label) => ({ label, value: records.filter((record) => (value(record, 'greenStoreTypeNormalized') || value(record, 'greenStoreType')) === label).length })).sort((a, b) => b.value - a.value), [options.types, records]);
  const withPhone = records.filter((record) => value(record, 'hasPhone') === 'true' || Boolean(value(record, 'phone') || value(record, 'mobile'))).length;
  const tabs: Array<[View, string]> = [['overview', text.overview], ['districts', text.districts], ['types', text.types], ['directory', text.directory], ['quality', text.quality], ['notes', text.notes]];
  const cards = [[text.total, metric(summaryShape, ['totalRecords', 'totalStores'], records.length)], [text.uniqueNames, metric(summaryShape, ['uniqueStoreNameCount', 'uniqueStoreNames'], new Set(records.map((record) => value(record, 'storeName'))).size)], [text.districtsCovered, metric(summaryShape, ['districtCount'], options.districts.length)], [text.storeTypes, metric(summaryShape, ['greenStoreTypeCount', 'storeTypeCount'], options.types.length)], [text.withPhone, metric(summaryShape, ['recordsWithPhone', 'hasPhoneCount'], withPhone)], [text.topDistrict, metric(summaryShape, ['topDistrict'], districtData[0]?.label ?? '-')], [text.topType, metric(summaryShape, ['topGreenStoreType', 'topStoreType'], typeData[0]?.label ?? '-')]];

  const Directory = () => <><div className="green-store-filters"><label className="search-field">{text.search}<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text.searchPlaceholder} /></label><label>{text.district}<select value={district} onChange={(event) => setDistrict(event.target.value)}><option value="">{text.allDistricts}</option>{options.districts.map((item) => <option key={item}>{item}</option>)}</select></label><label>{text.storeType}<select value={storeType} onChange={(event) => setStoreType(event.target.value)}><option value="">{text.allTypes}</option>{options.types.map((item) => <option key={item}>{item}</option>)}</select></label><label className="green-store-phone-toggle"><input type="checkbox" checked={phoneOnly} onChange={(event) => setPhoneOnly(event.target.checked)} />{text.phoneOnly}</label></div><p className="result-count">{filtered.length} / {records.length} {text.results}</p>{filtered.length === 0 ? <p className="empty-state">{text.noResults}</p> : <div className="green-store-table-wrap"><table className="green-store-table"><thead><tr>{[text.storeName, text.storeType, text.district, text.address, text.phone, text.mobile, text.storeNumber, text.map].map((item) => <th key={item}>{item}</th>)}</tr></thead><tbody>{filtered.slice(0, 200).map((record, index) => { const name = value(record, 'storeName'); const address = value(record, 'address'); const mapQuery = value(record, 'googleMapsQuery') || [name, address].filter(Boolean).join(' '); return <tr key={value(record, 'id') || `${name}-${index}`}><td>{name || '—'}</td><td>{value(record, 'greenStoreTypeNormalized') || value(record, 'greenStoreType') || '—'}</td><td>{value(record, 'districtNameFromAddress') || value(record, 'district') || '—'}</td><td>{address || '—'}</td><td>{value(record, 'fullContactNumber') || value(record, 'phone') || '—'}</td><td>{value(record, 'mobile') || '—'}</td><td>{value(record, 'storeNumber') || '—'}</td><td>{mapQuery && <a className="green-store-map-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`} target="_blank" rel="noopener noreferrer">{text.map}</a>}</td></tr>; })}</tbody></table></div>}</>;

  return <section className="green-store-module"><header className="module-header green-store-header"><p>{text.eyebrow}</p><h2>{text.title}</h2><span>{text.intro}</span></header><DisclaimerNotice>{language === 'zh' ? chineseDisclaimer : englishDisclaimer}</DisclaimerNotice><div className="green-store-tabs" role="tablist">{tabs.map(([id, label]) => <button type="button" role="tab" aria-selected={view === id} className={view === id ? 'active' : ''} onClick={() => setView(id)} key={id}>{label}</button>)}</div>{view === 'overview' && <div className="green-store-view"><div className="summary-grid">{cards.map(([label, item]) => <div className="summary-tile" key={String(label)}><span>{label}</span><strong>{item}</strong></div>)}</div><div className="chart-grid"><article><h3>{text.districtChart}</h3><BarChart data={districtData} /></article><article><h3>{text.typeChart}</h3><BarChart data={typeData} /></article><article><h3>{text.phoneChart}</h3><BarChart data={[{ label: text.withPhoneChart, value: withPhone }, { label: text.withoutPhoneChart, value: records.length - withPhone }]} /></article></div></div>}{view === 'districts' && <section className="green-store-view chart-grid"><article><h3>{text.districtChart}</h3><BarChart data={districtData} /></article></section>}{view === 'types' && <section className="green-store-view chart-grid"><article><h3>{text.typeChart}</h3><BarChart data={typeData} /></article></section>}{view === 'directory' && <section className="green-store-view"><Directory /></section>}{view === 'quality' && <section className="green-store-view"><h3>{text.qualityTitle}</h3><div className="summary-grid">{[[text.missingNames, metric(summaryShape, ['missingStoreNameCount', 'missingNamesCount'], 0)], [text.missingAddresses, metric(summaryShape, ['missingAddressCount', 'missingAddressesCount'], 0)], [text.duplicates, metric(summaryShape, ['duplicateRecordCount', 'duplicateRecordsCount'], 0)], [text.unknownTypes, metric(summaryShape, ['unknownGreenStoreTypeCount', 'unknownStoreTypesCount'], 0)]].map(([label, item]) => <div className="summary-tile" key={String(label)}><span>{label}</span><strong>{item}</strong></div>)}</div></section>}{view === 'notes' && <section className="green-store-view data-notes"><h3>{text.notesTitle}</h3><article><h3>{text.source}</h3><p>{language === 'zh' ? '資料來源為臺北市政府公開資料平台之綠色商店名錄。店家納入名錄不表示即時營業、目前認證有效、商品供應或任何品質保證。' : 'Source: Taipei City Government open-data platform Green Store Directory. Directory inclusion does not indicate current operation, current certification validity, product availability, or any quality guarantee.'}</p></article><article><h3>{language === 'zh' ? '位置資訊' : 'Location information'}</h3><p>{text.noCoordinates}</p><p>{text.publicLookup}</p></article></section>}</section>;
}
