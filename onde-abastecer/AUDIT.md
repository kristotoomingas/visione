# Audit and execution ledger — 2026-11-07

## Repository evidence

- Public repo: https://github.com/pedropzz103-tech/visione. Default main observed `f94538f8a6be61217fbb277772d6eb1a1adc92dd`.
- PR #23: open, draft, mergeable at inspection; head `feature/onde-abastecer-mvp` at `e5aadaf5f901bc187af08814f73dbbb8b05966c8`. 34 historical commits, 24 added files, 1567 lines. Historical API/mobile/site runs reported success on that head.
- No `feature/onde-abastecer` branch returned by branch inspection. No AGENTS.md, package locks, lint or unit/integration tests in the fuel module.
- Current main is a multi-product/static VISIONE repo and does not contain Onde Abastecer. Imported MVP using a merge on a new branch from current main: historical code and all unrelated main work preserved.
- Reused: Expo 57, RN 0.86.3, React 19.2.3, native maps, location/navigation flow, country registry, ES JSON, FR ZIP/XML, IT CSV adapters, relative pricing and existing workflows.

## Baseline commands/results

Environment: Linux, Node 24.22.1, npm 11.9.0. Installed existing API and mobile dependencies successfully with `npm install --ignore-scripts` (49 / 474 packages). Generated locks.

- API `npm run typecheck`: PASS.
- API `npm exec wrangler deploy -- --dry-run --outdir /workspace/scratch/onde-api-baseline`: PASS; 176.49 KiB, no bindings, no deployment.
- Mobile `npm run typecheck`: PASS.
- `npm exec expo-doctor@latest`: 19/21 checks pass; two remote checks fail (Expo schema connection refused; React Native Directory unexpected response). No claim of native device validation.
- No baseline lint, test or mobile build scripts existed. Added checks will be reported separately.

## Defects found by tracing code

P0: ES shares a positive-only decimal parser between prices and coordinates, dropping most western stations. Missing lat/lng becomes Number(null)=0. Latitude/longitude range and methods are not validated. Missing API URL silently activates hardcoded demo prices. FR XML is ISO-8859-1 but is decoded as UTF-8; E10 is silently merged with SP95 and cheaper prices hide compatibility. IT premium marketing names imply octane incorrectly and self/served distinctions disappear. Raw upstream errors are returned publicly. No timeout, snapshot dedup, fixture tests, offline signalling or request race control. Equal prices rank as expensive. Old workflow can deploy on push.

P1: map exists but no list/search/manual coordinates/clusters/preferences/favourites/accessible control roles; timestamp/unit missing in detail; location requested at launch; savings function is not connected to UI and trusts unvalidated detour/currency assumptions.

## Independent source probes (not CI fixtures)

At approximately 10:39–10:41 UTC:
- ES official REST: HTTP 200, 12,202,256 bytes, 11,477 rows; `Fecha=07/11/2026 11:39:46` (source local time). Negative longitudes confirmed in real rows.
- FR official instantane ZIP: HTTP 200, 981,541 bytes; contains ISO-8859-1 XML, decimal EUR/L values and source-local timestamps. Official open-data page explicitly says Open Licence and <10-minute feed refresh; station price ages vary.
- IT dataset page and both historical direct CSV URLs: HTTP 503. Adapter implementation is not evidence of current coverage.
- PT homepage: HTTP 200. Explicit notice permits free reuse with DGEG attribution, last-price-update datetime and faithful reproduction; generic copyright footer must not be mistaken for the specific data notice. Search endpoint HTTP 200 with coordinates/currency/update fields. Initial pagination parameters returned 50 rows despite requested 10: needs exact client parameter verification before enabling.
- ES initial notice URL redirected to a 404 page despite HTTP 200; corrected official notice URL retrieved and requires attribution, no implied endorsement and metadata preservation.

## Execution decisions

- Preserve independent app package installs; add a small check runner under onde-abastecer rather than restructure VISIONE.
- No deployment/merge. New feature branch and draft PR only; PR #23 retained.
- Source outages are explicit and do not trigger fabricated data. Implemented adapters and source probes are reported separately from deployment and native QA.
- Additional categories remain unavailable until permitted datasets exist. No paid service or required OpenAI API.

Further test results, review and remaining blockers are appended as work progresses.
