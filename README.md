# Taipei Friendly Food Map / 台北友善餐飲地圖

Mobile-first bilingual web app for exploring Taipei friendly stores, water refill locations, registered restaurant-business records, food traceability product data, commercial district introductions, and food-business hygiene-grading records. The app uses Vite, React, TypeScript, Leaflet, OpenStreetMap/CARTO tiles, and static JSON files served from `public/data`.

## Purpose

The map helps people find nearby friendly stores and food-related places with service tags such as language support, vegetarian-friendly, Muslim-friendly, accessibility, Wi-Fi, charging, payment, bathroom, parent-child, bicycle-friendly, and period-friendly.

Food source transparency: Taipei Food Traceability Platform product and ingredient lookup / 食材來源透明資訊：臺北市食材登錄平台產品與原料查詢.

Commercial districts and local food/shopping context: Taipei commercial district introductions / 商圈、美食與生活消費：臺北市商圈介紹.

Traditional Chinese is the default UI language. English is available through the language toggle.

## Data Sources

- Friendly stores list / 友善店家清冊（繁體中文）  
  <https://data.taipei/dataset/detail?id=d807396c-e41f-4005-be42-0160280783a1>
- Friendly stores list (English)  
  Same dataset page, English resource.
- Registered restaurant-business list / 設址臺北市所營事業含餐館業清冊  
  <https://data.taipei/dataset/detail?id=178abc4e-fe32-4fc9-af3a-7baf1c15082c>
- Water refill stores / 臺北市提供飲水店家清冊  
  <https://data.taipei/dataset/detail?id=3e5d3f27-90f1-45e7-8c04-73ac593922a4>
- Taipei Food Traceability Platform / 臺北市食材登錄平台
  <https://data.taipei/dataset/detail?id=40900e11-3002-4c9b-9e23-aa3b72e3d46e>
- Taipei commercial district introductions / 臺北市商圈介紹
  <https://data.taipei/dataset/detail?id=52da1174-0d77-434b-88c3-e77b008e8624>
- Taipei Green Store Directory / 臺北市綠色商店
  <https://data.taipei/dataset/detail?id=1756cb64-0066-444a-a323-9f3b5a961045>
- Food Business Hygiene Grading Records / 餐飲衛生管理分級評核業者
  <https://data.taipei/dataset/detail?id=59579c19-a561-4564-8c0f-545bfb32c0f6>
- Failed Food Inspection Records / 臺北市衛生局食品抽驗不合格清冊
  <https://data.taipei/dataset/detail?id=09a917a0-0fb5-47e1-957c-5f1268fba517>
- Taipei Organic Farms / 臺北市有機農場
  <https://data.taipei/dataset/detail?id=32aea2da-14a7-47b6-a687-57e29c1ad4a7>
- Taipei Temporary Vendor Markets / 臺北市臨時攤販集中場
  <https://data.taipei/dataset/detail?id=c013d9ec-a550-46bd-ac60-45f085930706>

The frontend does not call Taipei Open Data directly. Raw CSV downloads and conversion happen through local scripts, and the app reads static JSON from `public/data`.

## Dataset Meaning

Friendly-store records describe stores listed in Taipei's friendly-store dataset and include friendly-service tag counts.

Registered restaurant-business records describe businesses in Taipei whose registered business items include restaurant industry. This does not guarantee the business is currently operating as a restaurant.

Actual operation, service availability, and friendly facilities should be verified with the store, on site, or through official notices.

Water-refill records identify stores listed as providing drinking water. They are separate from the general friendly-store list. Water availability, opening hours, and current operation should be verified on site.

Food Traceability Platform records are a separate `taipei_food_traceability_products` module for company, brand, product, ingredient, ingredient-brand, serving-size, calorie-field, and source-link lookup. The dataset has no address or coordinate fields, so it does not create map markers. Serving size and calories are source fields only; the app does not make food-safety, allergy, nutrition, diet, availability, or product-recommendation claims.

Commercial district introduction records are a separate `commercial_district_introductions` module. The conversion preserves district, AreaCode, tag, organization name, location description, nearby MRT, commercial district type, and description fields; derives food/shopping/leisure flags; and shows district-level map bubbles plus external map lookup links only. The dataset does not provide official coordinates or exact commercial district boundaries and is not an individual store list, real-time business-status feed, restaurant ranking, or food-safety source.

## Data Workflow

Install dependencies:

```sh
npm install
```

Fetch raw CSV files:

```sh
npm run fetch:data
```

Fetch the official water-refill CSV:

```sh
npm run data:fetch:water-refill
```

Use a local water-refill CSV:

```sh
npm run data:fetch:water-refill -- --local /path/to/water-refill.csv
```

Fetch or copy the food-traceability CSV:

```sh
npm run data:fetch:food-traceability
```

Fetch or copy the commercial-district CSV:

