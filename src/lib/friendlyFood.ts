import type {
  CoordinateStatus,
  FriendlyFoodSummary,
  FriendlyServiceTag,
  FriendlyStore,
  Language,
  RestaurantBusiness,
  StoreLayer,
} from '../types';

export const TAIPEI_BOUNDS = {
  minLng: 121.43,
  maxLng: 121.7,
  minLat: 24.9,
  maxLat: 25.25,
};

export const TAIPEI_DISTRICTS = [
  '中正區',
  '大同區',
  '中山區',
  '松山區',
  '大安區',
  '萬華區',
  '信義區',
  '士林區',
  '北投區',
  '內湖區',
  '南港區',
  '文山區',
];

export const FRIENDLY_TAGS: FriendlyServiceTag[] = [
  'english_friendly',
  'japanese_friendly',
  'korean_friendly',
  'mobile_charging',
  'accessibility_friendly',
  'gender_friendly',
  'convenient_payment',
  'vegetarian_friendly',
  'friendly_bathroom',
  'fair_trade_friendly',
  'free_wifi',
  'bicycle_friendly',
  'parent_child_friendly',
  'muslim_friendly',
  'period_friendly',
];

export const FRIENDLY_TAG_FIELD_MAP_ZH: Record<FriendlyServiceTag, string> = {
  english_friendly: '英文友善（count）',
  japanese_friendly: '日文友善（count）',
  korean_friendly: '韓文友善（count）',
  mobile_charging: '行動裝置充電（count）',
  accessibility_friendly: '無障礙友善（count）',
  gender_friendly: '性別友善（count）',
  convenient_payment: '便利支付（count）',
  vegetarian_friendly: '素食友善（count）',
  friendly_bathroom: '友善廁所（count）',
  fair_trade_friendly: '公平貿易友善（count）',
  free_wifi: 'Free WiFi（count）',
  bicycle_friendly: '自行車友善（count）',
  parent_child_friendly: '親子友善（count）',
  muslim_friendly: '穆斯林友善（count）',
  period_friendly: '月經友善（count）',
};

export const tagLabel = (tag: FriendlyServiceTag, language: Language): string => {
  const zh: Record<FriendlyServiceTag, string> = {
    english_friendly: '英文友善',
    japanese_friendly: '日文友善',
    korean_friendly: '韓文友善',
    mobile_charging: '行動裝置充電',
    accessibility_friendly: '無障礙友善',
    gender_friendly: '性別友善',
    convenient_payment: '便利支付',
    vegetarian_friendly: '素食友善',
    friendly_bathroom: '友善廁所',
    fair_trade_friendly: '公平貿易友善',
    free_wifi: 'Free Wi-Fi',
    bicycle_friendly: '自行車友善',
    parent_child_friendly: '親子友善',
    muslim_friendly: '穆斯林友善',
    period_friendly: '月經友善',
  };
  const en: Record<FriendlyServiceTag, string> = {
    english_friendly: 'English-friendly',
    japanese_friendly: 'Japanese-friendly',
    korean_friendly: 'Korean-friendly',
    mobile_charging: 'Mobile charging',
    accessibility_friendly: 'Accessibility-friendly',
    gender_friendly: 'Gender-friendly',
    convenient_payment: 'Convenient payment',
    vegetarian_friendly: 'Vegetarian-friendly',
    friendly_bathroom: 'Friendly bathroom',
    fair_trade_friendly: 'Fair Trade-friendly',
    free_wifi: 'Free Wi-Fi',
    bicycle_friendly: 'Bicycle-friendly',
    parent_child_friendly: 'Parent-child-friendly',
    muslim_friendly: 'Muslim-friendly',
    period_friendly: 'Period-friendly',
  };
  return language === 'zh' ? zh[tag] : en[tag];
};

export const normalizeColumnName = (raw: string): string => raw.replace(/^\uFEFF/, '').trim();

export const normalizeText = (raw: string | undefined): string =>
  (raw ?? '')
    .toLowerCase()
    .replace(/[()\[\]（）【】\s,，。.-]/g, '')
    .trim();

export const parseCoordinate = (raw: unknown): number | undefined => {
  if (raw === null || raw === undefined) return undefined;
  const value = Number(String(raw).trim());
  return Number.isFinite(value) ? value : undefined;
};

export const validateTaipeiCoordinate = (
  longitude?: number,
  latitude?: number,
): CoordinateStatus => {
  if (longitude === undefined || latitude === undefined) return 'missing';
  if (
    longitude < TAIPEI_BOUNDS.minLng ||
    longitude > TAIPEI_BOUNDS.maxLng ||
    latitude < TAIPEI_BOUNDS.minLat ||
    latitude > TAIPEI_BOUNDS.maxLat
  ) {
    return 'outlier';
  }
  return 'valid';
};

export const normalizeDistrict = (raw: string): string | undefined => {
  const compact = raw.trim();
  if (!compact) return undefined;
  const exact = TAIPEI_DISTRICTS.find((district) => compact.includes(district));
  if (exact) return exact;
  const short = TAIPEI_DISTRICTS.find((district) => compact.includes(district.replace('區', '')));
  return short;
};

