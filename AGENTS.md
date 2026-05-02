# ls-apis

## Project Structure

```
ls-apis/
├── package.json          # root (workspaces)
├── data/apis.json       # aggregated API data (2520 APIs)
├── packages/
│   ├── aggregator/      # fetches, normalizes, deduplicates
│   │   ├── src/
│   │   │   ├── aggregate.ts      # main orchestration
│   │   │   ├── sources/          # pluggable fetchers (*.fetcher.ts)
│   │   │   └── types.ts          # ApiEntry, SourceFetcher interfaces
│   │   └── tests/
│   └── cli/            # CLI for searching APIs
│       └── src/index.ts
```

## Commands

```bash
# Install deps
npm install

# Run aggregator (fetch all sources → dedupe → data/apis.json)
cd packages/aggregator && npm run aggregate

# Test
cd packages/aggregator && npm run test

# Lint & format
npm run lint
npm run format

# CLI search
cd packages/cli && npx tsx src/index.ts -q <query>
npx tsx src/index.ts -c <category>
npx tsx src/index.ts -a <auth>
```

## Architecture

- **Fetchers**: `*.fetcher.ts` files in `packages/aggregator/src/sources/`
- **Naming convention**: must end with `.fetcher.ts`
- **Interface**: implements `SourceFetcher` (name + fetchApis())
- Auto-loaded via `loadAllFetchers()` in `sources/index.ts`

## Data Schema

```typescript
interface ApiEntry {
  name: string;
  description?: string;
  link: string;
  auth?: string;
  https?: boolean;
  cors?: string;
  categories: string[];
  openapiSpec?: string;
  sources: string[];
}
```

## Adding a New Source

1. Create `packages/aggregator/src/sources/<name>.fetcher.ts`
2. Implement `SourceFetcher` interface
3. Tests go in `packages/aggregator/src/sources/tests/`
4. Run `npm run aggregate` to fetch and update `data/apis.json`
