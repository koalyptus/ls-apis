#!/usr/bin/env -S node --import tsx
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { initColors } from './colors';
import { loadConfig } from './config';
import { search } from './search';
import { formatResults } from './formatter';
import type { ApiEntry } from './types';

const packageJsonPath = join(dirname(fileURLToPath(import.meta.url)), '../package.json');
const { version } = JSON.parse(await readFile(packageJsonPath, 'utf-8'));

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
      .example('$0 -q weather -s name', 'Sort results by name')
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

    const dataFile = join(dirname(fileURLToPath(import.meta.url)), '../../../data/apis.json');
    const data = await readFile(dataFile, 'utf-8');
    const apis: ApiEntry[] = JSON.parse(data);

    const results = search(apis, {
      query: argv.query,
      category: argv.category,
      auth: argv.auth,
      sort: argv.sort as 'name' | 'category' | 'auth' | undefined,
      limit: argv.limit,
    });

    const output = formatResults(results, results.length, argv.limit, {
      output: argv.output as 'text' | 'json',
      descriptionMaxLength: config.descriptionMaxLength,
    });

    console.log(output);
  })().catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}
