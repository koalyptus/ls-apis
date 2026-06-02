import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { handleCategories } from '../src/categories';
import { initColors } from '../src/colors';
import type { ApiEntry, LsApisConfig } from '@ls-apis/shared/types';

const mockApis: ApiEntry[] = [
  {
    name: 'Weather API',
    description: 'Weather data',
    link: 'https://example.com',
    categories: ['weather'],
    auth: 'apiKey',
    cors: null,
    openapiSpec: null,
    sources: ['test'],
  },
  {
    name: 'Weather2 API',
    description: 'More weather',
    link: 'https://example2.com',
    categories: ['weather', 'data'],
    auth: 'apiKey',
    cors: null,
    openapiSpec: null,
    sources: ['test'],
  },
  {
    name: 'Other API',
    description: 'Something else',
    link: 'https://example4.com',
    categories: ['data'],
    auth: null,
    cors: null,
    openapiSpec: null,
    sources: ['test'],
  },
];

describe('handleCategories', () => {
  const config: LsApisConfig = {
    limit: 20,
    descriptionMaxLength: 250,
    colors: true,
  };

  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    initColors(false);
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('outputs categories sorted alphabetically by default', () => {
    handleCategories(mockApis, {}, config);
    const output = consoleLogSpy.mock.calls[0][0] as string;
    expect(output).toContain('Found 2 categories:');
    expect(output).toContain('data');
    expect(output).toContain('weather');
  });

  it('sorts by count when specified', () => {
    const mockApisWithDifferentCounts: ApiEntry[] = [
      ...mockApis,
      {
        name: 'Third API',
        description: 'Test',
        link: 'https://test.com',
        categories: ['weather'],
        auth: null,
        cors: null,
        openapiSpec: null,
        sources: [],
      },
    ];
    handleCategories(mockApisWithDifferentCounts, { sort: 'count' }, config);
    const output = consoleLogSpy.mock.calls[0][0] as string;
    const weatherIdx = output.indexOf('weather');
    const dataIdx = output.indexOf('data');
    expect(weatherIdx).toBeLessThan(dataIdx);
  });

  it('outputs JSON when specified', () => {
    handleCategories(mockApis, { output: 'json', color: false }, config);
    const output = consoleLogSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(output);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toEqual({ name: 'data', count: 2 });
    expect(parsed[1]).toEqual({ name: 'weather', count: 2 });
  });

  it('disables colors when color is false', () => {
    handleCategories(mockApis, { color: false }, config);
    const output = consoleLogSpy.mock.calls[0][0] as string;
    expect(output).toContain('Found 2 categories:');
    expect(output).toContain('data');
    expect(output).toContain('weather');
  });
});
