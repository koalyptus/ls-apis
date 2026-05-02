import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadAllFetchers } from './sources/index.js';
import type { ApiEntry } from './types.js';

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

  await writeFile(DATA_FILE, JSON.stringify(deduped, null, 2));
  console.log(`Written to ${DATA_FILE}`);
}

function deduplicate(entries: ApiEntry[]): ApiEntry[] {
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
      byLink.set(normalizedLink, entry);
    }
  }

  return Array.from(byLink.values());
}

function normalizeLink(link: string): string {
  return link
    .toLowerCase()
    .replace(/\/+$/, '')
    .replace(/^http:/, 'https:');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAggregation().catch(console.error);
}

export { deduplicate, normalizeLink };