export const extractDistrictFromAddress = (address: string): string | undefined =>
  normalizeDistrict(address);

export const parseFriendlyServiceCounts = (
  row: Record<string, unknown>,
  fieldMap = FRIENDLY_TAG_FIELD_MAP_ZH,
): Record<FriendlyServiceTag, number> =>
  FRIENDLY_TAGS.reduce(
    (counts, tag) => {
      const raw = row[fieldMap[tag]];
      const value = Number(String(raw ?? '').trim());
      counts[tag] = Number.isFinite(value) && value > 0 ? value : 0;
      return counts;
    },
    {} as Record<FriendlyServiceTag, number>,
  );

export const parseFriendlyServiceTags = (
  row: Record<string, unknown>,
  fieldMap = FRIENDLY_TAG_FIELD_MAP_ZH,
): FriendlyServiceTag[] => {
  const counts = parseFriendlyServiceCounts(row, fieldMap);
  return FRIENDLY_TAGS.filter((tag) => counts[tag] > 0);
};

export const calculateDistanceMeters = (
  userLat: number,
  userLng: number,
  itemLat: number,
  itemLng: number,
): number => {
  const radius = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(itemLat - userLat);
  const dLng = toRad(itemLng - userLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(userLat)) * Math.cos(toRad(itemLat)) * Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const formatDistance = (distanceMeters: number, language: Language): string => {
  if (distanceMeters < 1000) {
    return language === 'zh'
      ? `${Math.round(distanceMeters)} 公尺`
      : `${Math.round(distanceMeters)} m`;
  }
  const km = (distanceMeters / 1000).toFixed(1);
  return language === 'zh' ? `${km} 公里` : `${km} km`;
};

export const googleMapsUrl = (item: { latitude?: number; longitude?: number; address?: string }) => {
  if (item.latitude !== undefined && item.longitude !== undefined) {
    return `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address ?? '')}`;
};

export const sanitizeExternalUrl = (rawUrl: string | undefined): string | undefined => {
  if (!rawUrl) return undefined;
  try {
    const url = new URL(rawUrl);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
};

export const matchEnglishFriendlyStore = (
  zhStore: FriendlyStore,
  enRows: Record<string, string>[],
): Partial<FriendlyStore> => {
  const coordinateMatch = enRows.find((row) => {
    const lng = parseCoordinate(row.Longitude);
    const lat = parseCoordinate(row.Latitude);
    return (
      lng !== undefined &&
      lat !== undefined &&
      zhStore.longitude !== undefined &&
      zhStore.latitude !== undefined &&
      Math.abs(lng - zhStore.longitude) < 0.00002 &&
      Math.abs(lat - zhStore.latitude) < 0.00002
    );
  });
  const addressKey = normalizeText(zhStore.addressZh);
  const addressMatch = enRows.find((row) => normalizeText(row.Address) === addressKey);
  const nameKey = normalizeText(zhStore.nameZh);
  const nameMatch = enRows.find((row) => normalizeText(row['Store Name']) === nameKey);
  const match = coordinateMatch ?? addressMatch ?? nameMatch;
  if (!match) return {};
  return {
    nameEn: match['Store Name'] || undefined,
    addressEn: match.Address || undefined,
    descriptionEn: match.Description || undefined,
  };
};

const similarName = (a: string, b: string): boolean => {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (!left || !right) return false;
  return left.includes(right) || right.includes(left);
};

export const matchRestaurantToFriendlyStore = (
  restaurant: RestaurantBusiness,
  friendlyStores: FriendlyStore[],
): { matchedFriendlyStoreId?: string; matchConfidence: 'high' | 'medium' | 'low' | 'none' } => {
  for (const store of friendlyStores) {
    const closeCoordinates =
      restaurant.longitude !== undefined &&
      restaurant.latitude !== undefined &&
      store.longitude !== undefined &&
      store.latitude !== undefined &&
      calculateDistanceMeters(restaurant.latitude, restaurant.longitude, store.latitude, store.longitude) < 40;
    const sameAddress = normalizeText(restaurant.address) === normalizeText(store.addressZh);
    const namesSimilar = similarName(restaurant.name, store.nameZh);
    if (closeCoordinates && namesSimilar) {
      return { matchedFriendlyStoreId: store.id, matchConfidence: 'high' };
    }
    if (sameAddress && namesSimilar) {
      return { matchedFriendlyStoreId: store.id, matchConfidence: 'medium' };
    }
    if ((closeCoordinates || sameAddress) && !namesSimilar) {
      return { matchedFriendlyStoreId: store.id, matchConfidence: 'low' };
    }
  }
  return { matchConfidence: 'none' };
};

const coordinateBucketKey = (latitude: number, longitude: number) =>
  `${Math.floor(latitude * 1000)}:${Math.floor(longitude * 1000)}`;

export const createRestaurantFriendlyStoreMatcher = (friendlyStores: FriendlyStore[]) => {
  const storesByAddress = new Map<string, FriendlyStore[]>();
  const storesByCoordinateBucket = new Map<string, FriendlyStore[]>();
  const addToIndex = (index: Map<string, FriendlyStore[]>, key: string, store: FriendlyStore) => {
    const stores = index.get(key);
    if (stores) {
      stores.push(store);
    } else {
      index.set(key, [store]);
    }
  };

  friendlyStores.forEach((store) => {
    const addressKey = normalizeText(store.addressZh);
    if (addressKey) {
      addToIndex(storesByAddress, addressKey, store);
    }
    if (store.latitude !== undefined && store.longitude !== undefined) {
      const bucketKey = coordinateBucketKey(store.latitude, store.longitude);
      addToIndex(storesByCoordinateBucket, bucketKey, store);
    }
  });

  return (restaurant: RestaurantBusiness) => {
    const candidates = new Map<string, FriendlyStore>();
    const addressKey = normalizeText(restaurant.address);
    storesByAddress.get(addressKey)?.forEach((store) => candidates.set(store.id, store));

    if (restaurant.latitude !== undefined && restaurant.longitude !== undefined) {
      const latBucket = Math.floor(restaurant.latitude * 1000);
      const lngBucket = Math.floor(restaurant.longitude * 1000);
      for (let latOffset = -1; latOffset <= 1; latOffset += 1) {
        for (let lngOffset = -1; lngOffset <= 1; lngOffset += 1) {
          const bucketKey = `${latBucket + latOffset}:${lngBucket + lngOffset}`;
          storesByCoordinateBucket.get(bucketKey)?.forEach((store) => candidates.set(store.id, store));
        }
      }
    }

    return matchRestaurantToFriendlyStore(restaurant, [...candidates.values()]);
  };
};

export const itemSearchText = (item: FriendlyStore | RestaurantBusiness, language: Language): string => {
  if (item.layer === 'friendly_store') {
    return [
      item.nameZh,
      item.nameEn,
      item.addressZh,
      item.addressEn,
      item.descriptionZh,
      item.descriptionEn,
      item.district,
      ...item.serviceTags.map((tag) => tagLabel(tag, language)),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }
  return [item.name, item.address, item.district].filter(Boolean).join(' ').toLowerCase();
};

export const buildFriendlyFoodSummary = (
  friendlyStores: FriendlyStore[],
  restaurants: RestaurantBusiness[],
): FriendlyFoodSummary => {
  const countByDistrict = <T extends { district?: string }>(items: T[]) =>
    items.reduce<Record<string, number>>((counts, item) => {
      if (item.district) counts[item.district] = (counts[item.district] ?? 0) + 1;
      return counts;
    }, {});
  const friendlyStoresByDistrict = countByDistrict(friendlyStores);
  const restaurantBusinessesByDistrict = countByDistrict(restaurants);
  const friendlyServiceTagDistribution = FRIENDLY_TAGS.reduce(
    (counts, tag) => {
      counts[tag] = friendlyStores.filter((store) => store.serviceTags.includes(tag)).length;
      return counts;
    },
    {} as Record<FriendlyServiceTag, number>,
  );
  const totalFriendlyItemsDistribution = friendlyStores.reduce<Record<string, number>>((counts, store) => {
    const bucket = store.totalFriendlyItems >= 10 ? '10+' : String(store.totalFriendlyItems);
    counts[bucket] = (counts[bucket] ?? 0) + 1;
    return counts;
  }, {});
  const topDistrictByFriendlyStores = Object.entries(friendlyStoresByDistrict).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topFriendlyServiceTag = Object.entries(friendlyServiceTagDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] as
    | FriendlyServiceTag
    | undefined;
  return {
    generatedAt: new Date().toISOString(),
    friendlyStoreCount: friendlyStores.length,
    restaurantBusinessCount: restaurants.length,
    friendlyStoresWithCoordinates: friendlyStores.filter((store) => store.coordinateStatus === 'valid').length,
    restaurantBusinessesWithCoordinates: restaurants.filter((restaurant) => restaurant.coordinateStatus === 'valid').length,
    topDistrictByFriendlyStores,
    topFriendlyServiceTag,
    vegetarianFriendlyCount: friendlyServiceTagDistribution.vegetarian_friendly,
    accessibilityFriendlyCount: friendlyServiceTagDistribution.accessibility_friendly,
    muslimFriendlyCount: friendlyServiceTagDistribution.muslim_friendly,
    freeWifiCount: friendlyServiceTagDistribution.free_wifi,
    matchedFriendlyRestaurantCount: restaurants.filter((restaurant) => restaurant.matchedFriendlyStoreId).length,
    friendlyStoresByDistrict,
    restaurantBusinessesByDistrict,
    friendlyServiceTagDistribution,
    totalFriendlyItemsDistribution,
  };
};

export type FilterState = {
  layers: Record<StoreLayer, boolean>;
  district: string;
  search: string;
  serviceTags: FriendlyServiceTag[];
  minFriendlyItems: number;
  matchedOnly: boolean;
  validCoordinatesOnly: boolean;
};
