# Taipei Friendly Food Map / 台北友善餐飲地圖

Mobile-first bilingual web app for exploring Taipei friendly stores and registered restaurant-business records. The app uses Vite, React, TypeScript, Leaflet, OpenStreetMap tiles, and static JSON files served from `public/data`.

## Purpose

The map helps people find nearby friendly stores and food-related places with service tags such as language support, vegetarian-friendly, Muslim-friendly, accessibility, Wi-Fi, charging, payment, bathroom, parent-child, bicycle-friendly, and period-friendly.

Traditional Chinese is the default UI language. English is available through the language toggle.

## Data Sources

- Friendly stores list / 友善店家清冊（繁體中文）  
  <https://data.taipei/dataset/detail?id=d807396c-e41f-4005-be42-0160280783a1>
- Friendly stores list (English)  
  Same dataset page, English resource.
- Registered restaurant-business list / 設址臺北市所營事業含餐館業清冊  
  <https://data.taipei/dataset/detail?id=178abc4e-fe32-4fc9-af3a-7baf1c15082c>

The frontend does not call Taipei Open Data directly. Raw CSV downloads and conversion happen through local scripts, and the app reads static JSON from `public/data`.

## Dataset Meaning

Friendly-store records describe stores listed in Taipei's friendly-store dataset and include friendly-service tag counts.

Registered restaurant-business records describe businesses in Taipei whose registered business items include restaurant industry. This does not guarantee the business is currently operating as a restaurant.

Actual operation, service availability, and friendly facilities should be verified with the store, on site, or through official notices.

## Data Workflow

Install dependencies:

```sh
npm install
```

Fetch raw CSV files:

```sh
npm run fetch:data
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
- `public/data/friendly-food-summary.json`
- `public/data/conversion-report.json`

Raw files are stored under `data/raw/friendly-food/` and are ignored by git.

## Matching Rules

The Traditional Chinese friendly-store file is the primary data source. The English file enriches English names, addresses, and descriptions when records can be matched reliably by close coordinates, normalized address, or normalized name. Chinese records are kept even when no English match exists.

Restaurant-business records are optionally matched to friendly stores using close coordinates plus similar name, or normalized address plus similar name. Unmatched restaurant-business records are described as `friendly-store listing not found`; the app does not label them as not friendly.

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

The app includes a web app manifest, SVG icon placeholders, mobile viewport metadata, and a small service worker that caches the app shell and generated data JSON files.

## Disclaimer

This site presents public data from Taipei Open Data. Dataset coverage comparisons show record counts from two public datasets only and do not represent all restaurants, market share, or actual friendly-service coverage.
