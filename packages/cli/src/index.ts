#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

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
}

async function search(options: SearchOptions): Promise<void> {
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

  if (options.output === 'json') {
    console.log(JSON.stringify(results.slice(0, 20), null, 2));
    return;
  }

  console.log(`Found ${results.length} APIs:`);
  for (const api of results.slice(0, 20)) {
    console.log(`  ${api.name}`);
    console.log(`    ${api.description ?? 'No description'}`);
    console.log(`    ${api.link}`);
    if (api.auth) console.log(`    Auth: ${api.auth}`);
    console.log();
  }

  if (results.length > 20) {
    console.log(`... and ${results.length - 20} more`);
  }
}

(async () => {
  const argv = await yargs(hideBin(process.argv))
      .scriptName('ls-apis')
      .usage('$0 [options]')
      .option('query', { alias: 'q', type: 'string', describe: 'Search query (filters name, description)' })
      .option('category', { alias: 'c', type: 'string', describe: 'Filter by category' })
      .option('auth', { alias: 'a', type: 'string', describe: 'Filter by auth (apiKey, OAuth, no)' })
      .option('output', { alias: 'o', type: 'string', choices: ['text', 'json'], default: 'text', describe: 'Output format' })
      .help()
      .parse();

  await search({ query: argv.query, category: argv.category, auth: argv.auth, output: argv.output });
})();
