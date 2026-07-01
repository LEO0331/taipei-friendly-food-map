import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import type { TranslationKey } from '../data/translations';
import type {
  CommercialDistrictIntroductionRecord,
  CommercialDistrictIntroductionSummary,
  CommercialDistrictTypeCategory,
  Language,
} from '../types';
import { DisclaimerNotice } from './DisclaimerNotice';

type Props = {
  summary?: CommercialDistrictIntroductionSummary;
  language: Language;
  t: (key: TranslationKey) => string;
};

const dataPath = (fileName: string) => `${import.meta.env.BASE_URL}data/${fileName}`;

const districtCentroids: Record<string, { latitude: number; longitude: number }> = {
  中正區: { latitude: 25.0324, longitude: 121.5199 },
  大同區: { latitude: 25.0634, longitude: 121.513 },
  中山區: { latitude: 25.0642, longitude: 121.5335 },
  松山區: { latitude: 25.0497, longitude: 121.5778 },
  大安區: { latitude: 25.0268, longitude: 121.543 },
  萬華區: { latitude: 25.033, longitude: 121.497 },
  信義區: { latitude: 25.033, longitude: 121.5668 },
  士林區: { latitude: 25.095, longitude: 121.5246 },
  北投區: { latitude: 25.131, longitude: 121.501 },
  內湖區: { latitude: 25.0837, longitude: 121.5924 },
  南港區: { latitude: 25.0327, longitude: 121.6112 },
  文山區: { latitude: 24.9886, longitude: 121.5736 },
};

const categoryLabel = (category: CommercialDistrictTypeCategory, language: Language) => {
  const zh: Record<CommercialDistrictTypeCategory, string> = {
    food: '美食餐飲',
    night_market: '夜市',
    traditional_market: '傳統市場',
    shopping: '購物零售',
    department_store: '百貨商場',
    hot_spring: '溫泉',
    cultural_creative: '文創藝文',
    hospitality: '旅宿休閒',
    electronics: '3C電器',
    pet: '寵物水族',
    automotive: '汽機車',
    home_living: '家具生活',
    education: '教育補習',
    medical_lifestyle: '醫療養生',
    mixed: '混合型',
    other: '其他',
    unknown: '未知',
  };
  const en: Record<CommercialDistrictTypeCategory, string> = {
    food: 'Food',
    night_market: 'Night market',
    traditional_market: 'Traditional market',
    shopping: 'Shopping',
    department_store: 'Department store',
    hot_spring: 'Hot spring',
    cultural_creative: 'Cultural creative',
    hospitality: 'Hospitality / leisure',
    electronics: 'Electronics',
    pet: 'Pet / aquarium',
    automotive: 'Automotive',
    home_living: 'Home & living',
    education: 'Education',
    medical_lifestyle: 'Medical / wellness',
    mixed: 'Mixed',
    other: 'Other',
    unknown: 'Unknown',
  };
  return (language === 'zh' ? zh : en)[category];
};

