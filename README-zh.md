# 台北友善餐飲地圖

[English](README.md)

以行動裝置優先設計的網站，用於探索台北市友善店家、飲水店家、餐館業登記資料、食材登錄產品、商圈介紹、綠色商店、餐飲衛生分級評核紀錄、食品抽驗紀錄、有機農場與臨時攤販集中場。專案使用 Vite、React、TypeScript、Leaflet、OpenStreetMap 圖磚，以及由 `public/data` 提供的靜態 JSON。

## 目的

依語言服務、蔬食友善、穆斯林友善、無障礙、Wi-Fi、充電、支付、廁所、親子、自行車與生理用品等標籤，協助使用者尋找附近店家與餐飲相關場所。介面預設為繁體中文，並提供英文切換。

## 資料來源

- [友善店家清冊](https://data.taipei/dataset/detail?id=d807396c-e41f-4005-be42-0160280783a1)（繁體中文與英文資源）
- [設址臺北市所營事業含餐館業清冊](https://data.taipei/dataset/detail?id=178abc4e-fe32-4fc9-af3a-7baf1c15082c)
- [臺北市提供飲水店家清冊](https://data.taipei/dataset/detail?id=3e5d3f27-90f1-45e7-8c04-73ac593922a4)
- [臺北市食材登錄平台](https://data.taipei/dataset/detail?id=40900e11-3002-4c9b-9e23-aa3b72e3d46e)
- [臺北市商圈介紹](https://data.taipei/dataset/detail?id=52da1174-0d77-434b-88c3-e77b008e8624)
- [臺北市綠色商店](https://data.taipei/dataset/detail?id=1756cb64-0066-444a-a323-9f3b5a961045)
- [餐飲衛生管理分級評核業者](https://data.taipei/dataset/detail?id=59579c19-a561-4564-8c0f-545bfb32c0f6)
- [臺北市衛生局食品抽驗不合格清冊](https://data.taipei/dataset/detail?id=09a917a0-0fb5-47e7-957c-5f1268fba517)
- [臺北市有機農場](https://data.taipei/dataset/detail?id=32aea2da-14a7-47b6-a687-57e29c1ad4a7)
- [臺北市臨時攤販集中場](https://data.taipei/dataset/detail?id=c013d9ec-a550-46bd-ac60-45f085930706)

前端不直接呼叫台北市開放資料平台；原始 CSV 會由本機腳本下載與轉換，應用程式讀取 `public/data` 中產生的靜態 JSON。

## 資料範圍

- 友善店家資料描述列於台北市友善店家資料集的店家，包含服務標籤統計。
- 餐館業登記資料不保證該事業目前仍實際經營餐廳。
- 飲水供應、營業時間與實際營運狀態應以現場為準。
- 食材登錄資料為不含地址的產品查詢；來源欄位不支援食品安全、過敏、營養、飲食、供應狀態或產品推薦的推論。
- 商圈資料是行政區層級的背景資訊，非個別店家清冊、即時動態、排行、食品安全來源或精確邊界資料。來源沒有官方座標與邊界，因此網站僅顯示行政區泡泡與外部地圖搜尋。
- 綠色商店地址沒有經確認的官方座標；網站提供行政區摘要與外部地圖搜尋，而不建立精確標記。
- 餐飲衛生分級為評核紀錄模組，非餐館業登記清冊；地址僅供外部地圖搜尋。
- 食品抽驗紀錄是特定檢驗、樣品與批次的歷史紀錄，不是店家黑名單或目前安全分數。
- 有機農場聯絡地址未必是對外入口；臨時攤販集中場營業時間為來源記載，非即時狀態。

實際營業、服務供應與友善設施，請向店家、現場或官方公告確認。

## 資料流程

```sh
npm install
npm run fetch:data
npm run convert:data
```

需要時下載個別模組：

```sh
npm run data:fetch:water-refill
npm run data:fetch:food-traceability
npm run data:fetch:commercial-districts
npm run data:fetch:green-stores
npm run data:fetch:restaurant-hygiene-grading
```

支援本機檔案的指令可使用 `-- --local /path/to/file.csv`，例如：`npm run data:fetch:water-refill -- --local /path/to/water-refill.csv`。使用 `npm run fetch:data -- --force` 可強制重新下載主要資料。

主要產生檔案：

- `public/data/friendly-stores.json`、`restaurant-businesses.json`、`water-refill-stores.json`、`friendly-food-summary.json` 與 `conversion-report.json`
- `public/data/food-traceability/{summary,search-index}.json` 與 `product-details/chunk-*.json`
- `public/data/commercial-district-{introductions,introduction-summary}.json`
- `public/data/green-store-directory/{records,summary}.json`
- `public/data/restaurant-hygiene-grading-records/{records,summary}.json`

原始資料位於 `data/raw/`，且不納入 Git。轉換程序會驗證預期欄位、保留來源值，並依適用情況處理 UTF-8-SIG、Big5 與 CP950 編碼。食材登錄產品細節採分塊檔案，初始頁面僅載入摘要與索引檔。

## 比對規則

繁體中文友善店家檔案是主要來源。英文資源僅在可透過近距離座標、正規化地址或正規化名稱可靠比對時，補充英文名稱、地址與說明；沒有英文對應的中文資料仍會保留。

餐館業登記資料可透過近距離座標加相似名稱，或正規化地址加相似名稱，比對至友善店家。未比對到的紀錄會顯示為 `friendly-store listing not found`，不代表該店家不友善。飲水店家的比對會依正規化名稱、地址、行政區與近距離座標保守處理，僅為候選比對，非同一營業店家的確認。

## 本機開發

```sh
npm run dev
npm run lint
npm run build
npm run preview
```

## 部署與 PWA

建置輸出為 `dist/` 中的靜態網站，可部署於任何靜態主機。`.github/workflows/ci.yml` 的 GitHub Actions 會在推送或向 `main` 提出 Pull Request 時安裝相依套件、檢查 TypeScript 並執行建置。

PWA 包含 Web App Manifest、SVG 圖示預留檔、行動裝置 viewport 設定，以及會快取應用程式殼層和小型產生 JSON 的 Service Worker。產品細節分塊採需要時載入，不會預先快取。

## 免責聲明

本網站呈現台北市開放資料。資料集覆蓋範圍的比較不代表所有餐廳、市占率、即時飲水供應、實際友善服務覆蓋、即時產品銷售狀態、精確商圈邊界、餐廳排名、食品安全認證、檢驗結果、回收資訊，或過敏、營養、飲食與產品推薦資訊。
