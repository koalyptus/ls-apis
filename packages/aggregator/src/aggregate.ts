import { writeFile } from 'node:fs/promises';
import { loadAllFetchers } from './sources/index';
import { resolveDataFile } from './paths';
import { loadConfig } from '../../cli/src/config';
import { normalizeEntry } from './normalize';
import type { ApiEntry, DataFile } from './types';

const DATA_FILE = resolveDataFile(import.meta.url);

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

  const deduped = deduplicateCategories(allEntries, descriptionMaxLength);
  console.log(`Total entries after dedupe: ${deduped.length}`);

  const dataFile: DataFile = {
    timestamp: new Date().toISOString(),
    providers: fetchers.map((f) => ({ name: f.name, url: f.sourceUrl })),
    apis: deduped,
  };

  const json = JSON.stringify(dataFile, null, 2);
  await writeFile(DATA_FILE, json);
  console.log(`Written to ${DATA_FILE}`);

  try {
    const parsed = JSON.parse(json) as DataFile;
    console.log(`Validated: ${parsed.apis.length} entries, ${parsed.providers.length} providers`);
  } catch (error) {
    console.error(`JSON validation failed: ${error}`);
    process.exit(1);
  }
}

export function deduplicateCategories(
  entries: ApiEntry[],
  descriptionMaxLength: number
): ApiEntry[] {
  const dedupedEntries = new Map<string, ApiEntry>();

  for (const entry of entries) {
    const normalizedEntry = normalizeEntry(entry, descriptionMaxLength);
    if (!normalizedEntry) {
      continue;
    }

    const existing = dedupedEntries.get(normalizedEntry.link);

    if (existing) {
      dedupedEntries.set(normalizedEntry.link, {
        ...existing,
        sources: [...new Set([...existing.sources, ...normalizedEntry.sources])],
        categories: [...new Set([...existing.categories, ...normalizedEntry.categories])],
      });
    } else {
      dedupedEntries.set(normalizedEntry.link, normalizedEntry);
    }
  }

  return Array.from(dedupedEntries.values()).filter((entry) => entry.categories.length <= 10);
}
