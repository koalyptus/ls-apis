# ls-apis

### Public API Discovery for Humans & Agents

A curated collection of **2,500+ public APIs** with a powerful CLI search tool. Discover, filter, and explore APIs by category, authentication type, and keywords.

## Features

- **Comprehensive Database** - 2,500+ APIs aggregated from multiple sources
- **Smart Search** - Filter by query, category, authentication type
- **Colored Output** - Syntax-highlighted results (use `--no-color` to disable)
- **Multiple Output Formats** - Text or JSON output
- **Extensible Architecture** - Pluggable fetchers for adding new API sources
- **TypeScript** - Fully typed for better developer experience

## Installation

```bash
# Clone the repository
git clone https://github.com/koalyptus/ls-apis.git
cd ls-apis

# Install dependencies
npm install
```

## Usage

### Global Installation

To use `ls-apis` as a global command, run:

```bash
npm link --workspace=packages/cli
```

This creates a symlink so you can run `ls-apis` from anywhere:

```bash
ls-apis -q weather
ls-apis -c data -a apiKey
```

### CLI Search

```bash
# Search by keyword
npm run ls-apis -- -q weather

# Filter by category
npm run ls-apis -- -c weather

# Filter by authentication type
npm run ls-apis -- -a apiKey

# Combine filters
npm run ls-apis -- -q weather -c data -a oauth

# Limit results
npm run ls-apis -- -q weather -l 10

# Output as JSON
npm run ls-apis -- -q weather -o json

# Sort by name
npm run ls-apis -- -q weather -s name

# List all categories
npm run ls-apis -- categories

# List categories sorted by count
npm run ls-apis -- categories --sort count

# List categories as JSON
npm run ls-apis -- categories --output json
```

### Commands

| Command      | Description                         |
| ------------ | ----------------------------------- |
| `categories` | List all API categories with counts |

#### Categories Options

| Flag       | Alias | Description                         |
| ---------- | ----- | ----------------------------------- |
| `--sort`   | `-s`  | Sort by: name (default), count      |
| `--output` | `-o`  | Output format: text (default), json |

### Options

| Flag         | Alias | Description                                 |
| ------------ | ----- | ------------------------------------------- |
| `--query`    | `-q`  | Search query (filters name, description)    |
| `--category` | `-c`  | Filter by category                          |
| `--auth`     | `-a`  | Filter by auth type (apiKey, OAuth, no)     |
| `--limit`    | `-l`  | Max results to show (default: 20)           |
| `--output`   | `-o`  | Output format: text or json (default: text) |
| `--sort`     | `-s`  | Sort results: name, category, auth          |
| `--no-color` |       | Disable colors in output                    |
| `--help`     | `-h`  | Show help                                   |
| `--version`  | `-V`  | Show version                                |

> **Note**: Colors are enabled by default. Use `--no-color` or set `NO_COLOR=1` environment variable to disable.

### Configuration File

A config file is automatically created at `~/.ls-apis` on first run. You can edit it to set personal defaults. CLI flags always override config values.

**Location**: `~/.ls-apis` (your home directory)

```json
{
  "limit": 10,
  "descriptionMaxLength": 150,
  "colors": true
}
```

| Key                    | Default | Description                 |
| ---------------------- | ------- | --------------------------- |
| `limit`                | 20      | Default max results         |
| `descriptionMaxLength` | 250     | Max chars before truncation |
| `colors`               | true    | Enable terminal colors      |

The config file is plain JSON. Edit it manually to customize defaults, or delete it to regenerate with built-in values. Uses only Node.js standard library (`os`, `path`, `fs/promises`).

### Example Output

```
Found 2 APIs:
  Weather API
    Description: Get real-time weather data for any location...
    Link: https://api.weather.example.com
    Auth: apiKey
    Categories: weather, data
    Sources: apis-guru

  Weather2 API
    Description: Comprehensive weather forecasting service...
    Link: https://api.weather2.example.com
    Auth: OAuth
    Categories: weather, forecast
    Sources: publicapis-dev
```

## Project Structure

```
ls-apis/
├── README.md              # This file
├── package.json           # Root workspace config
├── data/
│   └── apis.json          # Aggregated API data (2520+ APIs)
├── packages/
│   ├── aggregator/        # Fetches, normalizes, deduplicates APIs
│   │   ├── src/
│   │   │   ├── aggregate.ts       # Main orchestration
│   │   │   ├── sources/           # Pluggable fetchers (*.fetcher.ts)
│   │   │   │   ├── index.ts       # Fetcher loader
│   │   │   │   └── tests/         # Fetcher tests
│   │   │   ├── tests/             # Aggregator tests
│   │   │   └── types.ts           # ApiEntry, SourceFetcher interfaces
│   │   └── vitest.config.ts
│   └── cli/               # CLI for searching APIs
│       ├── src/
│       │   ├── index.ts           # CLI entry point
│       │   └── colors.ts          # Terminal color support
│       └── tests/
└── AGENTS.md              # Instructions for AI agents
```

## Scripts

```bash
# Fetch all sources → dedupe → update data/apis.json
npm run aggregate

# Run tests with coverage
npm test

# Typecheck all workspaces
npm run typecheck

# Lint & format
npm run lint
npm run format

# Run CLI directly
npm run ls-apis -- -q <query>
```

## Data Schema

Each API entry in `data/apis.json` follows this structure:

```typescript
interface ApiEntry {
  name: string;
  description?: string;
  link: string;
  auth?: string; // apiKey, OAuth, etc.
  cors?: string;
  categories: string[];
  openapiSpec?: string; // OpenAPI spec URL if available
  sources: string[]; // Which fetchers found this API
}
```

## Adding a New API Source

1. Create a new fetcher in `packages/aggregator/src/sources/`:

   ```bash
   touch packages/aggregator/src/sources/mysource.fetcher.ts
   ```

2. Implement the `SourceFetcher` interface:

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

3. Run the aggregator to fetch and update:
   ```bash
   npm run aggregate
   ```

Fetchers are auto-loaded via `loadAllFetchers()` in `sources/index.ts`.

## Testing

Tests use Vitest with v8 coverage:

```bash
# Run all tests
npm test

# Run specific package tests
npm run test:aggregator
npm run test:cli

# Watch mode
cd packages/cli && npm run test:watch
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- API data aggregated from multiple public sources
- Built with TypeScript, Node.js, and vitest
- Terminal colors powered by chalk
