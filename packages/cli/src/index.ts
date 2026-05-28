#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { initColors } from './colors';
import { loadConfig, getConfig } from '@ls-apis/shared/config';
import { search } from '@ls-apis/shared/search';
import { formatResults } from './formatter';
import { handleCategories } from './categories';
import { handleProviders } from './providers';
import { runQa } from './qa';
import type { DataFile } from '@ls-apis/shared/types';

let version: string;

async function getVersion(): Promise<string> {
  if (!version) {
    const packageJsonPath = join(dirname(fileURLToPath(import.meta.url)), '../package.json');
    const pkg = JSON.parse(await readFile(packageJsonPath, 'utf-8'));
    version = pkg.version;
  }
  return version;
}

export async function run(argv: string[]): Promise<void> {
  const config = await loadConfig();
  const ver = await getVersion();

  const dataFile = join(dirname(fileURLToPath(import.meta.url)), '../data/apis.json');
  const data = await readFile(dataFile, 'utf-8');
  const { apis, providers } = JSON.parse(data) as DataFile;

  let exitEarly = false;

  const args = await yargs(argv)
    .scriptName('ls-apis')
    .strict()
    .version(ver)
    .alias('version', 'V')
    .alias('version', 'v')
    .usage('$0 <command> [options]')
    .usage('$0 [options]')
    .example('$0 -q weather', 'Search for weather APIs')
    .example('$0 -c weather', 'Filter by weather category')
    .example('$0 -q weather -c storage', 'Search weather in storage category')
    .example('$0 -a oauth', 'Filter by OAuth auth')
    .example('$0 -q weather -l 50', 'Limit results to 50')
    .example('$0 -q weather -o json', 'Output as JSON')
    .example('$0 -q weather -s name', 'Sort results by name')
    .command({
      command: 'categories',
      describe: 'List all API categories',
      builder: (yargs) => {
        return yargs
          .option('sort', {
            alias: 's',
            type: 'string',
            choices: ['name', 'count'],
            default: 'name',
            describe: 'Sort by name or count',
          })
          .option('output', {
            alias: 'o',
            type: 'string',
            choices: ['text', 'json'],
            default: 'text',
            describe: 'Output format',
          });
      },
      handler: (argv) => {
        handleCategories(apis, argv, config);
        exitEarly = true;
      },
    })
    .command({
      command: 'providers',
      describe: 'List all data providers',
      builder: (yargs) => {
        return yargs
          .option('sort', {
            alias: 's',
            type: 'string',
            choices: ['name', 'count'],
            default: 'name',
            describe: 'Sort by name or count',
          })
          .option('output', {
            alias: 'o',
            type: 'string',
            choices: ['text', 'json'],
            default: 'text',
            describe: 'Output format',
          });
      },
      handler: (argv) => {
        handleProviders(providers, apis, argv, config);
        exitEarly = true;
      },
    })
    .command({
      command: 'config',
      describe: 'Show config settings',
      handler: async () => {
        const { config, filePath } = await getConfig();
        console.log(`Config file: ${filePath}`);
        console.log(JSON.stringify(config, null, 2));
        exitEarly = true;
      },
    })
    .command({
      command: 'qa',
      describe: 'Run QA validation on apis.json',
      builder: (yargs) => {
        return yargs.option('file', {
          alias: 'f',
          type: 'string',
          describe: 'Custom output file path (default: qa-output/issues.json)',
        });
      },
      handler: async (argv) => {
        await runQa(config.descriptionMaxLength, argv.file);
        exitEarly = true;
      },
    })
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

  if (exitEarly) {
    return;
  }

  const noColor = args.color === false;
  initColors(noColor ?? !config.colors);

  const results = search(apis, {
    query: args.query,
    category: args.category,
    auth: args.auth,
    sort: args.sort as 'name' | 'category' | 'auth' | undefined,
    limit: args.limit,
  });

  const output = formatResults(results, results.length, args.limit, {
    output: args.output as 'text' | 'json',
    descriptionMaxLength: config.descriptionMaxLength,
  });

  console.log(output);
}

if (process.argv[1] && !process.argv[1].includes('vitest')) {
  run(hideBin(process.argv)).catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}
