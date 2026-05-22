import { MAX_CATEGORIES, normalizeEntry } from './normalize';
import type { ApiEntry, RejectedEntry } from './types';

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
    if (entry.categories.length > MAX_CATEGORIES) {
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
