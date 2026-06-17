import { useEffect, useMemo, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { DataNotes } from './components/DataNotes';
import { FilterPanel } from './components/FilterPanel';
import { FriendlyMap } from './components/FriendlyMap';
import { FriendlyOverviewDashboard } from './components/FriendlyOverviewDashboard';
import { LanguageToggle } from './components/LanguageToggle';
import { MainTabs, type TabKey } from './components/MainTabs';
import { StoreDirectory } from './components/StoreDirectory';
import { loadFriendlyFoodData, type AppData } from './data/loadData';
import { translations, type TranslationKey } from './data/translations';
import {
  calculateDistanceMeters,
  itemSearchText,
  type FilterState,
} from './lib/friendlyFood';
import type { FriendlyStore, Language, RestaurantBusiness } from './types';

const initialFilters: FilterState = {
  layers: {
    friendly_store: true,
    registered_restaurant_business: false,
  },
  district: '',
  search: '',
  serviceTags: [],
  minFriendlyItems: 0,
  matchedOnly: false,
  validCoordinatesOnly: false,
};

export default function App() {
  const [language, setLanguage] = useState<Language>('zh');
  const [activeTab, setActiveTab] = useState<TabKey>('map');
  const [data, setData] = useState<AppData | undefined>();
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number }>();
  const [locationError, setLocationError] = useState('');
  const [focusedItem, setFocusedItem] = useState<FriendlyStore | RestaurantBusiness | undefined>();
  const t = (key: TranslationKey) => translations[language][key];

  useEffect(() => {
    loadFriendlyFoodData().then(setData);
  }, []);

  const allItems = useMemo<Array<FriendlyStore | RestaurantBusiness>>(
    () => [...(data?.friendlyStores ?? []), ...(data?.restaurants ?? [])],
    [data],
  );

  const distances = useMemo(() => {
    const map = new Map<string, number>();
    if (!userLocation) return map;
    allItems.forEach((item) => {
      if (item.latitude !== undefined && item.longitude !== undefined) {
        map.set(
          `${item.layer}-${item.id}`,
          calculateDistanceMeters(userLocation.latitude, userLocation.longitude, item.latitude, item.longitude),
        );
      }
    });
    return map;
  }, [allItems, userLocation]);

  const filteredItems = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    const items = allItems.filter((item) => {
      if (!filters.layers[item.layer]) return false;
      if (filters.district && item.district !== filters.district) return false;
      if (filters.validCoordinatesOnly && item.coordinateStatus !== 'valid') return false;
      if (search && !itemSearchText(item, language).includes(search)) return false;
      if (item.layer === 'friendly_store') {
        if (item.totalFriendlyItems < filters.minFriendlyItems) return false;
        if (!filters.serviceTags.every((tag) => item.serviceTags.includes(tag))) return false;
      } else {
        if (filters.serviceTags.length > 0) return false;
        if (filters.minFriendlyItems > 0) return false;
        if (filters.matchedOnly && !item.matchedFriendlyStoreId) return false;
      }
      return true;
    });
    if (userLocation) {
      return [...items].sort((a, b) => {
        const left = distances.get(`${a.layer}-${a.id}`) ?? Number.POSITIVE_INFINITY;
        const right = distances.get(`${b.layer}-${b.id}`) ?? Number.POSITIVE_INFINITY;
        return left - right;
      });
    }
    return items;
  }, [allItems, distances, filters, language, userLocation]);

  const showNearby = () => {
    if (!navigator.geolocation) {
      setLocationError(t('locationError'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationError('');
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setFilters((current) => ({ ...current, validCoordinatesOnly: true }));
      },
      () => setLocationError(t('locationError')),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  if (!data) {
    return (
      <main className="app loading-screen">
        <p>{t('loading')}</p>
      </main>
    );
  }

  return (
    <main className="app">
      <header className="app-header">
        <div>
          <h1>{t('appTitle')}</h1>
          <p>{t('appSubtitle')}</p>
        </div>
        <LanguageToggle language={language} onChange={setLanguage} />
      </header>

      <MainTabs activeTab={activeTab} t={t} onChange={setActiveTab} />

      <section className="workspace">
        {activeTab !== 'notes' && (
          <aside className="controls">
            <button className="nearby-button" onClick={showNearby}>
              {t('showNearbyFriendlyStores')}
            </button>
            {locationError && <p className="error-copy">{locationError}</p>}
            {userLocation && <p className="nearby-label">{t('nearbyStores')}</p>}
            <FilterPanel filters={filters} language={language} t={t} onChange={setFilters} />
          </aside>
        )}

        <div className="content">
          {activeTab === 'map' && (
            <FriendlyMap
              items={filteredItems}
              language={language}
              t={t}
              userLocation={userLocation}
              focusedItem={focusedItem}
            />
          )}
          {activeTab === 'directory' && (
            <StoreDirectory
              items={filteredItems}
              distances={distances}
              language={language}
              t={t}
              onFocusMap={(item) => {
                setFocusedItem(item);
                setActiveTab('map');
              }}
            />
          )}
          {activeTab === 'overview' && <FriendlyOverviewDashboard summary={data.summary} language={language} t={t} />}
          {activeTab === 'notes' && <DataNotes language={language} t={t} />}
        </div>
      </section>
    </main>
  );
}
