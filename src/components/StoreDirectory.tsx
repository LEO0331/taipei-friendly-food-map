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
  return (
    <section className="directory">
      {items.length === 0 ? (
        <p className="empty-state">{t('noResults')}</p>
      ) : (
        items.map((item) => (
          <StoreCard
            key={`${item.layer}-${item.id}`}
            item={item}
            distance={distances.get(`${item.layer}-${item.id}`)}
            language={language}
            t={t}
            onFocusMap={onFocusMap}
          />
        ))
      )}
    </section>
  );
}
