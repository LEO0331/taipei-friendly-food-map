import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import type { TranslationKey } from '../data/translations';
import { googleMapsUrl, sanitizeExternalUrl, tagLabel } from '../lib/friendlyFood';
import type { FriendlyStore, Language, RestaurantBusiness, WaterRefillStore } from '../types';
import { DisclaimerNotice } from './DisclaimerNotice';

type Props = {
  items: Array<FriendlyStore | WaterRefillStore | RestaurantBusiness>;
  language: Language;
  t: (key: TranslationKey) => string;
  userLocation?: { latitude: number; longitude: number };
  focusedItem?: FriendlyStore | WaterRefillStore | RestaurantBusiness;
};

const createEmojiIcon = (emoji: string, className: string) =>
  L.divIcon({
    className: `emoji-marker ${className}`,
    html: `<span>${emoji}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -12],
  });

const friendlyIcon = createEmojiIcon('🤝', 'friendly-marker');
const restaurantIcon = createEmojiIcon('🍽️', 'restaurant-marker');
const waterIcon = createEmojiIcon('💧', 'water-marker');
const matchedIcon = createEmojiIcon('⭐', 'matched-marker');
const userIcon = createEmojiIcon('●', 'user-marker');

type MarkerClusterFactory = {
  markerClusterGroup: (options: { showCoverageOnHover: boolean; maxClusterRadius: number }) => L.LayerGroup;
};

const markerCluster = L as typeof L & MarkerClusterFactory;

function ClusteredMarkers({
  items,
  language,
  t,
}: {
  items: Array<FriendlyStore | WaterRefillStore | RestaurantBusiness>;
  language: Language;
  t: (key: TranslationKey) => string;
}) {
  const map = useMap();
  const validItems = useMemo(
    () => items.filter((item) => item.coordinateStatus === 'valid' && item.latitude !== undefined && item.longitude !== undefined),
    [items],
  );

  useEffect(() => {
    const cluster = markerCluster.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 44,
    });
    validItems.forEach((item) => {
      const isFriendly = item.layer === 'friendly_store';
      const icon = isFriendly
        ? item.serviceTags.includes('water_refill_available')
          ? matchedIcon
          : friendlyIcon
        : item.layer === 'water_refill_store'
          ? item.matchedFriendlyStoreId
            ? matchedIcon
            : waterIcon
          : item.matchedFriendlyStoreId
            ? matchedIcon
            : restaurantIcon;
      const marker = L.marker([item.latitude as number, item.longitude as number], { icon });
      marker.bindPopup(renderPopupHtml(item, language, t));
      cluster.addLayer(marker);
    });
    map.addLayer(cluster);
    return () => {
      map.removeLayer(cluster);
    };
  }, [language, map, t, validItems]);

  return null;
}

function FocusMap({ item }: { item?: FriendlyStore | WaterRefillStore | RestaurantBusiness }) {
  const map = useMap();
  useEffect(() => {
    if (item?.latitude !== undefined && item.longitude !== undefined) {
      map.flyTo([item.latitude, item.longitude], 17, { duration: 0.7 });
    }
  }, [item, map]);
  return null;
}

function ResizeMap() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const resize = () => map.invalidateSize();
    resize();
    const timeout = window.setTimeout(resize, 150);
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    window.addEventListener('resize', resize);
    return () => {
      window.clearTimeout(timeout);
      observer.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, [map]);
  return null;
}

const escapeHtml = (value: string | undefined) =>
  (value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

function renderPopupHtml(
  item: FriendlyStore | WaterRefillStore | RestaurantBusiness,
  language: Language,
  t: (key: TranslationKey) => string,
) {
  if (item.layer === 'friendly_store') {
    const name = language === 'en' && item.nameEn ? item.nameEn : item.nameZh;
    const address = language === 'en' && item.addressEn ? item.addressEn : item.addressZh;
    const description = language === 'en' && item.descriptionEn ? item.descriptionEn : item.descriptionZh;
    const tags = item.serviceTags.map((tag) => `<span>${escapeHtml(tagLabel(tag, language))}</span>`).join('');
    const websiteUrl = sanitizeExternalUrl(item.websiteUrl);
    return `
      <div class="popup-content">
        <strong>${escapeHtml(t('friendlyStores'))}</strong>
        <h3>${escapeHtml(name)}</h3>
        <p>${escapeHtml(address)}</p>
        ${item.phone ? `<p>${escapeHtml(t('phone'))}: ${escapeHtml(item.phone)}</p>` : ''}
        ${description ? `<p>${escapeHtml(description)}</p>` : ''}
        <div class="popup-tags">${tags}</div>
        <p>${escapeHtml(t('totalFriendlyItems'))}: ${item.totalFriendlyItems}</p>
        ${websiteUrl ? `<a href="${escapeHtml(websiteUrl)}" target="_blank" rel="noreferrer">${escapeHtml(t('officialIntroduction'))}</a>` : ''}
        <a href="${googleMapsUrl({ latitude: item.latitude, longitude: item.longitude, address })}" target="_blank" rel="noreferrer">${escapeHtml(t('openGoogleMaps'))}</a>
      </div>
    `;
  }
  if (item.layer === 'water_refill_store') {
    return `
      <div class="popup-content">
        <strong>${escapeHtml(t('waterRefillStore'))}</strong>
        <h3>${escapeHtml(item.nameZh)}</h3>
        ${item.district ? `<p>${escapeHtml(t('district'))}: ${escapeHtml(item.district)}</p>` : ''}
        <p>${escapeHtml(item.addressZh)}</p>
        ${item.phone ? `<p>${escapeHtml(t('phone'))}: ${escapeHtml(item.phone)}</p>` : ''}
        ${item.descriptionZh ? `<p>${escapeHtml(item.descriptionZh)}</p>` : ''}
        <p>${escapeHtml(t('listedAsFriendlyStore'))}: ${item.matchedFriendlyStoreId ? escapeHtml(t('matchedFriendlyRestaurant')) : language === 'zh' ? '未找到匹配' : 'No matched listing'}</p>
        <p>${escapeHtml(t('appearsInRestaurantBusinessRegistry'))}: ${item.matchedRestaurantBusinessId ? language === 'zh' ? '匹配候選' : 'Matched candidate' : language === 'zh' ? '未找到匹配' : 'No matched listing'}</p>
        <p>${escapeHtml(t('waterRefillAvailabilityNotice'))}</p>
        <a href="${googleMapsUrl({ latitude: item.latitude, longitude: item.longitude, address: item.addressZh })}" target="_blank" rel="noreferrer">${escapeHtml(t('openGoogleMaps'))}</a>
      </div>
    `;
  }
  return `
    <div class="popup-content">
      <strong>${escapeHtml(t('registeredRestaurantBusinesses'))}</strong>
      <h3>${escapeHtml(item.name)}</h3>
      <p>${escapeHtml(item.address)}</p>
      <p>${escapeHtml(t('listedAsFriendlyStore'))}: ${item.matchedFriendlyStoreId ? escapeHtml(t('matchedFriendlyRestaurant')) : language === 'zh' ? '未找到友善店家清冊匹配' : 'friendly-store listing not found'}</p>
      <p>${escapeHtml(t('restaurantRegistryDisclaimer'))}</p>
      <a href="${googleMapsUrl({ latitude: item.latitude, longitude: item.longitude, address: item.address })}" target="_blank" rel="noreferrer">${escapeHtml(t('openGoogleMaps'))}</a>
    </div>
  `;
}

export function FriendlyMap({ items, language, t, userLocation, focusedItem }: Props) {
  return (
    <section className="map-panel">
      <MapContainer center={[25.0478, 121.5319]} zoom={12} className="leaflet-map" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClusteredMarkers items={items} language={language} t={t} />
        {userLocation && (
          <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userIcon}>
            <Popup>{language === 'zh' ? '目前位置' : 'Current location'}</Popup>
          </Marker>
        )}
        <FocusMap item={focusedItem} />
        <ResizeMap />
      </MapContainer>
      <DisclaimerNotice>{t('dataDisclaimer')}</DisclaimerNotice>
    </section>
  );
}
