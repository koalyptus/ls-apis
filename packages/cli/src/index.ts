#!/usr/bin/env -S node --import tsx
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { initColors, color } from './colors';
import { loadConfig, CONFIG_DEFAULTS } from './config';

const packageJsonPath = join(dirname(fileURLToPath(import.meta.url)), '../package.json');
const { version } = JSON.parse(await readFile(packageJsonPath, 'utf-8'));

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

interface SearchOptions {
  query?: string;
  category?: string;
  auth?: string;
  output?: 'text' | 'json';
  limit?: number;
  descriptionMaxLength?: number;
  sort?: 'name' | 'category' | 'auth';
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export async function search(options: SearchOptions): Promise<void> {
  const dataFile = join(dirname(fileURLToPath(import.meta.url)), '../../../data/apis.json');
  const data = await readFile(dataFile, 'utf-8');
  const apis: ApiEntry[] = JSON.parse(data);

  let results = apis;

  if (options.query) {
    const q = options.query.toLowerCase();
    results = results.filter(
      (api) => api.name.toLowerCase().includes(q) || api.description?.toLowerCase().includes(q)
    );
  }

  if (options.category) {
    const cat = options.category.toLowerCase();
    results = results.filter((api) => api.categories.some((c) => c.toLowerCase().includes(cat)));
  }

  if (options.auth) {
    const auth = options.auth.toLowerCase();
    results = results.filter((api) => {
      if (auth === 'no') return !api.auth;
      return api.auth?.toLowerCase().includes(auth);
    });
  }

  const limit = options.limit ?? CONFIG_DEFAULTS.limit;
  const descriptionMaxLength = options.descriptionMaxLength ?? CONFIG_DEFAULTS.descriptionMaxLength;

  if (options.sort) {
    results = [...results].sort((a, b) => {
      switch (options.sort) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'category': {
          const catA = a.categories[0] ?? '';
          const catB = b.categories[0] ?? '';
          return catA.localeCompare(catB);
        }
        case 'auth': {
          const authA = a.auth ?? '';
          const authB = b.auth ?? '';
          return authA.localeCompare(authB);
        }
        default:
          return 0;
      }
    });
  }

  if (options.output === 'json') {
    console.log(JSON.stringify(results.slice(0, limit), null, 2));
    return;
  }

  console.log(color.bold(`Found ${results.length} APIs:`));
  for (const api of results.slice(0, limit)) {
    console.log(color.cyan(`  ${api.name}`));
    console.log(
      `  ${color.dim('Description:')} ${truncate(
        api.description ?? 'No description',
        descriptionMaxLength
      )}`
    );
    console.log(`  ${color.dim('Link:')} ${api.link}`);
    if (api.auth !== undefined && api.auth !== null)
      console.log(`  ${color.dim('Auth:')} ${color.yellow(api.auth)}`);
    if (api.cors !== undefined && api.cors !== null)
      console.log(`  ${color.dim('CORS:')} ${api.cors}`);
    if (api.categories.length > 0)
      console.log(`  ${color.dim('Categories:')} ${color.green(api.categories.join(', '))}`);
    if (api.openapiSpec !== undefined && api.openapiSpec !== null)
      console.log(`  ${color.dim('OpenAPI Spec:')} ${api.openapiSpec}`);
    if (api.sources.length > 0) console.log(`  ${color.dim('Sources:')} ${api.sources.join(', ')}`);
    console.log();
  }

  if (results.length > limit) {
    console.log(`  ${color.dim('... and ' + (results.length - limit) + ' more')}`);
  }
}

if (process.argv[1] && !process.argv[1].includes('vitest')) {
  (async () => {
    const config = await loadConfig();

    const argv = await yargs(hideBin(process.argv))
      .scriptName('ls-apis')
      .version(version)
      .alias('version', 'V')
      .alias('version', 'v')
      .usage('$0 [options]')
      .example('$0 -q weather', 'Search for weather APIs')
      .example('$0 -c weather', 'Filter by weather category')
      .example('$0 -q weather -c storage', 'Search weather in storage category')
      .example('$0 -a oauth', 'Filter by OAuth auth')
      .example('$0 -q weather -l 50', 'Limit results to 50')
      .example('$0 -q weather -o json', 'Output as JSON')
      .option('query', {
        alias: 'q',
        type: 'string',
        describe: 'Search query (filters name, description)',
      })
      .option('category', { alias: 'c', type: 'string', describe: 'Filter by category' })
      .option('auth', {
        alias: 'a',
        type: 'string',
        describe: 'Filter by auth (apiKey, OAuth, no)',
      })
      .option('limit', {
        alias: 'l',
        type: 'number',
        default: config.limit,
        describe: 'Max results to show',
      })
      .option('output', {
        alias: 'o',
        type: 'string',
        choices: ['text', 'json'],
        default: 'text',
        describe: 'Output format',
      })
      .option('sort', {
        alias: 's',
        type: 'string',
        choices: ['name', 'category', 'auth'],
        describe: 'Sort results by field',
      })
      .option('no-color', { type: 'boolean', describe: 'Disable colors in output' })
      .help()
      .alias('help', 'h')
      .alias('help', '?')
      .parse();

    const noColor = argv.color === false;
    initColors(noColor ?? !config.colors);
    await search({
      query: argv.query,
      category: argv.category,
      auth: argv.auth,
      output: argv.output as 'text' | 'json' | undefined,
      limit: argv.limit,
      sort: argv.sort as 'name' | 'category' | 'auth' | undefined,
      descriptionMaxLength: config.descriptionMaxLength,
    });
  })().catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}
