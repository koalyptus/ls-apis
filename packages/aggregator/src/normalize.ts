import { isValidUrl } from './qa/validations';
import type { ApiEntry } from './types';

function normalizeCategory(category: string): string {
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

function normalizeCategories(categories: string[]): string[] {
  return categories.filter((c) => c.length > 1).map((c) => normalizeCategory(c));
}

export function normalizeEntry(entry: ApiEntry, descriptionMaxLength: number): ApiEntry | null {
  if (!entry.link || !isValidUrl(entry.link)) {
    return null;
  }

  if (!entry.name) {
    return null;
  }

  if (!entry.sources || entry.sources.length === 0) {
    return null;
  }

  let normalizedCategories = normalizeCategories(entry.categories);
  if (normalizedCategories.length === 0) {
    normalizedCategories = ['Uncategorized'];
  }

  if (normalizedCategories.length > 10) {
    return null;
  }

  return {
    name: entry.name,
    description: entry.description
      ? entry.description.length > descriptionMaxLength
        ? entry.description.slice(0, descriptionMaxLength)
        : entry.description
      : null,
    link: entry.link,
    auth: entry.auth ?? null,
    cors: entry.cors ?? null,
    categories: normalizedCategories,
    openapiSpec: entry.openapiSpec ?? null,
    sources: entry.sources,
  };
}
