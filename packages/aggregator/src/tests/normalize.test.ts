import { describe, it, expect } from 'vitest';
import { normalizeCategory, normalizeEntry, normalizePath } from '../normalize';
import type { ApiEntry } from '../types';

describe('normalize helpers', () => {
  it('normalizes category names into title-cased labels', () => {
    expect(normalizeCategory('open_data')).toBe('Open Data');
    expect(normalizeCategory('weather-and-forecast')).toBe('Weather & Forecast');
  });

  it('normalizes hrefs against a base URL and strips query/hash fragments', () => {
    expect(normalizePath(undefined, 'https://publicapis.dev')).toBeNull();
    expect(normalizePath('#section', 'https://publicapis.dev')).toBeNull();
    expect(normalizePath('/resource/foo?x=1#top', 'https://publicapis.dev')).toBe(
      'https://publicapis.dev/resource/foo'
    );
    expect(normalizePath('https://example.com/api?x=1', 'https://publicapis.dev')).toBe(
      'https://example.com/api'
    );
  });
});

describe('normalizeEntry', () => {
  const baseEntry: ApiEntry = {
    name: 'Test API',
    description: 'A test API description',
    link: 'https://api.test.com',
    auth: null,
    cors: null,
    categories: ['Test'],
    openapiSpec: 'https://api.test.com/spec',
    sources: ['test-fetcher'],
  };

  function rejects(overrides: Partial<ApiEntry>, reasonSnippet: string) {
    const result = normalizeEntry({ ...baseEntry, ...overrides }, 250);
    expect(result).toHaveProperty('valid', false);
    expect((result as { reason: string }).reason).toContain(reasonSnippet);
  }

  function accepts(overrides: Partial<ApiEntry>, maxLen = 250): ApiEntry {
    const result = normalizeEntry({ ...baseEntry, ...overrides }, maxLen);
    expect(result).not.toHaveProperty('valid');
    return result as ApiEntry;
  }

  it('should accept a fully valid entry', () => {
    const entry = accepts({});
    expect(entry.name).toBe('Test API');
    expect(entry.link).toBe('https://api.test.com');
    expect(entry.categories).toEqual(['Test']);
    expect(entry.sources).toEqual(['test-fetcher']);
  });

  it('should reject when link is missing', () => {
    rejects({ link: '' }, 'link');
  });

  it('should reject when link is invalid', () => {
    rejects({ link: 'not-a-url' }, 'link');
  });

  it('should reject when name is empty', () => {
    rejects({ name: '' }, 'name');
  });

  it('should reject when name is missing', () => {
    rejects({ name: undefined as unknown as string }, 'name');
  });

  it('should reject when sources is empty', () => {
    rejects({ sources: [] }, 'sources');
  });

  it('should reject when sources is missing', () => {
    rejects({ sources: undefined as unknown as string[] }, 'sources');
  });

  it('should use Uncategorized when all categories are filtered out', () => {
    const entry = accepts({ categories: ['x'] });
    expect(entry.categories).toEqual(['Uncategorized']);
  });

  it('should reject when there are more than 10 categories', () => {
    rejects(
      { categories: Array.from({ length: 11 }, (_, i) => `Category ${i}`) },
      'Too many categories'
    );
  });

  it('should truncate description when exceeding max length', () => {
    const entry = accepts({ description: 'a'.repeat(300) }, 100);
    expect(entry.description).toBe('a'.repeat(100));
  });

  it('should preserve auth value of "no"', () => {
    const entry = accepts({ auth: 'no' });
    expect(entry.auth).toBe('no');
  });

  it('should keep description as null when not provided', () => {
    const entry = accepts({ description: null });
    expect(entry.description).toBeNull();
  });
});

describe('category normalization', () => {
  const baseEntry: ApiEntry = {
    name: 'Test API',
    description: null,
    link: 'https://api.test.com',
    auth: null,
    cors: null,
    categories: [],
    openapiSpec: null,
    sources: ['test-fetcher'],
  };

  function normalized(...categories: string[]): string[] {
    const result = normalizeEntry({ ...baseEntry, categories }, 250);
    expect(result).not.toHaveProperty('valid');
    return (result as ApiEntry).categories;
  }

  it.each([
    ['open data', ['Open Data']],
    ['open_data', ['Open Data']],
    ['open-data', ['Open Data']],
    ['art and design', ['Art & Design']],
    [
      ['weather', 'open_data', 'art and design'],
      ['Weather', 'Open Data', 'Art & Design'],
    ],
  ])('normalizes %j → %j', (input, expected) => {
    const categories = Array.isArray(input) ? input : [input];
    expect(normalized(...categories)).toEqual(expected);
  });
});
