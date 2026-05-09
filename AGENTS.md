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
- **Interface**: implements `SourceFetcher` (name + sourceUrl + fetchApis())
- **Auto-loading**: via `loadAllFetchers()` in `sources/index.ts`
- **CLI colors**: `src/colors.ts` handles terminal coloring with chalk, respects `NO_COLOR` env and `--no-color` flag

## Data Schema

```typescript
interface DataFile {
  timestamp: string; // ISO 8601 UTC timestamp of processing
  providers: Provider[]; // Data source providers
  apis: ApiEntry[]; // Aggregated API entries
}

interface Provider {
  name: string; // Provider identifier (e.g., 'apis-guru')
  url: string; // Data source URL
}

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
     sourceUrl: 'https://example.com/api',
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
| `--limit`    | `-l`  | Max results (from config or default: 20) |
| `--output`   | `-o`  | Output format: text or json              |
| `--sort`     | `-s`  | Sort results: name, category, auth       |
| `--no-color` |       | Disable colored output                   |
| `--help`     | `-h`  | Show help                                |
| `--version`  | `-V`  | Show version                             |

## CLI Commands

| Command      | Description                         |
| ------------ | ----------------------------------- |
| `categories` | List all API categories with counts |
| `providers`  | List all data providers             |

### Categories Options

| Flag       | Alias | Description                         |
| ---------- | ----- | ----------------------------------- |
| `--sort`   | `-s`  | Sort by: name (default), count      |
| `--output` | `-o`  | Output format: text (default), json |

### Providers Options

| Flag       | Alias | Description                         |
| ---------- | ----- | ----------------------------------- |
| `--sort`   | `-s`  | Sort by: name (default), count      |
| `--output` | `-o`  | Output format: text (default), json |

## Config File

`~/.ls-apis` (JSON) is created automatically on first CLI run. Edit it to customize defaults. CLI flags always override.

**Location**: `~/.ls-apis` (user's home directory)

```json
{
  "limit": 10,
  "descriptionMaxLength": 250,
  "colors": true
}
```

| Key                    | Default | Description                 |
| ---------------------- | ------- | --------------------------- |
| `limit`                | 20      | Default max results         |
| `descriptionMaxLength` | 250     | Max chars before truncation |
| `colors`               | true    | Enable terminal colors      |

Uses only Node.js stdlib (`os.homedir()`, `fs/promises`). Missing or invalid file falls back to built-in defaults.
