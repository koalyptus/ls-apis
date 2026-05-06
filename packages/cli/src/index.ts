#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const packageJsonPath = join(dirname(fileURLToPath(import.meta.url)), '../package.json');
const { version } = JSON.parse(await readFile(packageJsonPath, 'utf-8'));

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

interface SearchOptions {
  query?: string;
  category?: string;
  auth?: string;
  output?: 'text' | 'json';
  limit?: number;
}

const DEFAULT_LIMIT = 20;

export async function search(options: SearchOptions): Promise<void> {
  const dataFile = join(dirname(fileURLToPath(import.meta.url)), '../../../data/apis.json');
  const data = await readFile(dataFile, 'utf-8');
  const apis: ApiEntry[] = JSON.parse(data);

  let results = apis;

  if (options.query) {
    const q = options.query.toLowerCase();
    results = results.filter(
      (api) => api.name.toLowerCase().includes(q) || api.description?.toLowerCase().includes(q),
    );
  }

  if (options.category) {
    const cat = options.category.toLowerCase();
    results = results.filter((api) => api.categories.some((c) => c.toLowerCase().includes(cat)));
  }

  if (options.auth) {
    const auth = options.auth.toLowerCase();
    results = results.filter((api) => {
      if (auth === 'no') {
        return !api.auth;
      }
      return api.auth?.toLowerCase().includes(auth);
    });
  }

  const limit = options.limit ?? DEFAULT_LIMIT;

  if (options.output === 'json') {
    console.log(JSON.stringify(results.slice(0, limit), null, 2));
    return;
  }

  console.log(`Found ${results.length} APIs:`);
  for (const api of results.slice(0, limit)) {
    console.log(`  ${api.name}`);
    console.log(`    ${api.description ?? 'No description'}`);
    console.log(`    ${api.link}`);
    if (api.auth) console.log(`    Auth: ${api.auth}`);
    console.log();
  }

  if (results.length > limit) {
    console.log(`... and ${results.length - limit} more`);
  }
}

(async () => {
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
      .option('query', { alias: 'q', type: 'string', describe: 'Search query (filters name, description)' })
      .option('category', { alias: 'c', type: 'string', describe: 'Filter by category' })
      .option('auth', { alias: 'a', type: 'string', describe: 'Filter by auth (apiKey, OAuth, no)' })
      .option('limit', { alias: 'l', type: 'number', default: DEFAULT_LIMIT, describe: 'Max results to show' })
      .option('output', { alias: 'o', type: 'string', choices: ['text', 'json'], default: 'text', describe: 'Output format' })
      .help()
      .alias('help', 'h')
      .alias('help', '?')
      .parse();

  await search({ query: argv.query, category: argv.category, auth: argv.auth, output: argv.output as 'text' | 'json' | undefined, limit: argv.limit });
})().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});