# ROADMAP.md

## 1. Add `mixedanalytics` Fetcher — Free No-Auth API List

### Context

[Mixed Analytics](https://mixedanalytics.com/blog/list-actually-free-open-no-auth-needed-apis/) publishes a curated list of 224 free, open public APIs that require no authentication. This is a high-value data source: each entry includes a name, description, category, documentation link, and sample URL — all explicitly no-auth. Adding it as a new fetcher increases dataset coverage with minimal normalization overhead.

### Source Analysis

- **URL**: `https://mixedanalytics.com/blog/list-actually-free-open-no-auth-needed-apis/`
- **Structure**: Single HTML `<table id="myTable">` with 224 data rows, 5 columns: `#`, `CATEGORY`, `API NAME`, `DESCRIPTION`, `SAMPLE URL`
- **API NAME column**: Contains `<a href="DOCLINK">API Name</a>` (some rows have a double-link WordPress artifact — empty first `<a>` then a second `<a>` with text)
- **CATEGORY column**: Plain text (e.g., "Art & Images", "Crypto & Finance")
- **Key characteristic**: All APIs are explicitly no-auth — set `auth: 'no'` on every entry

### Phase 1: Fetcher Implementation

**File**: `packages/aggregator/src/sources/mixedanalytics.fetcher.ts`

- Uses `axios` to fetch the page HTML (consistent with `apis-guru` and `publicapis-dev` fetchers)
- Uses `cheerio` to parse the HTML table (already a dependency)
- Maps each `<tr>` to `ApiEntry`:
  - `name`: text from API NAME column (last `<a>` with non-empty text)
  - `link`: `href` from that same `<a>` (documentation URL)
  - `description`: text from DESCRIPTION column
  - `auth`: `'no'` (all entries are explicitly no-auth)
  - `cors`: `null` (not provided by source)
  - `categories`: single-element array from CATEGORY column (normalizer handles Title-Case & `&` → `&`)
  - `openapiSpec`: `null`
  - `sources`: `[fetcher.name]`
- Skips rows where the link is missing or not a valid HTTP(S) URL
- Follows `github-public-apis.fetcher.ts` pattern (axios + cheerio)

### Phase 2: Tests

**File**: `packages/aggregator/src/sources/tests/mixedanalytics.test.ts`

- Mocks `axios` with a representative HTML table string (8–10 rows covering all categories, the double-link quirk, edge cases)
- Tests: basic fetch & parse, correct field mapping, `auth` set to `'no'`, category extraction, skip rows with invalid links, empty table handling

### Phase 3: Verification

1. `npm run test:aggregator` — all tests pass
2. `npm run typecheck` — no type errors
3. `npm run aggregate` (optional, manual) — fetcher works end-to-end

### Files

| File                                                           | Action     |
| -------------------------------------------------------------- | ---------- |
| `packages/aggregator/src/sources/mixedanalytics.fetcher.ts`    | **Create** |
| `packages/aggregator/src/sources/tests/mixedanalytics.test.ts` | **Create** |

No modifications to existing files — the auto-loader (`sources/index.ts`) picks up `*.fetcher.ts` files automatically.
