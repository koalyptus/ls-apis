import { writeFile } from 'node:fs/promises';
import { loadAllFetchers } from './sources/index';
import { resolveDataFile } from './paths';
import type { ApiEntry, DataFile } from './types';

const DATA_FILE = resolveDataFile(import.meta.url);

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

  const deduped = deduplicateCategories(allEntries);
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

function normalizeCategories(categories: string[]): string[] {
  return categories.filter((c) => c.length > 1).map((c) => normalizeCategory(c));
}

export function normalizeEntry(entry: ApiEntry): ApiEntry {
  return {
    name: entry.name,
    description: entry.description ?? null,
    link: entry.link,
    auth: entry.auth ?? null,
    cors: entry.cors ?? null,
    categories: normalizeCategories(entry.categories),
    openapiSpec: entry.openapiSpec ?? null,
    sources: entry.sources,
  };
}

function normalizeLink(link: string): string {
  return link
    .toLowerCase()
    .replace(/\/+$/, '')
    .replace(/^http:/, 'https:');
}

export function normalizeCategory(category: string): string {
  return category
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/ and /g, ' & ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(/ & /g, ' & ');
}

export function deduplicateCategories(entries: ApiEntry[]): ApiEntry[] {
  const dedupedEntries = new Map<string, ApiEntry>();

  for (const entry of entries) {
    const normalizedEntry = normalizeEntry(entry);
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

  return Array.from(dedupedEntries.values());
}
