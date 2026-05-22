import { describe, it, expect } from 'vitest';
import { deduplicateCategories } from '../dedupe';
import type { ApiEntry } from '../types';

function entry(overrides: Partial<ApiEntry> = {}): ApiEntry {
  return {
    name: 'Test API',
    description: null,
    link: 'https://example.com',
    auth: null,
    cors: null,
    categories: ['Test'],
    openapiSpec: null,
    sources: ['test-source'],
    ...overrides,
  };
}

describe('deduplicateCategories', () => {
  it('should pass through valid entries', () => {
    const entries = [
      entry({ name: 'API 1' }),
      entry({ name: 'API 2', link: 'https://example2.com' }),
    ];
    const result = deduplicateCategories(entries, 250);
    expect(result.entries).toHaveLength(2);
    expect(result.rejected).toHaveLength(0);
  });

  it('should merge entries with the same link', () => {
    const entries = [
      entry({ sources: ['source-a'], categories: ['Cat A'] }),
      entry({ sources: ['source-b'], categories: ['Cat B'] }),
    ];
    const result = deduplicateCategories(entries, 250);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].sources).toEqual(expect.arrayContaining(['source-a', 'source-b']));
    expect(result.entries[0].categories).toEqual(expect.arrayContaining(['Cat A', 'Cat B']));
  });

  it('should deduplicate categories when merging', () => {
    const entries = [
      entry({ categories: ['Cat A', 'Cat B'] }),
      entry({ categories: ['Cat B', 'Cat C'] }),
    ];
    const result = deduplicateCategories(entries, 250);
    expect(result.entries[0].categories).toHaveLength(3);
    expect(result.entries[0].categories).toEqual(
      expect.arrayContaining(['Cat A', 'Cat B', 'Cat C'])
    );
  });

  it('should deduplicate sources when merging', () => {
    const entries = [
      entry({ sources: ['src-a', 'src-b'] }),
      entry({ sources: ['src-b', 'src-c'] }),
    ];
    const result = deduplicateCategories(entries, 250);
    expect(result.entries[0].sources).toHaveLength(3);
    expect(result.entries[0].sources).toEqual(expect.arrayContaining(['src-a', 'src-b', 'src-c']));
  });

  it('should keep entries with different links separate', () => {
    const entries = [
      entry({ name: 'API A', link: 'https://a.com' }),
      entry({ name: 'API B', link: 'https://b.com' }),
    ];
    const result = deduplicateCategories(entries, 250);
    expect(result.entries).toHaveLength(2);
  });

  it('should reject entries with invalid data from normalizeEntry', () => {
    const entries = [entry({ link: 'not-a-url' })];
    const result = deduplicateCategories(entries, 250);
    expect(result.entries).toHaveLength(0);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0].reason).toContain('link');
  });

  it('should drop entries that merge into more than 10 categories', () => {
    const entries: ApiEntry[] = Array.from({ length: 11 }, (_, i) =>
      entry({ categories: [`Category ${i}`] })
    );
    const result = deduplicateCategories(entries, 250);
    expect(result.entries).toHaveLength(0);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0].reason).toContain('Too many categories after merge');
  });

  it('should keep entries with 10 or fewer merged categories', () => {
    const entries: ApiEntry[] = Array.from({ length: 10 }, (_, i) =>
      entry({ categories: [`Category ${i}`] })
    );
    const result = deduplicateCategories(entries, 250);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].categories).toHaveLength(10);
  });

  it('should handle empty input', () => {
    const result = deduplicateCategories([], 250);
    expect(result.entries).toHaveLength(0);
    expect(result.rejected).toHaveLength(0);
  });

  it('should truncate descriptions to descriptionMaxLength', () => {
    const long = 'x'.repeat(300);
    const entries = [entry({ description: long })];
    const result = deduplicateCategories(entries, 100);
    expect(result.entries[0].description).toHaveLength(100);
  });
});