```sh
npm run data:fetch:commercial-districts
```

Fetch or copy the Green Store CSV (manual CSV fallback):

```sh
npm run data:fetch:green-stores
npm run data:fetch:green-stores -- --local /path/to/green-stores.csv
```

Fetch or copy the Food Business Hygiene Grading CSV:

```sh
npm run data:fetch:restaurant-hygiene-grading
npm run data:fetch:restaurant-hygiene-grading -- --local /path/to/restaurant-hygiene-grading-records.csv
```

Re-download even if files already exist:

```sh
npm run fetch:data -- --force
```

Convert raw files to static JSON:

```sh
npm run convert:data
```

Generated files:

- `public/data/friendly-stores.json`
- `public/data/restaurant-businesses.json`
- `public/data/water-refill-stores.json`
- `public/data/friendly-food-summary.json`
- `public/data/conversion-report.json`
- `public/data/food-traceability/summary.json`
- `public/data/food-traceability/search-index.json`
- `public/data/food-traceability/product-details/chunk-*.json`
- `public/data/commercial-district-introductions.json`
- `public/data/commercial-district-introduction-summary.json`
- `public/data/green-store-directory/records.json`
- `public/data/green-store-directory/summary.json`
- `public/data/restaurant-hygiene-grading-records/records.json`
- `public/data/restaurant-hygiene-grading-records/summary.json`

Raw files are stored under `data/raw/` and are ignored by git. Food traceability product details are split into chunked JSON, while the initial UI loads only summary and lightweight search/index files.

Commercial district conversion supports UTF-8-SIG and Big5 fallback, keeps AreaCode as text, maps AreaCode to Taipei districts for validation, parses `吃在商圈 / 買在商圈 / 玩在商圈`, extracts nearby MRT line/station text where possible, and categorizes commercial district types for browsing.

Green Store conversion supports UTF-8-SIG, Big5, and CP950 input, preserves the source fields, and uses store number as its primary key with a normalized name/address fallback. The directory has addresses but no confirmed official coordinates, so it provides district summaries and external map-search links rather than exact markers.

Food Business Hygiene Grading Records are a separate assessment-record module, not the general restaurant-business registry. Conversion supports UTF-8-SIG, Big5, and CP950, preserves all five official source fields, resolves Taipei districts from district code or address, and deduplicates registration number, business name, address, and assessment result. Addresses are for external map lookup only: no automatic geocoding or exact markers are created.

Failed Food Inspection Records combine the official 111, 112, and 113 annual CSV resources while preserving source year and resource name. The dashboard treats results as historical records for specific inspections, samples, and batches; it does not create a business blacklist, current-safety score, or exact map markers from incomplete locations.

Taipei Organic Farms are an address-only directory backed by local static JSON. Contact addresses may not be public entrances and no automatic geocoding or exact markers are created; certification and activity fields remain source records rather than current-status claims.

Temporary vendor markets are a separate `temporary_vendor_markets` module. It preserves each source field, validates and converts only official coordinates for map markers, and keeps coordinate-less records in the directory. Operating days and hours are source-recorded schedule information from the dataset update and are not real-time market or stall status.

## Matching Rules

The Traditional Chinese friendly-store file is the primary data source. The English file enriches English names, addresses, and descriptions when records can be matched reliably by close coordinates, normalized address, or normalized name. Chinese records are kept even when no English match exists.

Restaurant-business records are optionally matched to friendly stores using close coordinates plus similar name, or normalized address plus similar name. Unmatched restaurant-business records are described as `friendly-store listing not found`; the app does not label them as not friendly.

Water-refill records are matched conservatively to friendly stores and restaurant-business records using normalized names, addresses, districts, and close coordinates. Matches are candidates, not verification that two records represent the same operating business.

The nearby controls support all selected layers and include a water-refill-only shortcut.

## Local Development

Start the dev server:

```sh
npm run dev
```

Run typecheck:

```sh
npm run lint
```

Build production assets:

```sh
npm run build
```

Preview the production build:

```sh
npm run preview
```

## Deployment

The app is static after build and can be deployed to any static host. Build output is written to `dist/`.

The repository includes `.github/workflows/ci.yml`, which installs dependencies, runs TypeScript checking, and builds the app on pushes and pull requests to `main`.

## PWA

The app includes a web app manifest, SVG icon placeholders, mobile viewport metadata, and a small service worker that caches the app shell and small generated data JSON files. Food-traceability product detail chunks are loaded on demand rather than precached.

## Disclaimer

This site presents public data from Taipei Open Data. Dataset coverage comparisons do not represent all restaurants, market share, real-time water availability, actual friendly-service coverage, real-time product sales status, exact commercial district boundaries, restaurant rankings, food-safety certification, inspection results, recall information, allergy advice, nutrition advice, diet advice, or product recommendations.
