import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadAllFetchers } from './sources/index';
import type { ApiEntry } from './types';

const DATA_FILE = join(dirname(fileURLToPath(import.meta.url)), '../../../data/apis.json');

export async function runAggregation(): Promise<void> {
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

  const deduped = deduplicate(allEntries);
  console.log(`Total entries after dedupe: ${deduped.length}`);

  const json = JSON.stringify(deduped, null, 2);
  await writeFile(DATA_FILE, json);
  console.log(`Written to ${DATA_FILE}`);

  try {
    const parsed = JSON.parse(json);
    console.log(`Validated: ${parsed.length} entries`);
  } catch (error) {
    console.error(`JSON validation failed: ${error}`);
    process.exit(1);
  }
}

export function deduplicate(entries: ApiEntry[]): ApiEntry[] {
  const byLink = new Map<string, ApiEntry>();

  for (const entry of entries) {
    const normalizedLink = normalizeLink(entry.link);
    const existing = byLink.get(normalizedLink);

    if (existing) {
      const combinedSources = [...new Set([...existing.sources, ...entry.sources])];
      const combinedCategories = [...new Set([...existing.categories, ...entry.categories])];

      byLink.set(normalizedLink, {
        ...existing,
        sources: combinedSources,
        categories: combinedCategories,
      });
    } else {
      byLink.set(normalizedLink, normalizeEntry(entry));
    }
  }

  return Array.from(byLink.values());
}

export function normalizeEntry(entry: ApiEntry): ApiEntry {
  return {
    name: entry.name,
    description: entry.description ?? null,
    link: entry.link,
    auth: entry.auth ?? null,
    cors: entry.cors ?? null,
    categories: entry.categories,
    openapiSpec: entry.openapiSpec ?? null,
    sources: entry.sources,
  };
}

export function normalizeLink(link: string): string {
  return link
    .toLowerCase()
    .replace(/\/+$/, '')
    .replace(/^http:/, 'https:');
}
