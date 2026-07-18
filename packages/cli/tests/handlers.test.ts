import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleCategories } from '../src/categories';
import { handleProviders } from '../src/providers';
import { initColors } from '../src/colors';
import type { ApiEntry, Provider, LsApisConfig } from '@ls-apis/shared/types';

const mockApis: ApiEntry[] = [
  {
    name: 'A',
    description: 'A',
    link: 'https://a.com',
    categories: ['cat1'],
    auth: 'apiKey',
    cors: null,
    openapiSpec: null,
    sources: ['prov1'],
  },
  {
    name: 'B',
    description: 'B',
    link: 'https://b.com',
    categories: ['cat1', 'cat2'],
    auth: 'no',
    cors: null,
    openapiSpec: null,
    sources: ['prov2'],
  },
  {
    name: 'C',
    description: 'C',
    link: 'https://c.com',
    categories: ['cat2'],
    auth: 'oauth',
    cors: null,
    openapiSpec: null,
    sources: ['prov1'],
  },
];

const mockProviders: Provider[] = [
  { name: 'prov1', url: 'https://prov1.com' },
  { name: 'prov2', url: 'https://prov2.com' },
];

const mockConfig: LsApisConfig = { limit: 20, descriptionMaxLength: 250, colors: true };

describe('handleCategories', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    initColors(true);
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('outputs categories sorted alphabetically by default', () => {
    handleCategories(mockApis, {}, mockConfig);
    const output = consoleLogSpy.mock.calls[0][0] as string;
    expect(output).toContain('Found 2 categories:');
    expect(output).toContain('cat1');
    expect(output).toContain('cat2');
  });

  it('sorts by count when specified', () => {
    handleCategories(mockApis, { sort: 'count' }, mockConfig);
    const output = consoleLogSpy.mock.calls[0][0] as string;
    const cat1Idx = output.indexOf('cat1');
    const cat2Idx = output.indexOf('cat2');
    expect(cat1Idx).toBeLessThan(cat2Idx);
  });

  it('outputs JSON when specified', () => {
    handleCategories(mockApis, { output: 'json' }, mockConfig);
    const output = consoleLogSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(output);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toHaveProperty('name');
    expect(parsed[0]).toHaveProperty('count');
  });

  it('respects color false', () => {
    handleCategories(mockApis, { color: false }, mockConfig);
    const output = consoleLogSpy.mock.calls[0][0] as string;
    expect(output).toContain('Found 2 categories:');
  });

  it('respects config.colors false', () => {
    handleCategories(mockApis, {}, { ...mockConfig, colors: false });
    const output = consoleLogSpy.mock.calls[0][0] as string;
    expect(output).toContain('Found 2 categories:');
  });

  it('defaults to colors enabled when config.colors is undefined', () => {
    handleCategories(mockApis, {}, { ...mockConfig, colors: undefined });
    const output = consoleLogSpy.mock.calls[0][0] as string;
    expect(output).toContain('Found 2 categories:');
  });
});

describe('handleProviders', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    initColors(true);
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('outputs providers with counts', () => {
    handleProviders(mockProviders, mockApis, {}, mockConfig);
    const output = consoleLogSpy.mock.calls[0][0] as string;
    expect(output).toContain('Found 2 providers:');
    expect(output).toContain('prov1');
    expect(output).toContain('prov2');
  });

  it('includes provider URLs and counts', () => {
    handleProviders(mockProviders, mockApis, {}, mockConfig);
    const output = consoleLogSpy.mock.calls[0][0] as string;
    expect(output).toContain('https://prov1.com');
    expect(output).toContain('APIs)');
  });

  it('sorts providers alphabetically by default', () => {
    handleProviders(mockProviders, mockApis, {}, mockConfig);
    const output = consoleLogSpy.mock.calls[0][0] as string;
    const p1Idx = output.indexOf('prov1');
    const p2Idx = output.indexOf('prov2');
    expect(p1Idx).toBeLessThan(p2Idx);
  });

  it('sorts providers by count', () => {
    handleProviders(mockProviders, mockApis, { sort: 'count' }, mockConfig);
    const output = consoleLogSpy.mock.calls[0][0] as string;
    const p1Idx = output.indexOf('prov1');
    const p2Idx = output.indexOf('prov2');
    expect(p1Idx).toBeLessThan(p2Idx);
  });

  it('outputs JSON for providers', () => {
    handleProviders(mockProviders, mockApis, { output: 'json' }, mockConfig);
    const output = consoleLogSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(output);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toHaveProperty('name');
    expect(parsed[0]).toHaveProperty('url');
    expect(parsed[0]).toHaveProperty('count');
  });

  it('handles empty providers list', () => {
    handleProviders([], mockApis, {}, mockConfig);
    const output = consoleLogSpy.mock.calls[0][0] as string;
    expect(output).toContain('Found 0 providers:');
  });

  it('handles providers with zero count', () => {
    const emptyProv: Provider[] = [{ name: 'empty', url: 'https://empty.com' }];
    handleProviders(emptyProv, mockApis, {}, mockConfig);
    const output = consoleLogSpy.mock.calls[0][0] as string;
    expect(output).toContain('empty');
    expect(output).toContain('(0 APIs)');
  });

  it('defaults to colors enabled when config.colors is undefined', () => {
    handleProviders(mockProviders, mockApis, {}, { ...mockConfig, colors: undefined });
    const output = consoleLogSpy.mock.calls[0][0] as string;
    expect(output).toContain('Found 2 providers:');
  });
});
