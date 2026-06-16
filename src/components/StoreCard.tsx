import type { TranslationKey } from '../data/translations';
import { formatDistance, googleMapsUrl, tagLabel } from '../lib/friendlyFood';
import type { FriendlyStore, Language, RestaurantBusiness } from '../types';

type Props = {
  item: FriendlyStore | RestaurantBusiness;
  distance?: number;
  language: Language;
  t: (key: TranslationKey) => string;
  onFocusMap?: (item: FriendlyStore | RestaurantBusiness) => void;
};

export function StoreCard({ item, distance, language, t, onFocusMap }: Props) {
  const isFriendly = item.layer === 'friendly_store';
  const title = isFriendly ? (language === 'en' && item.nameEn ? item.nameEn : item.nameZh) : item.name;
  const address = isFriendly
    ? language === 'en' && item.addressEn
      ? item.addressEn
      : item.addressZh
    : item.address;

  return (
    <article className="store-card">
      <div className="card-heading">
        <span className={`layer-badge ${isFriendly ? 'friendly' : 'restaurant'}`}>
          {isFriendly ? t('friendlyStores') : t('registeredRestaurantBusinesses')}
        </span>
        {distance !== undefined && <span className="distance">{formatDistance(distance, language)}</span>}
      </div>
      <h3>{title}</h3>
      <p className="address">{address}</p>
      <div className="meta-row">
        {item.district && <span>{item.district}</span>}
        {isFriendly && item.phone && <span>{item.phone}</span>}
        {!isFriendly && item.matchedFriendlyStoreId && <span>{t('matchedFriendlyRestaurant')}</span>}
      </div>
      {isFriendly ? (
        <>
          {item.descriptionZh && (
            <p className="description">
              {language === 'en' && item.descriptionEn ? item.descriptionEn : item.descriptionZh}
            </p>
          )}
          <div className="tag-list">
            {item.serviceTags.slice(0, 8).map((tag) => (
              <span key={tag}>{tagLabel(tag, language)}</span>
            ))}
          </div>
        </>
      ) : (
        <p className="description">{t('restaurantRegistryDisclaimer')}</p>
      )}
      <div className="card-actions">
        {item.coordinateStatus === 'valid' && (
          <button onClick={() => onFocusMap?.(item)}>{language === 'zh' ? '在地圖查看' : 'View on map'}</button>
        )}
        <a href={googleMapsUrl({ latitude: item.latitude, longitude: item.longitude, address })} target="_blank" rel="noreferrer">
          {t('openGoogleMaps')}
        </a>
      </div>
    </article>
  );
}
