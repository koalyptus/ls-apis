import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { loadAllFetchers } from './sources/index';
import { resolveDataFile, resolveRejectedFile } from './paths';
import { loadConfig } from '@ls-apis/shared/config';
import { deduplicateCategories } from './dedupe';
import { validateJsonSyntax } from './qa/validations';
import type { ApiEntry, DataFile, RejectedFile } from './types';

const DATA_FILE = resolveDataFile(import.meta.url);
const REJECTED_FILE = resolveRejectedFile(import.meta.url);

export async function runAggregation(): Promise<void> {
  const { descriptionMaxLength } = await loadConfig();

  const fetchers = await loadAllFetchers();
  console.log(`Loaded ${fetchers.length} fetchers`);

  const allEntries: ApiEntry[] = [];

  for (const fetcher of fetchers) {
    console.log(`Fetching from ${fetcher.name}...`);
    try {
      const entries = await fetcher.fetchApis();
      console.log(`  → ${entries.length} entries`);
      allEntries.push(...entries);
    } catch (error) {
      console.error(`  → Failed: ${error}`);
    }
  }

  console.log(`Total entries before dedupe: ${allEntries.length}`);

  const { entries: deduped, rejected } = deduplicateCategories(allEntries, descriptionMaxLength);
  console.log(`Total entries after dedupe: ${deduped.length}`);

  const dataFile: DataFile = {
    timestamp: new Date().toISOString(),
    providers: fetchers.map((f) => ({ name: f.name, url: f.sourceUrl })),
    apis: deduped,
  };

  const json = JSON.stringify(dataFile, null, 2);
  await writeFile(DATA_FILE, json);
  console.log(`Written to ${DATA_FILE}`);

  if (rejected.length > 0) {
    const rejectedFile: RejectedFile = {
      timestamp: new Date().toISOString(),
      total: rejected.length,
      entries: rejected,
    };
    await mkdir(dirname(REJECTED_FILE), { recursive: true });
    await writeFile(REJECTED_FILE, JSON.stringify(rejectedFile, null, 2));
    console.log(`Rejected ${rejected.length} entries → ${REJECTED_FILE}`);
  }

  const result = validateJsonSyntax(json);
  if (!result.valid) {
    console.error(`JSON validation failed: ${result.error}`);
    process.exit(1);
    return;
  }
  const parsed = result.data as DataFile;
  console.log(`Validated: ${parsed.apis.length} entries, ${parsed.providers.length} providers`);
}
