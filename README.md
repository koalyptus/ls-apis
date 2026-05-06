# ls-apis

### Public API Discovery for Humans & Agents

A curated collection of **2,500+ public APIs** with a powerful CLI search tool. Discover, filter, and explore APIs by category, authentication type, and keywords.

## Features

- **Comprehensive Database** - 2,500+ APIs aggregated from multiple sources
- **Smart Search** - Filter by query, category, authentication type
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
npx tsx packages/cli/src/index.ts -q weather

# Filter by category
npx tsx packages/cli/src/index.ts -c weather

# Filter by authentication type
npx tsx packages/cli/src/index.ts -a apiKey

# Combine filters
npx tsx packages/cli/src/index.ts -q weather -c data -a oauth

# Limit results
npx tsx packages/cli/src/index.ts -q weather -l 10

# Output as JSON
npx tsx packages/cli/src/index.ts -q weather -o json
```

### Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--query` | `-q` | Search query (filters name, description) |
| `--category` | `-c` | Filter by category |
| `--auth` | `-a` | Filter by auth type (apiKey, OAuth, no) |
| `--limit` | `-l` | Max results to show (default: 20) |
| `--output` | `-o` | Output format: text or json (default: text) |
| `--help` | `-h` | Show help |
| `--version` | `-V` | Show version |

## Project Structure

```
ls-apis/
├── README.md              # This file
├── package.json           # Root workspace config
├── data/
│   └── apis.json         # Aggregated API data (2520+ APIs)
├── packages/
│   ├── aggregator/        # Fetches, normalizes, deduplicates APIs
│   │   ├── src/
│   │   │   ├── aggregate.ts      # Main orchestration
│   │   │   ├── sources/          # Pluggable fetchers (*.fetcher.ts)
│   │   │   └── types.ts         # ApiEntry, SourceFetcher interfaces
│   │   └── tests/
│   └── cli/              # CLI for searching APIs
│       ├── src/
│       │   └── index.ts         # CLI entry point
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
  auth?: string;        // apiKey, OAuth, etc.
  https?: boolean;
  cors?: string;
  categories: string[];
  openapiSpec?: string;  // OpenAPI spec URL if available
  sources: string[];     // Which fetchers found this API
}
```

## Adding a New API Source

1. Create a new fetcher in `packages/aggregator/src/sources/`:
   ```bash
   touch packages/aggregator/src/sources/mysource.fetcher.ts
   ```

2. Implement the `SourceFetcher` interface:
   ```typescript
   import { SourceFetcher, ApiEntry } from '../types';

   export class MySourceFetcher implements SourceFetcher {
     name = 'mysource';

     async fetchApis(): Promise<ApiEntry[]> {
       // Fetch and normalize APIs from your source
       return [/* ApiEntry items */];
     }
   }
   ```

3. Run the aggregator to fetch and update:
   ```bash
   npm run aggregate
   ```

Fetchers are auto-loaded via `loadAllFetchers()` in `sources/index.ts`.

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
