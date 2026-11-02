# Session Handoff

## Current delivery — 2026-11-03

- Branch: `codex/food-release-followup` in `D:/Practice/audit-worktrees/food-release-followup`, based on refreshed main `ef9372583a804abcc87e10b090550d38213d2fb5`.
- Git history confirms Civic Explorer PR #5 and the product-selection race correction PR #6 are merged. Earlier instructions to create or keep those PRs open are historical and no longer current.
- This follow-up corrects README workflow references in both languages and defers ten secondary dashboards while keeping the default map eager. No dependency, dataset, analytical or layout redesign changes.
- The build inserts emitted JavaScript/CSS asset paths into service-worker v12's shell cache so splitting does not remove offline access to previously available tabs. Product-detail JSON and Policy 11 evidence remain on demand as before.
- Deliver one new Draft PR targeting main; do not automatically merge or deploy this follow-up.

## Verification

- Run `powershell -ExecutionPolicy Bypass -File ./init.ps1`, `npm.cmd run lint`, `npm.cmd run policy11:verify`, `npm.cmd audit`, and `git diff --check`.
- Browser scripts use an existing Playwright installation through `PLAYWRIGHT_MODULE` and production preview through `CIVIC_BASE_URL` (default `http://127.0.0.1:4173`). Run `node scripts/verifyCivicExplorer.mjs`, `node scripts/verifyFoodTraceabilitySelection.mjs`, and `node scripts/verifyDeferredDashboards.mjs`.
- The deferred-dashboard check asserts no secondary module JS on initial map rendering, all ten module destinations load, and installed-service-worker offline navigation works for tabs whose records were already precached.
- Current measurements and actual final results are recorded in `progress.md`. External audit logs are under `D:/Practice/audit-results/publish-followup/taipei-friendly-food-map`.
- Final root and Pages-path runs passed all 23 unit tests, build/lint, Policy 11 reproduction, zero-vulnerability audit, selection regression, 11 Explorer groups and the deferred/offline script. Initial root-path JS including preload is 437,082 bytes versus 527,189 before (17.09% lower); all chunks remain below 500kB.

## Boundaries and remaining work

- Preserve exact public-data bytes, conservative matching and geographic/statistical boundaries. Keep raw-source and generated-data refreshes separate from this delivery.
- Agricultural-converter focused tests, dataset freshness/provenance work and the unused absent traditional-market summary request remain separate tasks.
- Actual device geolocation permissions, external tile availability, screen-reader sessions and non-Chromium browsers remain unverified. The Explorer suite blocks service workers and stubs geolocation/tiles; the deferred-dashboard suite separately exercises the real service worker with external tiles excluded.
- First-time service-worker installation still downloads shell assets for offline use; code splitting reduces initial map JavaScript execution/loading dependencies, not the total offline-install payload.
