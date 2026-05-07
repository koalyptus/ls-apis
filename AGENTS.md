# ls-apis

## Project Structure

```
ls-apis/
├── package.json           # root (workspaces)
├── data/apis.json         # aggregated API data (2520 APIs)
├── packages/
│   ├── aggregator/        # fetches, normalizes, deduplicates
│   │   ├── src/
│   │   │   ├── aggregate.ts       # main orchestration
│   │   │   ├── sources/           # pluggable fetchers (*.fetcher.ts)
│   │   │   │   ├── index.ts       # fetcher auto-loader
│   │   │   │   └── tests/         # fetcher-specific tests
│   │   │   ├── tests/             # aggregator tests
│   │   │   └── types.ts           # ApiEntry, SourceFetcher interfaces
│   │   └── vitest.config.ts
│   └── cli/               # CLI for searching APIs
│       ├── src/
│       │   ├── index.ts           # CLI entry point
│       │   └── colors.ts          # terminal color support
│       └── tests/
└── AGENTS.md              # instructions for AI agents
```

## Commands

```bash
# Install deps
npm install

# Run aggregator (fetch all sources → dedupe → data/apis.json)
npm run aggregate

# Run tests with coverage (both aggregator + cli)
npm test

# Run specific package tests
npm run test:aggregator
npm run test:cli

# Typecheck all workspaces
npm run typecheck

# Lint & format
npm run lint
npm run format
npm run format:fix

# CLI search (via npm script)
npm run ls-apis -- -q <query>
npm run ls-apis -- -c <category>
npm run ls-apis -- -a <auth>

# CLI search (via npx, from workspace root)
npx tsx packages/cli/src/index.ts -q <query>

# CLI search (globally, after npm link)
npm link --workspace=packages/cli
ls-apis -q <query>
```

## Architecture

- **Fetchers**: `*.fetcher.ts` files in `packages/aggregator/src/sources/`
- **Naming convention**: must end with `.fetcher.ts`
- **Interface**: implements `SourceFetcher` (name + fetchApis())
- **Auto-loading**: via `loadAllFetchers()` in `sources/index.ts`
- **CLI colors**: `src/colors.ts` handles terminal coloring with chalk, respects `NO_COLOR` env and `--no-color` flag

## Data Schema

```typescript
interface ApiEntry {
  name: string;
  description?: string;
  link: string;
  auth?: string;
  cors?: string;
  categories: string[];
  openapiSpec?: string;
  sources: string[];
}
```

## Adding a New Source

1. Create `packages/aggregator/src/sources/<name>.fetcher.ts`
2. Implement `SourceFetcher` interface:

   ```typescript
   import type { SourceFetcher, ApiEntry } from '../types';

   export const mysourceFetcher: SourceFetcher = {
     name: 'mysource',
     fetchApis: async (): Promise<ApiEntry[]> => {
       // Fetch and normalize APIs from your source
       return [
         /* ApiEntry items */
       ];
     },
   };
   ```

3. Tests go in `packages/aggregator/src/sources/tests/<name>.test.ts`
4. Run `npm run aggregate` to fetch and update `data/apis.json`

## CLI Options

| Flag         | Alias | Description                              |
| ------------ | ----- | ---------------------------------------- |
| `--query`    | `-q`  | Search query (filters name, description) |
| `--category` | `-c`  | Filter by category                       |
| `--auth`     | `-a`  | Filter by auth (apiKey, OAuth, no)       |
| `--limit`    | `-l`  | Max results (default: 20)                |
| `--output`   | `-o`  | Output format: text or json              |
| `--no-color` |       | Disable colored output                   |
| `--help`     | `-h`  | Show help                                |
| `--version`  | `-V`  | Show version                             |
