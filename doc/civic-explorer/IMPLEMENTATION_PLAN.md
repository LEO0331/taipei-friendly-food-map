# Civic Explorer integration plan

Active feature: feat-012. Based on origin/main ebed796 (including merged Policy 11).

1. Baseline build, 20 tests, TypeScript, Policy 11 reproduction, screenshots, bundle and requests.
2. Lock the 14 existing tab IDs/order/group/labels and four group defaults with tests; extract only the catalogue from MainTabs to a typed data file. Keep its rendering/callback logic intact.
3. Add a generic MIT-attributed SVG HexHub and a separate four-group host adapter. Search covers existing bilingual labels, not source records.
4. Lazy-load the optional adapter in an isolated native dialog launcher. Keep App/map/filter/module instances mounted; the launcher alone owns opening state. No map dependency changes or geolocation API calls.
5. Verify native focus containment/return, Escape, module callback, list mode, both locales, mobile, reduced motion, map/location/filter/popup preservation, lazy requests, data boundaries and bundle deltas. Review all changes and create one Draft PR; do not merge.

No new dependencies, data ingestion, conversion, source interpretation, privacy or export changes.
