import { useEffect, useState } from 'react';
import type { TranslationKey } from '../data/translations';
import type { FriendlyStore, Language, RestaurantBusiness } from '../types';
import { StoreCard } from './StoreCard';

type Props = {
  items: Array<FriendlyStore | RestaurantBusiness>;
  distances: Map<string, number>;
  language: Language;
  t: (key: TranslationKey) => string;
  onFocusMap: (item: FriendlyStore | RestaurantBusiness) => void;
};

export function StoreDirectory({ items, distances, language, t, onFocusMap }: Props) {
  const [visibleCount, setVisibleCount] = useState(120);
  const visibleItems = items.slice(0, visibleCount);

  useEffect(() => {
    setVisibleCount(120);
  }, [items]);

  return (
    <section className="directory">
      {items.length === 0 ? (
        <p className="empty-state">{t('noResults')}</p>
      ) : (
        <>
          <p className="result-count">
            {language === 'zh'
              ? `顯示 ${visibleItems.length} / ${items.length} 筆`
              : `Showing ${visibleItems.length} of ${items.length} records`}
          </p>
          {visibleItems.map((item) => (
            <StoreCard
              key={`${item.layer}-${item.id}`}
              item={item}
              distance={distances.get(`${item.layer}-${item.id}`)}
              language={language}
              t={t}
              onFocusMap={onFocusMap}
            />
          ))}
          {visibleCount < items.length && (
            <button className="load-more-button" onClick={() => setVisibleCount((count) => count + 120)}>
              {language === 'zh' ? '載入更多' : 'Load more'}
            </button>
          )}
        </>
      )}
    </section>
  );
}
