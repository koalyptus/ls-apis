# ls-apis

### Public APIs Discovery for Humans & Agents

A curated collection of **4,000+ public APIs** with a powerful CLI search tool. Discover, filter, and explore APIs by category, authentication type.

## MCP Server

ls-apis includes an [MCP](https://modelcontextprotocol.io) server for AI assistants to search and discover public APIs via natural language.

### Tools

| Tool              | Description                                                 |
| ----------------- | ----------------------------------------------------------- |
| `search-apis`     | Search public APIs by query, category, auth type, and limit |
| `list-categories` | List all API categories with API counts                     |
| `list-providers`  | List all data providers with API counts                     |

### Resources

| URI                 | Description                           |
| ------------------- | ------------------------------------- |
| `apis://data`       | Full aggregated API dataset (JSON)    |
| `apis://categories` | All API categories with counts (JSON) |
| `apis://providers`  | All data providers with counts (JSON) |
| `apis://stats`      | Dataset summary statistics (JSON)     |

### Setup

```bash
npm install
```

### Configuration

#### VS Code / GitHub Copilot

Create `.vscode/mcp.json` in your project root:

> VS Code will ask for permission on first run — this is standard for project-local MCP servers. Approve once and it won't prompt again.

```json
{
  "servers": {
    "ls-apis": {
      "command": "npx",
      "args": ["tsx", "packages/mcp-server/src/index.ts"],
      "cwd": "/path/to/ls-apis"
    }
  }
}
```

> Switch Copilot Chat to **Agent mode** to use MCP tools.

#### Claude Desktop

Edit `claude_desktop_config.json` (`%APPDATA%\Claude\` on Windows, `~/Library/Application Support/Claude/` on macOS):

```json
{
  "mcpServers": {
    "ls-apis": {
      "command": "npx",
      "args": ["tsx", "packages/mcp-server/src/index.ts"],
      "cwd": "/path/to/ls-apis"
    }
  }
}
```

#### Cursor

Create `.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (global):

```json
{
  "mcpServers": {
    "ls-apis": {
      "command": "npx",
      "args": ["tsx", "packages/mcp-server/src/index.ts"],
      "cwd": "/path/to/ls-apis"
    }
  }
}
```

### Verification

After configuring, the client should discover the tools and resources listed above. You can also test via CLI:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm run mcp
```

## Features

- **Comprehensive Dataset** - 4,000+ APIs aggregated from multiple sources
- **Smart Search** - Filter by query, category, authentication type
- **Colored Output** - Syntax-highlighted results (use `--no-color` to disable)
- **Multiple Output Formats** - Text or JSON output
- **MCP Server** - AI-friendly API search via Model Context Protocol
- **Extensible Architecture** - Pluggable fetchers for adding new API sources
- **TypeScript** - Fully typed for better developer experience

## Installation

```bash
git clone https://github.com/koalyptus/ls-apis.git
cd ls-apis
npm install
```

### Quick Start

```bash
npm install -g @ls-apis/cli
ls-apis -q weather
```

### Via npm link (local development)

```bash
npm link --workspace=@ls-apis/cli
ls-apis -q weather
```

## Usage

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
| `providers`  | List all data providers             |
| `config`     | Show config settings and file path  |
| `qa`         | Run QA checks (terminal summary)    |

```bash
# Run QA via CLI
npm run ls-apis -- qa

# Save QA report to custom path
npm run ls-apis -- qa -f ./my-report.json
```

### QA Options

| Flag       | Alias | Description                         |
| ---------- | ----- | ----------------------------------- |
| `--sort`   | `-s`  | Sort by: name (default), count      |
| `--output` | `-o`  | Output format: text (default), json |

### Providers Options

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

The config file is plain JSON. Edit it manually to customize defaults, or delete it to regenerate with built-in values.

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
├── qa-output/             # QA reports (gitignored)
├── packages/
│   ├── aggregator/        # Fetches, normalizes, deduplicates APIs
│   │   ├── src/
│   │   │   ├── aggregate.ts       # Main orchestration
│   │   │   ├── config.ts          # Config reader (~/.ls-apis)
│   │   │   ├── normalize.ts       # Entry & category normalization
│   │   │   ├── paths.ts           # Path utilities
│   │   │   ├── qa/                # QA validation
│   │   │   │   ├── index.ts       # QA orchestrator
│   │   │   │   ├── validations.ts # Validation functions
│   │   │   │   └── tests/         # QA tests
│   │   │   ├── sources/           # Pluggable fetchers (*.fetcher.ts)
│   │   │   │   ├── index.ts       # Fetcher auto-loader
│   │   │   │   └── tests/         # Fetcher tests
│   │   │   ├── tests/             # Aggregator & normalize tests
│   │   │   └── types.ts           # ApiEntry, SourceFetcher interfaces
│   │   └── vitest.config.ts
│   ├── cli/               # CLI for searching APIs
│   │   ├── dist/                # Compiled ESM output used by npm bin
│   │   ├── data/
│   │   │   └── apis.json          # Bundled API data (4,300+ APIs)
│   │   ├── src/
│   │   │   ├── index.ts           # CLI entry point
│   │   │   ├── categories.ts      # Categories command
│   │   │   ├── providers.ts       # Providers command
│   │   │   ├── qa.ts              # QA command handler
│   │   │   ├── paths.ts           # Workspace root resolution
│   │   │   ├── colors.ts          # Terminal color support
│   │   │   └── formatter.ts       # Output formatter
│   │   └── tests/
│   │       ├── paths.test.ts       # Path resolution tests
│   │       ├── qa.test.ts          # QA wrapper tests
│   │       ├── cli.test.ts         # CLI integration tests
│   │       ├── categories.test.ts  # Categories command tests
│   │       ├── providers.test.ts   # Providers command tests
│   │       └── config.test.ts      # Config tests
│   ├── shared/             # Shared types, config, search, paths
│   │   └── src/
│   │       ├── types.ts            # ApiEntry, DataFile, Provider, SearchOptions
│   │       ├── config.ts           # Config loading from ~/.ls-apis
│   │       ├── search.ts           # Search/filter/sort logic
│   │       └── paths.ts            # Workspace root resolution
│   ├── mcp-server/         # MCP server for AI-friendly API queries
│   │   └── src/
│   │       ├── index.ts            # Entry point
│   │       ├── server.ts           # MCP server with tools & resources
│   │       └── data.ts             # Data loading (apis.json)
│   └── aggregator/        # Fetches, normalizes, deduplicates APIs
│       ├── src/
│       │   ├── aggregate.ts       # Main orchestration
│       │   ├── normalize.ts       # Entry & category normalization
│       │   ├── paths.ts           # Path utilities
│       │   ├── qa/                # QA validation
│       │   │   ├── index.ts       # QA orchestrator
│       │   │   ├── validations.ts # Validation functions
│       │   │   └── tests/         # QA tests
│       │   ├── sources/           # Pluggable fetchers (*.fetcher.ts)
│       │   │   ├── index.ts       # Fetcher auto-loader
│       │   │   └── tests/         # Fetcher tests
│       │   ├── tests/             # Aggregator & normalize tests
│       │   └── types.ts           # ApiEntry, SourceFetcher interfaces
│       └── vitest.config.ts
└── AGENTS.md              # Instructions for AI agents
```

## Scripts

```bash
# Install dependencies
npm install

# Run all tests with coverage
npm test

# Run specific package tests
npm run test:aggregator
npm run test:cli
npm run test:shared
npm run test:mcp

# Typecheck all workspaces
npm run typecheck

# Lint & format
npm run lint
npm run format

# Run aggregator (generates data/apis.json in CLI package)
npm run aggregate

# Run QA checks on aggregated data
npm run qa

# Run CLI directly
npm run ls-apis -- -q <query>

# Run MCP server (stdio transport for AI clients)
npm run mcp

# Build CLI to dist/ (tsc + ESM import fix)
npm run build --workspace=@ls-apis/cli
```

## CLI Build and Publish Notes

- The published CLI entrypoint is `packages/cli/dist/index.js`.
- `packages/cli/src/` contains TypeScript sources.
- `packages/cli` build script runs:
  - `tsc` to compile TS into `dist/`
  - `tsc-esm-fix --target dist` to add `.js` extensions required by Node ESM runtime
- `prepack` in the CLI package runs the build before packaging, so npm publish includes ready-to-run JavaScript.

## Data Schema

The `packages/cli/data/apis.json` file contains metadata and aggregated API data with the following structure:

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
npm run test:shared
npm run test:mcp

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
