import type { TranslationKey } from '../data/translations';
import { FRIENDLY_TAGS, TAIPEI_DISTRICTS, tagLabel } from '../lib/friendlyFood';
import type { FilterState } from '../lib/friendlyFood';
import type { FriendlyServiceTag, Language, StoreLayer } from '../types';

type Props = {
  filters: FilterState;
  language: Language;
  t: (key: TranslationKey) => string;
  onChange: (filters: FilterState) => void;
};

export function FilterPanel({ filters, language, t, onChange }: Props) {
  const toggleTag = (tag: FriendlyServiceTag) => {
    const serviceTags = filters.serviceTags.includes(tag)
      ? filters.serviceTags.filter((item) => item !== tag)
      : [...filters.serviceTags, tag];
    onChange({ ...filters, serviceTags });
  };

  return (
    <section className="filter-panel" aria-label="Filters">
      <label className="search-field">
        <span>{language === 'zh' ? '搜尋' : 'Search'}</span>
        <input
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          placeholder={t('searchPlaceholder')}
        />
      </label>

      <div className="filter-grid">
        <fieldset className="layer-fieldset">
          <legend>{language === 'zh' ? '資料圖層' : 'Layers'}</legend>
          {(
            [
              ['friendly_store', t('friendlyStores')],
              ['water_refill_store', t('waterRefillStores')],
              ['registered_restaurant_business', t('registeredRestaurantBusinesses')],
            ] as Array<[StoreLayer, string]>
          ).map(([layer, label]) => (
            <label key={layer}>
              <input
                type="checkbox"
                checked={filters.layers[layer]}
                onChange={(event) =>
                  onChange({
                    ...filters,
                    layers: { ...filters.layers, [layer]: event.target.checked },
                  })
                }
              />
              {label}
            </label>
          ))}
        </fieldset>
        <label>
          <span>{t('district')}</span>
          <select
            value={filters.district}
            onChange={(event) => onChange({ ...filters, district: event.target.value })}
          >
            <option value="">{t('allDistricts')}</option>
            {TAIPEI_DISTRICTS.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{t('minimumFriendlyItems')}</span>
          <input
            type="number"
            min="0"
            max="15"
            value={filters.minFriendlyItems}
            onChange={(event) =>
              onChange({ ...filters, minFriendlyItems: Number(event.target.value) || 0 })
            }
          />
        </label>
      </div>

      <div className="checkbox-row">
        <label>
          <input
            type="checkbox"
            checked={filters.validCoordinatesOnly}
            onChange={(event) => onChange({ ...filters, validCoordinatesOnly: event.target.checked })}
          />
          {t('validCoordinatesOnly')}
        </label>
        <label>
          <input
            type="checkbox"
            checked={filters.matchedOnly}
            onChange={(event) => onChange({ ...filters, matchedOnly: event.target.checked })}
          />
          {t('matchedOnly')}
        </label>
      </div>

      <div className="tag-filter-list" aria-label={t('friendlyServices')}>
        {FRIENDLY_TAGS.map((tag) => (
          <button
            key={tag}
            className={filters.serviceTags.includes(tag) ? 'active' : ''}
            onClick={() => toggleTag(tag)}
          >
            {tagLabel(tag, language)}
          </button>
        ))}
      </div>
    </section>
  );
}
