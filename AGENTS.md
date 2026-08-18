# Agent Guide

Taipei Friendly Food Map is a Vite + React + TypeScript PWA that combines Taipei public-data map layers with non-geographic food-information dashboards.

## Startup Workflow

1. Confirm the working directory with `Get-Location`.
2. Read this file, `feature_list.json`, `progress.md`, and `session-handoff.md`.
3. Run `powershell -ExecutionPolicy Bypass -File .\init.ps1` (or `./init.sh` from Bash) before editing when the baseline has not been verified in this session.
4. Review `README.md` and the relevant source/data-conversion files for the active feature.

## Working Rules

- **One feature at a time:** Work on one active feature from `feature_list.json` at a time.
- **Stay in scope:** Do not modify files unrelated to that active feature.
- Treat `data/raw/` as source input, `scripts/` as the reproducible conversion layer, and `public/data/` as generated application data.
- Keep geographic datasets in map/directory experiences and aggregate statistical datasets in dedicated dashboards. Do not infer store-level conclusions from city-level statistics.
- Preserve source data; normalize or validate it in conversion scripts, never by silently changing raw values.
- Do not add dependencies or substantially redesign navigation without an explicit requirement.
- Before claiming completion, run `npm.cmd run build`, `npm.cmd test`, and `git diff --check`; record evidence in `progress.md`.

## Data Refresh

For a public-data module, run its matching `data:fetch:*` command followed by its `data:convert:*` command. Review the generated JSON for record count, date coverage, and data-quality flags. Record the source URL/update time and local refresh time in the UI when available.

## Definition of Done

- Target behavior is implemented and stays within the selected feature.
- Conversion/data integrity checks and automated verification pass.
- `feature_list.json`, `progress.md`, and `session-handoff.md` reflect the resulting state, evidence, and next step.
- The next session can start from the documented verification command without relying on chat history.

## End of Session

1. Update the state and handoff artifacts.
2. Record unresolved risks and exact verification evidence.
3. Leave generated data reproducible and the working tree understandable.