const loadJson = async <T,>(path: string, fallback: T): Promise<T> => {
  try {
    const response = await fetch(path);
    return response.ok ? ((await response.json()) as T) : fallback;
  } catch {
    return fallback;
  }
};

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="summary-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function CommercialDistrictModule({ summary, language, t }: Props) {
  const [records, setRecords] = useState<CommercialDistrictIntroductionRecord[]>([]);
  const [query, setQuery] = useState('');
  const [district, setDistrict] = useState('');
  const [tag, setTag] = useState('');
  const [category, setCategory] = useState('');
  const [mrt, setMrt] = useState('');
  const [foodOnly, setFoodOnly] = useState(false);
  const [shoppingOnly, setShoppingOnly] = useState(false);
  const [leisureOnly, setLeisureOnly] = useState(false);

  useEffect(() => {
    loadJson<CommercialDistrictIntroductionRecord[]>(dataPath('commercial-district-introductions.json'), []).then(setRecords);
  }, []);

  const options = useMemo(
    () => ({
      districts: [...new Set(records.map((record) => record.district))].sort(),
      tags: [...new Set(records.map((record) => record.districtTag).filter(Boolean))].sort(),
      categories: [...new Set(records.flatMap((record) => record.commercialDistrictTypeCategories))].sort(),
      mrtStations: [...new Set(records.flatMap((record) => record.nearbyMrtStationNames))].sort(),
    }),
    [records],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return records.filter((record) => {
      if (district && record.district !== district) return false;
      if (tag && record.districtTag !== tag) return false;
      if (category && !record.commercialDistrictTypeCategories.includes(category as CommercialDistrictTypeCategory)) return false;
      if (mrt && !record.nearbyMrtStationNames.includes(mrt)) return false;
      if (foodOnly && !record.foodRelated) return false;
      if (shoppingOnly && !record.shoppingRelated) return false;
      if (leisureOnly && !record.leisureRelated) return false;
      if (!needle) return true;
      return [
        record.commercialDistrictName,
        record.district,
        record.districtTag,
        record.organizationName,
        record.locationDescription,
        record.nearbyMrt,
        record.commercialDistrictType,
        record.descriptionPlainText,
      ]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [category, district, foodOnly, leisureOnly, mrt, query, records, shoppingOnly, tag]);

  const mapRows = summary?.byDistrict ?? [];

  return (
    <section className="commercial-module">
      <header className="module-header">
        <p>{language === 'zh' ? '商圈、美食與生活消費' : 'Commercial Districts, Food & Local Shopping'}</p>
        <h2>{t('commercialDistrictIntroductions')}</h2>
        <span>
          {language === 'zh'
            ? '查詢臺北市商圈介紹公開資料，包含商圈名稱、行政區、標籤、組織名稱、坐落位置、鄰近捷運、商圈類型與說明。'
            : 'Explore Taipei commercial district introduction public data, including district, tag, organization, nearby MRT, type, and description.'}
        </span>
      </header>

      <DisclaimerNotice>{t('commercialDistrictMapNotice')}</DisclaimerNotice>

      {summary && (
        <div className="summary-grid">
          <Stat label={t('commercialDistrictCount')} value={summary.totalRecords} />
          <Stat label={t('districtsCovered')} value={summary.districtCount} />
          <Stat label={t('tagCount')} value={summary.districtTagCount} />
          <Stat label={t('organizationCount')} value={summary.organizationCount} />
          <Stat label={t('nearbyMrtStationCount')} value={summary.nearbyMrtStationCount} />
          <Stat label={t('foodRelatedDistrictCount')} value={summary.foodRelatedCount} />
        </div>
      )}

      <div className="commercial-layout">
        <section className="commercial-map-panel">
          <h3>{t('commercialDistrictDistribution')}</h3>
          <MapContainer center={[25.0478, 121.5319]} zoom={11} className="commercial-map" scrollWheelZoom={false}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            {mapRows.map((row) => {
              const centroid = districtCentroids[row.district];
              if (!centroid) return null;
              return (
                <CircleMarker
                  key={row.district}
                  center={[centroid.latitude, centroid.longitude]}
                  radius={10 + row.commercialDistrictCount * 1.5}
                  pathOptions={{ color: '#0f5132', fillColor: '#15803d', fillOpacity: 0.45, weight: 2 }}
                >
                  <Popup>
                    <strong>{row.district}</strong>
                    <p>{t('commercialDistrictCount')}: {row.commercialDistrictCount}</p>
                    <p>{t('foodRelated')}: {row.foodRelatedCount}</p>
                    <p>{t('shoppingRelated')}: {row.shoppingRelatedCount}</p>
                    <p>{t('leisureRelated')}: {row.leisureRelatedCount}</p>
                    <small>{t('commercialDistrictPopupNotice')}</small>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </section>

        <section className="commercial-directory">
          <h3>{t('commercialDistrictDirectory')}</h3>
          <div className="traceability-filters">
            <label className="search-field">
              {language === 'zh' ? '搜尋' : 'Search'}
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('commercialDistrictSearchPlaceholder')} />
            </label>
            <label>
              {t('district')}
              <select value={district} onChange={(event) => setDistrict(event.target.value)}>
                <option value="">{t('allDistricts')}</option>
                {options.districts.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              {t('tag')}
              <select value={tag} onChange={(event) => setTag(event.target.value)}>
                <option value="">{language === 'zh' ? '全部標籤' : 'All tags'}</option>
                {options.tags.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              {t('commercialDistrictTypeCategory')}
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="">{language === 'zh' ? '全部類別' : 'All categories'}</option>
                {options.categories.map((item) => <option key={item} value={item}>{categoryLabel(item, language)}</option>)}
              </select>
            </label>
            <label>
              {t('nearbyMrt')}
              <select value={mrt} onChange={(event) => setMrt(event.target.value)}>
                <option value="">{language === 'zh' ? '全部捷運站' : 'All MRT stations'}</option>
                {options.mrtStations.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <div className="checkbox-row">
              <label><input type="checkbox" checked={foodOnly} onChange={(event) => setFoodOnly(event.target.checked)} />{t('foodRelated')}</label>
              <label><input type="checkbox" checked={shoppingOnly} onChange={(event) => setShoppingOnly(event.target.checked)} />{t('shoppingRelated')}</label>
              <label><input type="checkbox" checked={leisureOnly} onChange={(event) => setLeisureOnly(event.target.checked)} />{t('leisureRelated')}</label>
            </div>
          </div>
          <p className="result-count">{filtered.length} / {records.length}</p>
          <div className="traceability-results">
            {filtered.map((record) => (
              <article className="store-card" key={record.id}>
                <h3>{record.commercialDistrictName}</h3>
                <p className="meta-row">
                  <span>{record.district}</span>
                  {record.districtTag && <span>{record.districtTag}</span>}
                  {record.nearbyMrt && <span>{record.nearbyMrt}</span>}
                </p>
                <p className="description">{record.commercialDistrictType}</p>
                <p className="description">{record.locationDescription}</p>
                <p className="description">{record.descriptionPlainText?.slice(0, 160)}</p>
                <div className="tag-list">
                  {record.commercialDistrictTypeCategories.map((item) => <span key={item}>{categoryLabel(item, language)}</span>)}
                </div>
                <div className="card-actions">
                  {record.googleMapsQuery && (
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(record.googleMapsQuery)}`} target="_blank" rel="noopener noreferrer">
                      {t('mapLookup')}
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
