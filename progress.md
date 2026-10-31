# Session Progress Log

## Current State

**Last Updated:** 2026-10-31
**Active Feature:** feat-012 — Optional four-hub Civic Explorer (implementation complete; Draft PR review)

## What's Done

- Created the project agent harness, feature tracker, lifecycle handoff, and Windows verification entry point.
- Added the Agricultural Product Inspections module and reproducible source-data pipeline.
- Added `doc/CONSULTANT_DASHBOARD_REVIEW.md`, a customer-oriented review with data insights, release risks, and a 90-day roadmap.
- Replaced the all-page tab strip with responsive grouped navigation and removed the unfinished Traditional Markets destination.
- Fixed the stale PWA app-shell behavior that could leave GitHub Pages visitors on a blank screen after deployment.
- Split the project documentation into English (`README.md`) and Traditional Chinese (`README-zh.md`) versions with reciprocal language links.
- Removed the customer-visible map attribution/API-key-style badge from the primary and commercial-district dashboard maps.
- Audited Chinese-mode UI copy across all dashboard modules and corrected shared Wi-Fi labels, filter accessibility copy, and Chinese commercial-district field descriptions.
- Localized the shared language-toggle label, store-card map action, and directory load-more action through the translation table.
- Localized temporary-vendor map/directory/export copy and organic-farm pagination, export headers, area labels, and quality metrics for Chinese mode.
- Audited project-wide filtering paths; added organic-farm filter-change pagination reset so narrowed results cannot leave the directory on an empty stale page.
- Synchronized the commercial-district distribution map with the directory's active filters; district bubbles now aggregate only matching records.
- Fixed organic-farm data-quality labels for all generated summary keys and hardened the activity chart data normalization to prevent crashes when opening 農場活動.
- Removed the problematic 農場活動 subtab from the organic-farm module; the activity source fields remain in the data but are no longer exposed through the unstable view.
- Fixed supermarket mojibake by decoding the official raw CSV as Big5 and regenerated `public/data/supermarkets/records.json` and `summary.json`; output now contains 37 readable records across 11 districts.

## In Progress

- [ ] Add focused tests for agricultural-inspection parsing and weighted aggregation.
  - Cover Big5 decoding, percentage normalization, and qualified ÷ inspected aggregation.
  - Blockers: none.

## Next

1. Add the focused agricultural-inspection conversion/aggregation tests.
2. Run `powershell -ExecutionPolicy Bypass -File .\init.ps1`, record evidence, and update this file.

## Risks

- Public source files may change field names or encodings. The converter deliberately validates expected headers and supported encodings.

## Decisions

- **Separate map and statistical experiences:** City-level inspection statistics remain a dashboard because their source has no reliable location information.
- **Generated data stays reproducible:** `public/data/` is updated by its matching fetch/conversion scripts rather than hand-edited.

## Evidence

- `npm.cmd run build` — passed on 2026-08-18.
- `npm.cmd test` — 8 tests passed on 2026-08-18.
- Map attribution removal — `npm.cmd run build`, `npm.cmd test` (8 passing), and `git diff --check` passed on 2026-08-31.
- Chinese-localization audit — `npm.cmd run build`, `npm.cmd test` (8 passing), and `git diff --check` passed on 2026-08-31.
- Remaining boundary: source-only values and legacy module-local export/popup strings require bilingual data fields or a focused follow-up refactor.
- `npm.cmd run lint` (TypeScript) and `git diff --check` passed after the remaining audit fixes; the final elevated build/test retry was unavailable because the desktop usage limit was reached.
- Filtering audit: all module filters include their state in memo dependencies; map/directory filters use the same filtered record set, and filter changes reset pagination where pagination exists.
- Commercial-district map sync — TypeScript lint and `git diff --check` passed on 2026-08-31.
- Organic-farm quality/activity fix — TypeScript lint and `git diff --check` passed on 2026-08-31.
- Organic-farm activity tab removal — TypeScript lint and `git diff --check` passed on 2026-08-31.
- Supermarket encoding fix — replacement-character scan found none; TypeScript lint and `git diff --check` passed on 2026-08-31.
- README language split — `npm.cmd run build`, `npm.cmd test` (8 passing), and `git diff --check` passed on 2026-08-19.
- Responsive navigation — visual QA passed at 390 px and 1440 px on 2026-08-18.
- PWA cache fix — `npm.cmd run build` and `npm.cmd test` passed after the v10 service-worker change on 2026-08-18.
- Agricultural inspection conversion — 28 records, ROC 108–114; zero reported malformed numeric, row-consistency, and pass-rate discrepancies.

