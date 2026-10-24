# Policy 11: official food-hygiene evidence feasibility audit

Evidence acquired 24 October 2026 (Asia/Taipei). This is documentary decision support for allocating investigation capacity. It is not a food-safety prediction, establishment hazard score or finding about present business conditions.

## Reproducible evidence

`public/data/policy-11/evidence/` retains the exact five official CSV response bodies and three official catalogue HTML response bodies. `acquisition.json` records original-byte SHA-256, byte length, requested URL, actual local retrieval timestamp, content type, HTTP Date and Last-Modified (null when absent). `retained/` separately preserves the three pre-existing project JSON editions, byte-for-byte; `retained-manifest.json` seals their hashes. Their historical original CSV bytes and historical retrieval timestamps were not retained in the Git checkout, so neither is reconstructed or implied by these transformed-JSON hashes. Existing module JSON files and contracts are unchanged.

The module loads `manifest.json`, then its content-addressed snapshot file. The manifest supplies full SHA-256 and byte length. Snapshot generation uses the retained evidence acquisition time, not the build clock. No network is involved in reproduction:

```powershell
npx.cmd tsx scripts/buildPolicy11Evidence.ts --check
```

This verifies every original body against acquisition hashes, every retained JSON against its sealed manifest, complete catalogue resource inventory, expected CSV columns, deterministic snapshot bytes and manifest. To reproduce outputs after intentionally changing the builder, run without `--check`. Acquisition is separate: `node scripts/fetchPolicy11Evidence.mjs`. Acquisition refuses existing sealed evidence; preserve this edition and select a separate evidence directory before a future refresh. Never refresh historical bytes in place. No new dependency is required.

## Official source editions and temporal interpretation

