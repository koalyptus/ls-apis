import { isValidUrl } from './qa/validations';
import type { ApiEntry, NormalizeResult } from './types';

export const MAX_CATEGORIES = 10;

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

function truncate(value: string | null | undefined, maxLength: number): string | null {
  if (!value) {
    return null;
  }
  if (value.length <= maxLength) {
    return value;
  }
  return value.slice(0, maxLength);
}

export function normalizeEntry(entry: ApiEntry, descriptionMaxLength: number): NormalizeResult {
  if (!entry.link || !isValidUrl(entry.link)) {
    return { valid: false, reason: 'Invalid or missing link', entry };
  }

  if (!entry.name) {
    return { valid: false, reason: 'Missing name', entry };
  }

  if (!entry.sources || entry.sources.length === 0) {
    return { valid: false, reason: 'Missing sources', entry };
  }

  let normalizedCategories = normalizeCategories(entry.categories);
  if (normalizedCategories.length === 0) {
    normalizedCategories = ['Uncategorized'];
  }

  if (normalizedCategories.length > MAX_CATEGORIES) {
    return { valid: false, reason: `Too many categories (${normalizedCategories.length})`, entry };
  }

  return {
    name: entry.name,
    description: truncate(entry.description, descriptionMaxLength),
    link: entry.link,
    auth: entry.auth ?? null,
    cors: entry.cors ?? null,
    categories: normalizedCategories,
    openapiSpec: entry.openapiSpec ?? null,
    sources: entry.sources,
  };
}