## Notes for Next Session

Run `powershell -ExecutionPolicy Bypass -File .\init.ps1`, then continue only the active feature in `feature_list.json` unless the user changes priority.

## Policy 11 — 2026-10-24

- Implemented the user-requested evidence-supported MVP on `codex/food-hygiene-evidence-policy-11` in `.worktrees/policy-11`; feat-003 is deferred for this priority.
- Acquired five official CSVs and three catalogue HTML response bodies; sealed original byte hashes, dates, resource inventories and three unchanged historical project JSON editions separately.
- Reproducible content-addressed snapshot: 22,645 rows (673 published failed sample rows / 672 distinct documentary keys; 1,686 passing grading rows; 20,286 registrations). Failed sampling dates: 2022-01-04 through 2024-11-20. 600 candidate event groups are not verified unique events; batch and unique sample counts remain unknown.
- Added deterministic Mode A tiers, 5/10/all capacities, two strategies, six sensitivity scenarios and provenance-rich safe CSV/JSON. Mode B reports 35 unvalidated candidates and zero admitted associations; Mode C remains unavailable.
- Added a lazy bilingual responsive dashboard within existing Food & Products navigation; existing modules/data contracts preserved. PWA cache moved to v11 without precaching policy evidence.
- Verification: baseline init build + 8 tests passed; final source reproduction, lint, production build, 20 tests and diff check passed. Tamper tests reject altered original bytes and snapshot output. All 15 evidence file Git blobs preserve exact source bytes. Production browser exercised both languages, capacities, pagination reset, CSV download and identity gates; desktop 1440px/mobile 390px screenshots retained.
- Findings, source limitations, export format and verification are in `doc/POLICY_11_SOURCE_AUDIT.md` and `doc/POLICY_11_VERIFICATION.md`.
- Remaining evidence limits: no comparable inspection denominator; missing historical original CSVs/timestamps; no independent establishment validation. Approximately 17 MB snapshot loads only on demand; all-capacity CSV approximately 31 MB. Existing app bundle >500 kB warning remains.
- Delivery: exactly one review PR to main; do not automatically merge. Portfolio Case Study 011 must wait for actual merged source evidence.
- Policy 11 delivered as review PR #4: https://github.com/LEO0331/taipei-friendly-food-map/pull/4; base main, specified branch, no automatic merge. GitHub verification workflow started.

## Civic Explorer — 31 October 2026

- Isolated `codex/civic-explorer` worktree based on current main `ebed796`, including merged Policy 11.
- Shared typed catalogue retains four groups, all 14 tabs/defaults/labels; optional native dialog launcher owns open state and lazy-loads the separate four-group adapter and MIT-attributed generic HexHub.
- Baseline: init.ps1 build + 20 tests, TypeScript and Policy 11 integrity passed. Final: lint/build, 23 unit tests, Policy 11 immutable 22,645-record reproduction, 11 production-browser assertion groups, source-boundary check, Pages subpath smoke, zero-vulnerability audit and diff check passed.
- Filters/layers/district/keyword/service tags/user-location success and denial survive; map/marker nodes, selected-store popup and settled viewport remain unchanged with zero removed markers. First open only fetches optional JS/CSS; reopening has zero requests and no geolocation call.
- 316 original translation values, all datasets/converters/matching rules/module implementations/privacy/export/PWA/dependencies remain unchanged. No reference repo modifications.
- 1440px/390px/320px, both locales, native keyboard/focus containment/return, list fallback and reduced motion verified. Independent review fixes category announcement timing and narrow English header overflow; no remaining actionable findings.
- Main JS +3,208 B (+1,303 B gzip); main CSS +1,441 B (+367 B gzip). Optional JS+CSS 6,822 B / 2,518 B gzip. Existing >500kB main-bundle warning remains.
- Detailed architecture/mapping, screenshots, raw evidence, reproducible commands, limits and readiness: `doc/civic-explorer/README.md`. Deliver one Draft PR; do not merge automatically. Deferred feat-003 tests remain outside this scope.

- Draft PR created: https://github.com/LEO0331/taipei-friendly-food-map/pull/5 — open, draft, unmerged; branch `codex/civic-explorer` targets `main`.
