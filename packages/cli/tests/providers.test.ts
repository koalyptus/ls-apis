import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleProviders } from '../src/providers';
import { run } from '../src/index';
import { initColors } from '../src/colors';
import type { Provider } from '../src/types';
import type { LsApisConfig } from '../src/config';
import * as fs from 'node:fs/promises';

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

const mockProviders: Provider[] = [
  { name: 'apis-guru', url: 'https://api.apis.guru/v2/list.json' },
  { name: 'github-public-apis', url: 'https://github.com/public-apis/public-apis' },
  { name: 'publicapis-dev', url: 'https://publicapis.dev' },
];

const mockConfig: LsApisConfig = {
  limit: 20,
  descriptionMaxLength: 250,
  colors: false,
};

const mockApis = [
  {
    name: 'A',
    description: null,
    link: 'https://a.com',
    auth: null,
    cors: null,
    categories: ['Test'],
    sources: ['apis-guru'],
    openapiSpec: null,
  },
  {
    name: 'B',
    description: null,
    link: 'https://b.com',
    auth: null,
    cors: null,
    categories: ['Test'],
    sources: ['apis-guru'],
    openapiSpec: null,
  },
  {
    name: 'C',
    description: null,
    link: 'https://c.com',
    auth: null,
    cors: null,
    categories: ['Test'],
    sources: ['github-public-apis'],
    openapiSpec: null,
  },
];

describe('providers', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    initColors(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('handleProviders', () => {
    it('outputs providers list with counts', () => {
      handleProviders(mockProviders, mockApis, {}, mockConfig);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Found 3 providers:'));
    });

    it('includes provider URLs and counts', () => {
      handleProviders(mockProviders, mockApis, {}, mockConfig);
      const output = consoleLogSpy.mock.calls[0][0] as string;
      expect(output).toContain('https://api.apis.guru/v2/list.json');
      expect(output).toContain('APIs)');
    });

    it('sorts providers alphabetically by name by default', () => {
      handleProviders(mockProviders, mockApis, {}, mockConfig);
      const output = consoleLogSpy.mock.calls[0][0] as string;
      const apisGuruIdx = output.indexOf('apis-guru');
      const githubIdx = output.indexOf('github-public-apis');
      const publicapisIdx = output.indexOf('publicapis-dev');
      expect(apisGuruIdx).toBeLessThan(githubIdx);
      expect(githubIdx).toBeLessThan(publicapisIdx);
    });

    it('sorts by count when specified', () => {
      handleProviders(mockProviders, mockApis, { sort: 'count' }, mockConfig);
      const output = consoleLogSpy.mock.calls[0][0] as string;
      const apisGuruIdx = output.indexOf('apis-guru');
      const githubIdx = output.indexOf('github-public-apis');
      const publicapisIdx = output.indexOf('publicapis-dev');
      expect(apisGuruIdx).toBeLessThan(githubIdx);
      expect(githubIdx).toBeLessThan(publicapisIdx);
    });

    it('outputs JSON when specified', () => {
      handleProviders(mockProviders, mockApis, { output: 'json' }, mockConfig);
      const output = consoleLogSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output);
      expect(parsed).toHaveLength(3);
      expect(parsed[0]).toHaveProperty('name');
      expect(parsed[0]).toHaveProperty('url');
      expect(parsed[0]).toHaveProperty('count');
    });

    it('handles empty providers list', () => {
      handleProviders([], [], {}, mockConfig);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Found 0 providers:'));
    });
  });
});

describe('run with providers command', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.mocked(fs.readFile).mockImplementation((path: string) => {
      if (path.includes('package.json')) {
        return Promise.resolve('{"version": "0.0.0"}');
      }
      return Promise.resolve(
        JSON.stringify({
          timestamp: '2026-05-09T00:00:00Z',
          providers: mockProviders,
          apis: mockApis,
        })
      );
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists providers with counts', async () => {
    await run(['providers']);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Found 3 providers:'));
  });

  it('sorts by count when specified', async () => {
    await run(['providers', '--sort', 'count']);
    const output = consoleLogSpy.mock.calls.map((c) => c[0]).join('');
    const apisGuruIdx = output.indexOf('apis-guru');
    const githubIdx = output.indexOf('github-public-apis');
    const publicapisIdx = output.indexOf('publicapis-dev');
    expect(apisGuruIdx).toBeLessThan(githubIdx);
    expect(githubIdx).toBeLessThan(publicapisIdx);
  });

  it('outputs JSON format with counts', async () => {
    await run(['providers', '--output', 'json']);
    const jsonCall = consoleLogSpy.mock.calls.find(
      (c) => typeof c[0] === 'string' && c[0].startsWith('[')
    );
    expect(jsonCall).toBeDefined();
    const parsed = JSON.parse(jsonCall![0] as string);
    expect(parsed).toHaveLength(3);
    expect(parsed[0]).toHaveProperty('name');
    expect(parsed[0]).toHaveProperty('url');
    expect(parsed[0]).toHaveProperty('count');
  });
});
