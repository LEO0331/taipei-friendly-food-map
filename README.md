# Taipei Friendly Food Map

[繁體中文](README-zh.md)

A mobile-first web app for exploring Taipei friendly stores, water-refill locations, restaurant-business registrations, food-traceability products, commercial-district introductions, green stores, food-hygiene grading records, inspection records, organic farms, and temporary vendor markets. It uses Vite, React, TypeScript, Leaflet, OpenStreetMap tiles, and static JSON served from `public/data`.

## Purpose

Find nearby stores and food-related places using tags such as language support, vegetarian-friendly, Muslim-friendly, accessibility, Wi-Fi, charging, payment, bathroom, parent-child, bicycle-friendly, and period-friendly. The interface defaults to Traditional Chinese and includes an English toggle.

## Data sources

- [Friendly stores list](https://data.taipei/dataset/detail?id=d807396c-e41f-4005-be42-0160280783a1) (Traditional Chinese and English resources)
- [Registered restaurant-business list](https://data.taipei/dataset/detail?id=178abc4e-fe32-4fc9-af3a-7baf1c15082c)
- [Water-refill stores](https://data.taipei/dataset/detail?id=3e5d3f27-90f1-45e7-8c04-73ac593922a4)
- [Taipei Food Traceability Platform](https://data.taipei/dataset/detail?id=40900e11-3002-4c9b-9e23-aa3b72e3d46e)
- [Taipei commercial district introductions](https://data.taipei/dataset/detail?id=52da1174-0d77-434b-88c3-e77b008e8624)
- [Taipei Green Store Directory](https://data.taipei/dataset/detail?id=1756cb64-0066-444a-a323-9f3b5a961045)
- [Food Business Hygiene Grading Records](https://data.taipei/dataset/detail?id=59579c19-a561-4564-8c0f-545bfb32c0f6)
- [Failed Food Inspection Records](https://data.taipei/dataset/detail?id=09a917a0-0fb5-47e7-957c-5f1268fba517)
- [Taipei Organic Farms](https://data.taipei/dataset/detail?id=32aea2da-14a7-47b6-a687-57e29c1ad4a7)
- [Taipei Temporary Vendor Markets](https://data.taipei/dataset/detail?id=c013d9ec-a550-46bd-ac60-45f085930706)

The frontend does not call Taipei Open Data directly. Local scripts download and convert raw CSV files; the app reads generated static JSON from `public/data`.

## Dataset scope

- Friendly-store records describe stores listed by Taipei's friendly-store dataset, including service-tag counts.
- Restaurant-business registration does not guarantee a business is currently operating as a restaurant.
- Water-refill availability, opening hours, and operating status must be confirmed on site.
- Food-traceability data is an address-free product lookup. Its source fields do not support food-safety, allergy, nutrition, diet, availability, or recommendation claims.
- Commercial-district data is district-level context, not an individual-store list, real-time feed, ranking, food-safety source, or exact-boundary dataset. The source has no official coordinates or boundaries, so the app uses district bubbles and external map searches.
- Green-store addresses have no confirmed official coordinates; the app shows district summaries and external map searches rather than exact markers.
- Hygiene-grading data is an assessment-record module, not the restaurant-business registry. Addresses are for external map lookup only.
- Failed-inspection records are historical records for particular inspections, samples, and batches; they are not a business blacklist or current-safety score.
- Organic-farm contact addresses may not be public entrances. Temporary-vendor-market schedules are source-recorded, not real-time status.

Always verify actual operation, service availability, and facilities with the store, on site, or through official notices.

## Data workflow

```sh
npm install
npm run fetch:data
npm run convert:data
```

Fetch individual modules when needed:

```sh
npm run data:fetch:water-refill
npm run data:fetch:food-traceability
npm run data:fetch:commercial-districts
npm run data:fetch:green-stores
npm run data:fetch:restaurant-hygiene-grading
```

Commands that support local input accept `-- --local /path/to/file.csv`, for example `npm run data:fetch:water-refill -- --local /path/to/water-refill.csv`. Run `npm run fetch:data -- --force` to re-download primary data.

Key generated files:

- `public/data/friendly-stores.json`, `restaurant-businesses.json`, `water-refill-stores.json`, `friendly-food-summary.json`, and `conversion-report.json`
- `public/data/food-traceability/{summary,search-index}.json` and `product-details/chunk-*.json`
- `public/data/commercial-district-{introductions,introduction-summary}.json`
- `public/data/green-store-directory/{records,summary}.json`
- `public/data/restaurant-hygiene-grading-records/{records,summary}.json`

Raw files are stored under `data/raw/` and ignored by Git. Conversion validates expected fields, preserves source values, and handles applicable UTF-8-SIG, Big5, and CP950 input. Food-traceability details are chunked so the first page load only needs summary and index files.

## Matching rules

The Traditional Chinese friendly-store file is the primary source. The English resource enriches names, addresses, and descriptions only when records match reliably through close coordinates, normalized addresses, or normalized names. Chinese records remain when no English match exists.

Restaurant-business records may match friendly stores through close coordinates and similar names, or normalized addresses and similar names. An unmatched record is shown as `friendly-store listing not found`, not as unfriendly. Water-refill matches are conservative candidates based on normalized names, addresses, districts, and close coordinates; they are not confirmation of the same business.

## Local development

```sh
npm run dev
npm run lint
npm run build
npm run preview
```

## Deployment and PWA

The build outputs a static site in `dist/` that can be hosted on any static host. `.github/workflows/ci.yml` installs dependencies, checks TypeScript, and builds on pushes and pull requests to `main`.

The PWA includes a manifest, SVG icon placeholders, mobile viewport metadata, and a small service worker that caches the app shell and small generated JSON files. Product-detail chunks load on demand rather than being precached.

## Disclaimer

This site presents Taipei Open Data. Coverage comparisons do not represent all restaurants, market share, real-time water availability, actual friendly-service coverage, real-time product sales status, exact commercial-district boundaries, restaurant rankings, food-safety certification, inspection results, recall information, or allergy, nutrition, diet, or product recommendations.
