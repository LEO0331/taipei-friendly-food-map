# Session Handoff

## Current objective and delivery

Policy 11 evidence-supported documentary review MVP is implemented on `codex/food-hygiene-evidence-policy-11`, based on main at `0d208e2`. The implementation checkout is `.worktrees/policy-11`. Open exactly one review PR to `LEO0331/taipei-friendly-food-map/main`; do not merge automatically. Portfolio Case Study 011 is deferred until actual merged evidence exists.

## Implemented

- Exact official CSV and catalogue HTML acquisition, byte hashes/timestamps, complete resource inventory, unchanged retained project JSON editions, and content-addressed immutable snapshot with offline reproduction.
- Snapshot `policy-11-1916319270a865f57805f618267c58be38e7b2f39b8ef6af2f8dfd0ac40ecefd`: 22,645 records. Failed cohort 673 published rows / 672 distinct keys; dates 2022-01-04–2024-11-20; 600 candidate event groups. Grading 1,686 passing rows; registry 20,286 rows.
- Deterministic Mode A tiers, capacities 5/10/all, evidence-first/balanced source queues within tiers, actual IDs, sensitivity and CSV/JSON exports.
- Mode B conservative identity engine and coverage/exclusions: 35 unvalidated candidates, zero independently validated associations. Mode C unavailable.
- Lazy English/Traditional Chinese dashboard, responsive controls, provenance/limitations, v11 PWA shell. Existing source contracts and public-data JSON remain unchanged.
- Audit/verification docs and PR validation workflow. No new dependencies.

## Verification evidence — 24 October 2026

- Baseline `powershell -ExecutionPolicy Bypass -File .\init.ps1`: build + original 8 tests passed.
- `npm.cmd run policy11:verify`: exact immutable reproduction and original/retained hashes pass offline.
- `npm.cmd test`: 20 pass, including added-schema drift, raw-byte/snapshot tamper rejection, ambiguous joins, source namespaces, capacities, sensitivity, CSV injection and all 22,645 CSV IDs.
- `npm.cmd run lint`, `npm.cmd run build`, `git diff --check`: pass.
- All 15 evidence files preserve exact bytes in staged Git blobs; `.gitattributes` disables text normalization and collapses generated evidence in GitHub review.
- Production preview verified both languages, 5/10/all, balanced strategy, pagination reset, actual CSV download with one BOM, and Mode B/C gates.
- Desktop 1440px / mobile 390px screenshots: `doc/policy-11/`. Mobile document does not overflow its viewport.

## Risks and boundaries

Historical raw CSV bytes/retrieval timestamps are unavailable. Failed-only data has no comparable denominator. Published names/addresses cannot independently validate an establishment. Mode B remains closed until authoritative independent evidence is retained and reviewed. Mode C cannot infer current risk. The lazy snapshot is ~17 MB and all-capacity CSV ~31 MB; original app bundle >500 kB warning remains. See `doc/POLICY_11_SOURCE_AUDIT.md` and `doc/POLICY_11_VERIFICATION.md`.

## Next startup

1. Use this implementation worktree; read AGENTS.md, feature_list.json, progress.md and this handoff.
2. Run `npm.cmd ci` if needed, then `npm.cmd run policy11:verify`, `npm.cmd run lint`, `npm.cmd test`, `npm.cmd run build`, `git diff --check`.
3. Review the single Policy 11 PR and CI. Do not merge automatically. Any Case Study 011 must reference the eventual merged commit and its actual evidence.
4. Resume deferred feat-003 agricultural-inspection tests only after this review scope is explicitly complete.