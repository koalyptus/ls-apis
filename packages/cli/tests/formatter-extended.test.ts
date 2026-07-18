import { describe, it, expect, beforeEach } from 'vitest';
import { formatResults, formatList, formatProviders } from '../src/formatter';
import { initColors } from '../src/colors';
import type { ApiEntry, Provider } from '@ls-apis/shared/types';

beforeEach(() => {
  initColors(false);
});

describe('formatResults - extended', () => {
  it('handles empty results', () => {
    const output = formatResults([], 0, 10, {});
    expect(output).toContain('Found 0 APIs:');
  });

  it('respects limit=0', () => {
    const apis: ApiEntry[] = [
      {
        name: 'A',
        description: 'A',
        link: 'https://a.com',
        categories: ['c'],
        auth: null,
        cors: null,
        openapiSpec: null,
        sources: [],
      },
    ];
    const output = formatResults(apis, 1, 0, {});
    expect(output).toContain('Found 1 APIs:');
    expect(output).toContain('... and 1 more');
  });

  it('includes OpenAPI spec when present', () => {
    const apis: ApiEntry[] = [
      {
        name: 'A',
        description: 'A',
        link: 'https://a.com',
        categories: ['c'],
        auth: null,
        cors: null,
        openapiSpec: 'https://spec.com',
        sources: [],
      },
    ];
    const output = formatResults(apis, 1, 10, {});
    expect(output).toContain('OpenAPI Spec:');
    expect(output).toContain('https://spec.com');
  });

  it('omits OpenAPI spec when null', () => {
    const apis: ApiEntry[] = [
      {
        name: 'A',
        description: 'A',
        link: 'https://a.com',
        categories: ['c'],
        auth: null,
        cors: null,
        openapiSpec: null,
        sources: [],
      },
    ];
    const output = formatResults(apis, 1, 10, {});
    expect(output).not.toContain('OpenAPI Spec');
  });

  it('includes sources when present', () => {
    const apis: ApiEntry[] = [
      {
        name: 'A',
        description: 'A',
        link: 'https://a.com',
        categories: ['c'],
        auth: null,
        cors: null,
        openapiSpec: null,
        sources: ['source1', 'source2'],
      },
    ];
    const output = formatResults(apis, 1, 10, {});
    expect(output).toContain('Sources:');
    expect(output).toContain('source1');
    expect(output).toContain('source2');
  });

  it('omits sources when empty', () => {
    const apis: ApiEntry[] = [
      {
        name: 'A',
        description: 'A',
        link: 'https://a.com',
        categories: ['c'],
        auth: null,
        cors: null,
        openapiSpec: null,
        sources: [],
      },
    ];
    const output = formatResults(apis, 1, 10, {});
    expect(output).not.toContain('Sources:');
  });

  it('omits categories when empty', () => {
    const apis: ApiEntry[] = [
      {
        name: 'A',
        description: 'A',
        link: 'https://a.com',
        categories: [],
        auth: null,
        cors: null,
        openapiSpec: null,
        sources: [],
      },
    ];
    const output = formatResults(apis, 1, 10, {});
    expect(output).not.toContain('Categories:');
  });

  it('omits auth when null', () => {
    const apis: ApiEntry[] = [
      {
        name: 'A',
        description: 'A',
        link: 'https://a.com',
        categories: ['c'],
        auth: null,
        cors: null,
        openapiSpec: null,
        sources: [],
      },
    ];
    const output = formatResults(apis, 1, 10, {});
    expect(output).not.toContain('Auth:');
  });

  it('uses default description max length when not specified', () => {
    const apis: ApiEntry[] = [
      {
        name: 'A',
        description: 'Short',
        link: 'https://a.com',
        categories: ['c'],
        auth: null,
        cors: null,
        openapiSpec: null,
        sources: [],
      },
    ];
    const output = formatResults(apis, 1, 10, {});
    expect(output).toContain('Short');
  });

  it('handles null description', () => {
    const apis: ApiEntry[] = [
      {
        name: 'A',
        description: null,
        link: 'https://a.com',
        categories: ['c'],
        auth: null,
        cors: null,
        openapiSpec: null,
        sources: [],
      },
    ];
    const output = formatResults(apis, 1, 10, {});
    expect(output).toContain('No description');
  });

  it('JSON output includes all fields', () => {
    const apis: ApiEntry[] = [
      {
        name: 'A',
        description: 'desc',
        link: 'https://a.com',
        categories: ['c'],
        auth: 'apiKey',
        cors: 'yes',
        openapiSpec: 'https://spec.com',
        sources: ['s1'],
      },
    ];
    const output = formatResults(apis, 1, 10, { output: 'json' });
    const parsed = JSON.parse(output);
    expect(parsed[0]).toHaveProperty('name', 'A');
    expect(parsed[0]).toHaveProperty('description', 'desc');
    expect(parsed[0]).toHaveProperty('link', 'https://a.com');
    expect(parsed[0]).toHaveProperty('categories', ['c']);
    expect(parsed[0]).toHaveProperty('auth', 'apiKey');
  });

  it('JSON output respects limit', () => {
    const apis: ApiEntry[] = [
      {
        name: 'A',
        description: null,
        link: 'https://a.com',
        categories: [],
        auth: null,
        cors: null,
        openapiSpec: null,
        sources: [],
      },
      {
        name: 'B',
        description: null,
        link: 'https://b.com',
        categories: [],
        auth: null,
        cors: null,
        openapiSpec: null,
        sources: [],
      },
      {
        name: 'C',
        description: null,
        link: 'https://c.com',
        categories: [],
        auth: null,
        cors: null,
        openapiSpec: null,
        sources: [],
      },
    ];
    const output = formatResults(apis, 3, 2, { output: 'json' });
    const parsed = JSON.parse(output);
    expect(parsed).toHaveLength(2);
  });
});

describe('formatList - extended', () => {
  it('handles count of 0', () => {
    const output = formatList(new Map([['empty', 0]]), 'categories', {});
    expect(output).toContain('(0 APIs)');
  });

  it('handles large counts', () => {
    const output = formatList(new Map([['big', 999999]]), 'categories', {});
    expect(output).toContain('(999999 APIs)');
  });

  it('JSON output preserves all entries', () => {
    const map = new Map([
      ['a', 1],
      ['b', 2],
      ['c', 3],
    ]);
    const output = formatList(map, 'categories', { output: 'json' });
    const parsed = JSON.parse(output);
    expect(parsed).toHaveLength(3);
  });
});

describe('formatProviders - extended', () => {
  it('handles providers without count', () => {
    const providers: Provider[] = [{ name: 'p1', url: 'https://p1.com' }];
    const output = formatProviders(providers, {});
    expect(output).toContain('p1');
    expect(output).toContain('https://p1.com');
    expect(output).not.toContain('(0 APIs)');
  });

  it('JSON output includes all provider fields', () => {
    const providers: Provider[] = [{ name: 'p1', url: 'https://p1.com', count: 5 }];
    const output = formatProviders(providers, { output: 'json' });
    const parsed = JSON.parse(output);
    expect(parsed[0]).toEqual({ name: 'p1', url: 'https://p1.com', count: 5 });
  });
});