| Source | Official catalogue metadata update | Resource publication update | Observation dates in CSV |
|---|---|---|---|
| [Failed food samples](https://data.taipei/dataset/detail?id=09a917a0-0fb5-47e1-957c-5f1268fba517) | 2026-07-14 10:44:49 +08:00 | ROC 113: 2025-12-16 10:22:17; ROC 112: 10:22:01; ROC 111: 10:21:49 | 2022-01-04 to 2024-11-20 |
| [Passing hygiene grading establishments](https://data.taipei/dataset/detail?id=59579c19-a561-4564-8c0f-545bfb32c0f6) | 2026-07-15 09:33:57 +08:00 | 2025-12-19 13:53:20 +08:00 | No assessment-date field |
| [Registered businesses including restaurant activity](https://data.taipei/dataset/detail?id=178abc4e-fe32-4fc9-af3a-7baf1c15082c) | 2026-09-23 16:00:04 +08:00 | 2026-09-23 15:59:54 +08:00 | No establishment operating/inspection-date field |

Resource times above are Taipei local time. Machine fields include explicit offsets. The captured failed catalogue publishes exactly ROC 111, 112 and 113 editions; there are no ROC 114/115 resource links in that captured catalogue. The builder checks its complete resource-link inventory against acquisition. Catalogue advertised coverage ends 2026-07-14; it is not the latest inspection date. Its advertised start 2022-03-26 is also later than the earliest actual CSV sampling date. Both discrepancies require documentary interpretation, not silent date substitution.

The failed dataset UUID `09a917a0-0fb5-47e1-957c-5f1268fba517` is the catalogue identifier; `3fc106cb-c8aa-4f74-8dbc-3272c7ffcae0`, `bb347e3d-626a-46e5-bb96-9061e8d08c26` and `bc24a40f-5687-4338-8f9a-449de248ab93` are distinct annual resource identifiers. The existing fetcher IDs match all three actual official download links. A catalogue UUID and resource UUID must not be compared as if they identify the same object.

## Sample, event and batch validation

The acquired failed CSVs contain **673 published sample rows and 672 distinct normalized documentary row keys**. All 672 retained project row keys remain present. The existing converter intentionally deduplicated one repeated publication row. Policy 11 preserves both published occurrences, assigns a stable duplicate suffix, retains the original project record ID and flags the duplicate. It does not call 673 independently validated unique samples.

The documentary key is sampling date + product name + sampling location + result + noncompliance reason, with whitespace normalized. This replicates the existing converter's deduplication boundary. It is not an official sample identifier. A product name can recur, and multiple analyte failures in one reason cell remain one published row.

Exact sampling date + published sampling location + project produces **600 candidate event groups**, including **64 groups with multiple published rows**. These are reproducible candidate document bundles, not 600 verified inspections. The CSV publishes no unique sample ID, inspection-event ID, batch/lot ID or comparable inspection-universe denominator. Verified unique sample, event and batch counts are therefore null/unavailable. No total-inspection rate, citywide failure rate, batch failure rate, repeated-offender score or establishment risk is computed. Sampling location may identify a seller; a product finding must not be transferred to a manufacturer, restaurant or registry business without independent documentary evidence.

## Passing grading and business registry validation

The current grading resource has **1,686 published passing rows**, all matching the retained edition on food-business ID + trade name + address + grade. Published results are 優 and 良. It has five fields and no assessment date. A missing registry business in this passing-only list is unobserved here, never a failure or evidence that it was assessed.

The registry has **20,286 current rows**, compared with **20,182 retained rows**. The identifier + registered name + address comparison finds **19,258 unchanged keys**, **924 retained-only keys** and **1,028 current-only keys**. Differences can reflect amendments, additions, removals or source correction; no opening, closing or hygiene conclusion follows. Coordinate changes are deliberately excluded from this identity-key comparison and not interpreted as identity evidence. Original coordinates remain in the retained official CSV for audit, but the policy records do not invent or transfer them.

The registry catalogue explicitly states that registration includes activity code F501060, while actual operation depends on on-site conditions. It is not a census of verified operating restaurants and cannot serve as the denominator for sample failure rates or grading pass rates.

## Field definitions and identity boundaries

Every expected official CSV field has a documentary definition in `snapshot.sources[].fieldDefinitions`; unexpected schemas fail reproduction. Failed fields represent project, sampling date, product category, sampled product label, postal district, sampling location, result and reason. Grading fields represent administrative code, trade name, food-business registration ID, address and passing result. Registry fields represent company/business registration number, registered name/address and published coordinates.

Company/business registration identifiers are stored as source strings in their own namespace, including any unpadded values. Food-business IDs such as `A-154060356-00002-9` are a separate namespace. Do not strip their embedded digits into company IDs. Trade name, legal registered name, registered address and operating establishment remain distinct. Co-location, a shared company number or similar trade names alone cannot validate physical-establishment identity. Failed product rows are excluded from automatic establishment associations. Exact name/address equality may generate documentary candidates; independent authoritative evidence is required to validate one. With no such validation supplied in this MVP, Mode B has zero validated associations and transparently reports unresolved/excluded records. Mode C remains unavailable.

## Decision-support and presentation limits

Mode A tiers prioritize source-edition changes, missing documentation and unresolved identity for human verification. They do not rank food hazards. The selected IDs, source editions, original-byte hashes, reasons, capacity, strategy and strategy/capacity sensitivity are exportable. Stable ties are deterministic. Administratively balanced selection changes source coverage only within a documentary tier; it does not imply a statistical risk model.

The public view emphasizes the decision problem, engineering controls, measured edition findings and limits. Administrative PR details, agent handoffs and anticipated portfolio findings are not public-dashboard evidence. Portfolio Case Study 011 must wait for merged source evidence.

## Export format and operational limits

JSON includes the complete snapshot, selected records and IDs, parameters, every sensitivity scenario and identity exclusions. CSV emits one row per selected record with its edition hash, source URL, dates and full `recordEvidence`. The first row's `snapshotProvenance` contains `csvMetadataSchema: policy11-csv-metadata-v1` and every snapshot field except the record collection; subsequent rows contain `csvMetadataReference` pointing to that same snapshot ID. This preserves the complete provenance once without repeating it tens of thousands of times. CSV begins with one UTF-8 BOM, quotes every cell and neutralizes spreadsheet formula prefixes. The all-capacity CSV is approximately 31 MB; the snapshot is approximately 17 MB and loads only after opening this module.

`.gitattributes` disables text normalization for the policy evidence directory so the original-byte and generated hashes survive Windows/Linux checkouts. Hashes provide byte integrity and reproducibility, not independent proof of a publication's factual correctness. The original official URLs and captured catalogue pages remain the authority for documentary interpretation.
