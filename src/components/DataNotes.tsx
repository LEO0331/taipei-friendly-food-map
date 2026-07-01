import type { TranslationKey } from '../data/translations';
import type { Language } from '../types';
import { DisclaimerNotice } from './DisclaimerNotice';

type Props = {
  language: Language;
  t: (key: TranslationKey) => string;
};

export function DataNotes({ language, t }: Props) {
  return (
    <section className="data-notes">
      <h2>{t('dataNotes')}</h2>
      <DisclaimerNotice>{t('dataDisclaimer')}</DisclaimerNotice>
      <div className="notes-list">
        <article>
          <h3>{language === 'zh' ? '友善店家清冊' : 'Friendly stores list'}</h3>
          <p>
            {language === 'zh'
              ? '以繁體中文資料為主資料源，英文資料用於可靠匹配後補充英文名稱、地址與簡介。'
              : 'Traditional Chinese data is the primary source. English data enriches display names, addresses, and descriptions when matching is reliable.'}
          </p>
        </article>
        <article>
          <h3>{language === 'zh' ? '餐館業登記清冊' : 'Registered restaurant-business list'}</h3>
          <p>{t('restaurantRegistryDisclaimer')}</p>
        </article>
        <article>
          <h3>{t('waterRefillStores')}</h3>
          <p>{t('waterRefillDatasetNotice')}</p>
        </article>
        <article>
          <h3>{t('taipeiFoodTraceabilityProducts')}</h3>
          <p>{t('foodTraceabilityDataNote')}</p>
          <p>{t('foodTraceabilityMapNotice')}</p>
          <p>{t('foodTraceabilityInterpretationNote')}</p>
          <p>{t('foodTraceabilityWaterFriendlyStoreNote')}</p>
          <p>{t('foodTraceabilityFriendlyShopNote')}</p>
        </article>
        <article>
          <h3>{t('commercialDistrictIntroductions')}</h3>
          <p>{t('commercialDistrictDataNote')}</p>
          <p>{t('commercialDistrictMapNotice')}</p>
          <p>{t('commercialDistrictInterpretationNote')}</p>
          <p>{t('commercialDistrictFriendlyFoodDistinctionNote')}</p>
          <p>{t('commercialDistrictWaterRefillDistinctionNote')}</p>
          <p>{t('commercialDistrictFoodTraceabilityDistinctionNote')}</p>
        </article>
        <article>
          <h3>{language === 'zh' ? '資料筆數比較' : 'Dataset comparison'}</h3>
          <p>{t('coverageComparisonNotice')}</p>
        </article>
      </div>
      <p className="footer-copy">{t('footer')}</p>
    </section>
  );
}
