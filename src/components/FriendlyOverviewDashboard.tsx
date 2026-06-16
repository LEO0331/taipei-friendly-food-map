import type { TranslationKey } from '../data/translations';
import { FRIENDLY_TAGS, TAIPEI_DISTRICTS, tagLabel } from '../lib/friendlyFood';
import type { FriendlyFoodSummary, Language } from '../types';
import { DisclaimerNotice } from './DisclaimerNotice';

type Props = {
  summary: FriendlyFoodSummary;
  language: Language;
  t: (key: TranslationKey) => string;
};

function BarChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...data.map((item) => item.value));
  return (
    <div className="bar-chart">
      {data.map((item) => (
        <div className="bar-row" key={item.label}>
          <span>{item.label}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

export function FriendlyOverviewDashboard({ summary, language, t }: Props) {
  const summaryCards = [
    [t('friendlyStoreCount'), summary.friendlyStoreCount],
    [t('restaurantBusinessCount'), summary.restaurantBusinessCount],
    [t('friendlyStoresWithCoordinates'), summary.friendlyStoresWithCoordinates],
    [t('topDistrictByFriendlyStores'), summary.topDistrictByFriendlyStores ?? '-'],
    [t('topFriendlyServiceTag'), summary.topFriendlyServiceTag ? tagLabel(summary.topFriendlyServiceTag, language) : '-'],
    [language === 'zh' ? '素食友善數' : 'Vegetarian-friendly count', summary.vegetarianFriendlyCount],
    [language === 'zh' ? '無障礙友善數' : 'Accessibility-friendly count', summary.accessibilityFriendlyCount],
    [language === 'zh' ? '穆斯林友善數' : 'Muslim-friendly count', summary.muslimFriendlyCount],
    ['Free Wi-Fi', summary.freeWifiCount],
    [language === 'zh' ? '友善餐館匹配數' : 'Matched friendly restaurant count', summary.matchedFriendlyRestaurantCount],
  ];
  const friendlyByDistrict = TAIPEI_DISTRICTS.map((district) => ({
    label: district,
    value: summary.friendlyStoresByDistrict[district] ?? 0,
  }));
  const restaurantsByDistrict = TAIPEI_DISTRICTS.map((district) => ({
    label: district,
    value: summary.restaurantBusinessesByDistrict[district] ?? 0,
  }));
  const serviceDistribution = FRIENDLY_TAGS.map((tag) => ({
    label: tagLabel(tag, language),
    value: summary.friendlyServiceTagDistribution[tag] ?? 0,
  })).sort((a, b) => b.value - a.value);
  const languageDistribution = ['english_friendly', 'japanese_friendly', 'korean_friendly'].map((tag) => ({
    label: tagLabel(tag as (typeof FRIENDLY_TAGS)[number], language),
    value: summary.friendlyServiceTagDistribution[tag as (typeof FRIENDLY_TAGS)[number]] ?? 0,
  }));
  const coverageComparison = TAIPEI_DISTRICTS.map((district) => ({
    label: district,
    value: (summary.friendlyStoresByDistrict[district] ?? 0) + (summary.restaurantBusinessesByDistrict[district] ?? 0),
  }));
  const friendlyItemsDistribution = Object.entries(summary.totalFriendlyItemsDistribution).map(([label, value]) => ({
    label,
    value,
  }));

  return (
    <section className="dashboard">
      <div className="summary-grid">
        {summaryCards.map(([label, value]) => (
          <div className="summary-tile" key={String(label)}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="chart-grid">
        <article>
          <h3>{t('friendlyStoresByDistrict')}</h3>
          <BarChart data={friendlyByDistrict} />
        </article>
        <article>
          <h3>{t('restaurantBusinessesByDistrict')}</h3>
          <BarChart data={restaurantsByDistrict} />
        </article>
        <article>
          <h3>{t('friendlyServiceTagDistribution')}</h3>
          <BarChart data={serviceDistribution} />
        </article>
        <article>
          <h3>{t('languageFriendlyDistribution')}</h3>
          <BarChart data={languageDistribution} />
        </article>
        <article>
          <h3>{language === 'zh' ? '重點友善項目' : 'Priority friendly-service counts'}</h3>
          <BarChart
            data={[
              { label: tagLabel('accessibility_friendly', language), value: summary.accessibilityFriendlyCount },
              { label: tagLabel('vegetarian_friendly', language), value: summary.vegetarianFriendlyCount },
              { label: tagLabel('muslim_friendly', language), value: summary.muslimFriendlyCount },
              { label: tagLabel('free_wifi', language), value: summary.freeWifiCount },
            ]}
          />
        </article>
        <article>
          <h3>{t('datasetCoverageComparison')}</h3>
          <DisclaimerNotice>{t('coverageComparisonNotice')}</DisclaimerNotice>
          <BarChart data={coverageComparison} />
        </article>
        <article>
          <h3>{t('friendlyItemsDistribution')}</h3>
          <BarChart data={friendlyItemsDistribution} />
        </article>
      </div>
    </section>
  );
}
