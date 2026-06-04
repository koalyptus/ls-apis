import { describe, it, expect } from 'vitest';
import { normalizeEntry } from '../normalize';
import type { ApiEntry } from '../types';

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

  it('should return normalized entry when all required fields are valid', () => {
    const result = normalizeEntry(baseEntry, 250);
    expect('valid' in result).toBe(false);
    const entry = result as ApiEntry;
    expect(entry.name).toBe('Test API');
    expect(entry.link).toBe('https://api.test.com');
    expect(entry.categories).toEqual(['Test']);
    expect(entry.sources).toEqual(['test-fetcher']);
  });

  it('should return rejected when link is missing', () => {
    const result = normalizeEntry({ ...baseEntry, link: '' }, 250);
    expect('valid' in result).toBe(true);
    if ('valid' in result) {
      expect(result.reason).toContain('link');
    }
  });

  it('should return rejected when link is invalid', () => {
    const result = normalizeEntry({ ...baseEntry, link: 'not-a-url' }, 250);
    expect('valid' in result).toBe(true);
    if ('valid' in result) {
      expect(result.reason).toContain('link');
    }
  });

  it('should return rejected when name is empty', () => {
    const result = normalizeEntry({ ...baseEntry, name: '' }, 250);
    expect('valid' in result).toBe(true);
    if ('valid' in result) {
      expect(result.reason).toContain('name');
    }
  });

  it('should return rejected when name is missing', () => {
    const result = normalizeEntry({ ...baseEntry, name: undefined as unknown as string }, 250);
    expect('valid' in result).toBe(true);
    if ('valid' in result) {
      expect(result.reason).toContain('name');
    }
  });

  it('should return rejected when sources is empty', () => {
    const result = normalizeEntry({ ...baseEntry, sources: [] }, 250);
    expect('valid' in result).toBe(true);
    if ('valid' in result) {
      expect(result.reason).toContain('sources');
    }
  });

  it('should return rejected when sources is missing', () => {
    const result = normalizeEntry({ ...baseEntry, sources: undefined as unknown as string[] }, 250);
    expect('valid' in result).toBe(true);
    if ('valid' in result) {
      expect(result.reason).toContain('sources');
    }
  });

  it('should use Uncategorized when all categories are filtered out', () => {
    const result = normalizeEntry({ ...baseEntry, categories: ['x'] }, 250);
    expect('valid' in result).toBe(false);
    const entry = result as ApiEntry;
    expect(entry.categories).toEqual(['Uncategorized']);
  });

  it('should return rejected when there are more than 10 categories', () => {
    const result = normalizeEntry(
      { ...baseEntry, categories: Array.from({ length: 11 }, (_, i) => `Category ${i}`) },
      250
    );
    expect('valid' in result).toBe(true);
    if ('valid' in result) {
      expect(result.reason).toMatch(/Too many categories/);
    }
  });

  it('should truncate description when exceeding max length', () => {
    const longDesc = 'a'.repeat(300);
    const result = normalizeEntry({ ...baseEntry, description: longDesc }, 100);
    expect('valid' in result).toBe(false);
    const entry = result as ApiEntry;
    expect(entry.description).toBe('a'.repeat(100));
  });

  it('should preserve auth value of "no"', () => {
    const result = normalizeEntry({ ...baseEntry, auth: 'no' }, 250);
    expect('valid' in result).toBe(false);
    const entry = result as ApiEntry;
    expect(entry.auth).toBe('no');
  });

  it('should keep description as null when not provided', () => {
    const result = normalizeEntry({ ...baseEntry, description: null }, 250);
    expect('valid' in result).toBe(false);
    const entry = result as ApiEntry;
    expect(entry.description).toBeNull();
  });

  describe('category normalization', () => {
    it('should title-case categories', () => {
      const result = normalizeEntry({ ...baseEntry, categories: ['open data'] }, 250);
      expect('valid' in result).toBe(false);
      const entry = result as ApiEntry;
      expect(entry.categories).toEqual(['Open Data']);
    });

    it('should replace underscores with spaces', () => {
      const result = normalizeEntry({ ...baseEntry, categories: ['open_data'] }, 250);
      expect('valid' in result).toBe(false);
      const entry = result as ApiEntry;
      expect(entry.categories).toEqual(['Open Data']);
    });

    it('should replace dashes with spaces', () => {
      const result = normalizeEntry({ ...baseEntry, categories: ['open-data'] }, 250);
      expect('valid' in result).toBe(false);
      const entry = result as ApiEntry;
      expect(entry.categories).toEqual(['Open Data']);
    });

    it('should convert " and " to " & "', () => {
      const result = normalizeEntry({ ...baseEntry, categories: ['art and design'] }, 250);
      expect('valid' in result).toBe(false);
      const entry = result as ApiEntry;
      expect(entry.categories).toEqual(['Art & Design']);
    });

    it('should normalize multiple categories', () => {
      const result = normalizeEntry(
        { ...baseEntry, categories: ['weather', 'open_data', 'art and design'] },
        250
      );
      expect('valid' in result).toBe(false);
      const entry = result as ApiEntry;
      expect(entry.categories).toEqual(['Weather', 'Open Data', 'Art & Design']);
    });
  });
});
