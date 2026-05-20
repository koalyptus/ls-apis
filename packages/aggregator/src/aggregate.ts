import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { loadAllFetchers } from './sources/index';
import { resolveDataFile, resolveProjectRoot } from './paths';
import { loadConfig } from '../../cli/src/config';
import { normalizeEntry } from './normalize';
import type { ApiEntry, DataFile, RejectedEntry, RejectedFile } from './types';

const DATA_FILE = resolveDataFile(import.meta.url);
const QA_OUTPUT_DIR = join(resolveProjectRoot(import.meta.url), 'qa-output');
const REJECTED_FILE = join(QA_OUTPUT_DIR, 'rejected.json');

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
    await mkdir(QA_OUTPUT_DIR, { recursive: true });
    await writeFile(REJECTED_FILE, JSON.stringify(rejectedFile, null, 2));
    console.log(`Rejected ${rejected.length} entries → ${REJECTED_FILE}`);
  }

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
): { entries: ApiEntry[]; rejected: RejectedEntry[] } {
  const dedupedEntries = new Map<string, ApiEntry>();
  const rejected: RejectedEntry[] = [];

  for (const entry of entries) {
    const result = normalizeEntry(entry, descriptionMaxLength);
    if ('valid' in result) {
      rejected.push({
        name: result.entry.name,
        link: result.entry.link,
        reason: result.reason,
        sources: result.entry.sources,
        categories: result.entry.categories,
      });
      continue;
    }

    const existing = dedupedEntries.get(result.link);

    if (existing) {
      dedupedEntries.set(result.link, {
        ...existing,
        sources: [...new Set([...existing.sources, ...result.sources])],
        categories: [...new Set([...existing.categories, ...result.categories])],
      });
    } else {
      dedupedEntries.set(result.link, result);
    }
  }

  const entries_ = Array.from(dedupedEntries.values());
  const postDedup = entries_.filter((entry) => {
    if (entry.categories.length > 10) {
      rejected.push({
        name: entry.name,
        link: entry.link,
        reason: `Too many categories after merge (${entry.categories.length})`,
        sources: entry.sources,
        categories: entry.categories,
      });
      return false;
    }
    return true;
  });

  return { entries: postDedup, rejected };
}
