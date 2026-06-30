import { useEffect, useMemo, useState } from 'react';
import type { TranslationKey } from '../data/translations';
import type {
  Language,
  TaipeiFoodTraceabilityProductDetail,
  TaipeiFoodTraceabilitySearchItem,
  TaipeiFoodTraceabilitySummary,
} from '../types';
import { DisclaimerNotice } from './DisclaimerNotice';

type Props = {
  summary?: TaipeiFoodTraceabilitySummary;
  language: Language;
  t: (key: TranslationKey) => string;
};

const dataPath = (fileName: string) => `${import.meta.env.BASE_URL}data/food-traceability/${fileName}`;

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

export function FoodTraceabilityModule({ summary, language, t }: Props) {
  const [searchIndex, setSearchIndex] = useState<TaipeiFoodTraceabilitySearchItem[]>([]);
  const [query, setQuery] = useState('');
  const [company, setCompany] = useState('');
  const [brand, setBrand] = useState('');
  const [ingredient, setIngredient] = useState('');
  const [ingredientBrand, setIngredientBrand] = useState('');
  const [hasCalories, setHasCalories] = useState(false);
  const [hasServingSize, setHasServingSize] = useState(false);
  const [hasTraceabilityUrl, setHasTraceabilityUrl] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [detail, setDetail] = useState<TaipeiFoodTraceabilityProductDetail | undefined>();

  useEffect(() => {
    loadJson<TaipeiFoodTraceabilitySearchItem[]>(dataPath('search-index.json'), []).then(setSearchIndex);
  }, []);

  useEffect(() => {
    setDetail(undefined);
    if (!selectedProduct) return;
    const item = searchIndex.find((entry) => entry.productKey === selectedProduct);
    if (!item) return;
    loadJson<TaipeiFoodTraceabilityProductDetail[]>(dataPath(`product-details/${item.detailChunkId}`), []).then(
      (products) => setDetail(products.find((product) => product.productKey === selectedProduct)),
    );
  }, [searchIndex, selectedProduct]);

  const options = useMemo(
    () => ({
      companies: [...new Set(searchIndex.map((item) => item.companyName).filter(Boolean))].sort(),
      brands: [...new Set(searchIndex.map((item) => item.brandName).filter(Boolean))].sort(),
      ingredients: [...new Set(searchIndex.flatMap((item) => item.topIngredientNames).filter(Boolean))].sort(),
      ingredientBrands: [...new Set(searchIndex.flatMap((item) => item.topIngredientBrands).filter(Boolean))].sort(),
    }),
    [searchIndex],
  );

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return searchIndex
      .filter((item) => {
        if (company && item.companyName !== company) return false;
        if (brand && item.brandName !== brand) return false;
        if (ingredient && !item.topIngredientNames.includes(ingredient)) return false;
        if (ingredientBrand && !item.topIngredientBrands.includes(ingredientBrand)) return false;
        if (hasCalories && !item.hasCalories) return false;
        if (hasServingSize && !item.hasServingSize) return false;
        if (hasTraceabilityUrl && !item.hasTraceabilityUrl) return false;
        if (!needle) return true;
        return [
          item.productName,
          item.brandName,
          item.companyName,
          ...item.topIngredientNames,
          ...item.topIngredientBrands,
        ]
          .join(' ')
          .toLowerCase()
          .includes(needle);
      })
      .slice(0, 80);
  }, [brand, company, hasCalories, hasServingSize, hasTraceabilityUrl, ingredient, ingredientBrand, query, searchIndex]);

  return (
    <section className="traceability-module">
      <header className="module-header">
        <div>
          <p>{t('foodSourceTransparency')}</p>
          <h2>{t('taipeiFoodTraceabilityProducts')}</h2>
          <span>
            {language === 'zh'
              ? '查詢臺北市食材登錄平台中的公司、品牌、產品、原料、原料品牌、份量、熱量與來源連結，作為食品來源透明資訊參考。'
              : 'Search company, brand, product, ingredient, ingredient brand, serving size, calories, and source links from Taipei Food Traceability Platform as food-source transparency reference.'}
          </span>
        </div>
      </header>

      <DisclaimerNotice>{t('foodTraceabilityMapNotice')}</DisclaimerNotice>
      <DisclaimerNotice>{t('foodTraceabilityInterpretationNote')}</DisclaimerNotice>

      {summary && (
        <div className="summary-grid">
          <Stat label={t('traceabilityRecordCount')} value={summary.totalRows} />
          <Stat label={t('companyCount')} value={summary.companyCount} />
          <Stat label={t('brandCount')} value={summary.brandCount} />
          <Stat label={t('productCount')} value={summary.productCount} />
          <Stat label={t('ingredientCount')} value={summary.ingredientCount} />
          <Stat label={t('ingredientBrandCount')} value={summary.ingredientBrandCount} />
        </div>
      )}

      <div className="traceability-filters">
        <label className="search-field">
          {t('productSearch')}
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('foodTraceabilitySearchPlaceholder')}
          />
        </label>
        <label>
          {t('companyName')}
          <input list="traceability-companies" value={company} onChange={(event) => setCompany(event.target.value)} />
        </label>
        <label>
          {t('brandName')}
          <input list="traceability-brands" value={brand} onChange={(event) => setBrand(event.target.value)} />
        </label>
        <label>
          {t('ingredientName')}
          <input
            list="traceability-ingredients"
            value={ingredient}
            onChange={(event) => setIngredient(event.target.value)}
          />
        </label>
        <label>
          {t('ingredientBrand')}
          <input
            list="traceability-ingredient-brands"
            value={ingredientBrand}
            onChange={(event) => setIngredientBrand(event.target.value)}
          />
        </label>
        <div className="checkbox-row">
          <label>
            <input type="checkbox" checked={hasCalories} onChange={(event) => setHasCalories(event.target.checked)} />
            {t('recordsWithCalories')}
          </label>
          <label>
            <input
              type="checkbox"
              checked={hasServingSize}
              onChange={(event) => setHasServingSize(event.target.checked)}
            />
            {t('recordsWithServingSize')}
          </label>
          <label>
            <input
              type="checkbox"
              checked={hasTraceabilityUrl}
              onChange={(event) => setHasTraceabilityUrl(event.target.checked)}
            />
            {t('hasTraceabilityUrl')}
          </label>
        </div>
      </div>

      <datalist id="traceability-companies">{options.companies.map((item) => <option key={item} value={item} />)}</datalist>
      <datalist id="traceability-brands">{options.brands.map((item) => <option key={item} value={item} />)}</datalist>
      <datalist id="traceability-ingredients">
        {options.ingredients.map((item) => <option key={item} value={item} />)}
      </datalist>
      <datalist id="traceability-ingredient-brands">
        {options.ingredientBrands.map((item) => <option key={item} value={item} />)}
      </datalist>

      <p className="result-count">{results.length} / {searchIndex.length}</p>
      <div className="traceability-results">
        {results.map((item) => (
          <article className="store-card" key={item.productKey}>
            <h3>{item.productName}</h3>
            <p className="meta-row">
              <span>{item.brandName}</span>
              <span>{item.companyName}</span>
            </p>
            <p className="description">
              {t('ingredientCount')}: {item.ingredientCount}
              {item.topIngredientNames.length > 0 ? ` · ${t('exampleIngredients')}: ${item.topIngredientNames.join('、')}` : ''}
            </p>
            <p className="description">
              {item.servingSizeRawExamples.length > 0 ? `${t('servingSize')}: ${item.servingSizeRawExamples.join('、')}` : ''}
              {item.caloriesKcalExamples.length > 0 ? ` ${t('caloriesKcal')}: ${item.caloriesKcalExamples.join('、')}` : ''}
            </p>
            <div className="card-actions">
              <button onClick={() => setSelectedProduct(item.productKey)}>{t('viewIngredientDetails')}</button>
              {item.traceabilityUrl && (
                <a href={item.traceabilityUrl} target="_blank" rel="noopener noreferrer">
                  {t('sourceLink')}
                </a>
              )}
            </div>
          </article>
        ))}
      </div>

      {detail && (
        <section className="product-detail">
          <h2>{detail.productName}</h2>
          <p className="meta-row">
            <span>{detail.brandName}</span>
            <span>{detail.companyName}</span>
          </p>
          <div className="tag-list">
            {detail.servingSizeRawExamples.map((item) => <span key={item}>{t('servingSize')}: {item}</span>)}
            {detail.caloriesKcalExamples.map((item) => <span key={item}>{t('caloriesKcal')}: {item}</span>)}
          </div>
          <h3>{t('productIngredientDetails')}</h3>
          <div className="ingredient-list">
            {detail.ingredients.map((item) => (
              <p key={`${item.ingredientName}-${item.ingredientBrand ?? ''}`}>
                <strong>{item.ingredientName}</strong>
                {item.ingredientBrand ? ` · ${item.ingredientBrand}` : ''}
              </p>
            ))}
          </div>
          <div className="card-actions">
            {detail.traceabilityUrls.map((url) => (
              <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                {t('sourceLink')}
              </a>
            ))}
          </div>
          <DisclaimerNotice>{t('foodTraceabilityInterpretationNote')}</DisclaimerNotice>
        </section>
      )}
    </section>
  );
}
