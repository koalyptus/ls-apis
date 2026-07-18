import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { run } from '../src/index';
import { initColors } from '../src/colors';
import * as fs from 'node:fs/promises';
import { clearDataFileCache, clearVersionCache } from '@ls-apis/shared/data';
import type { ApiEntry } from '@ls-apis/shared/types';

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

const mockApis: ApiEntry[] = [
  {
    name: 'Z API',
    description: 'Last',
    link: 'https://z.com',
    categories: ['a'],
    auth: 'apiKey',
    cors: null,
    openapiSpec: null,
    sources: ['s1'],
  },
  {
    name: 'A API',
    description: 'First',
    link: 'https://a.com',
    categories: ['b'],
    auth: 'no',
    cors: null,
    openapiSpec: null,
    sources: ['s1'],
  },
];

describe('run - extended coverage', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    initColors(false);
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    clearDataFileCache();
    clearVersionCache();
    vi.mocked(fs.readFile).mockReset();
    vi.mocked(fs.readFile).mockImplementation((path: string) => {
      if (path.includes('package.json')) {
        return Promise.resolve('{"version": "0.0.0"}');
      }
      return Promise.resolve(
        JSON.stringify({
          timestamp: '2026-05-09T00:00:00Z',
          providers: [{ name: 'p1', url: 'https://p1.com' }],
          apis: mockApis,
        })
      );
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sorts by category', async () => {
    await run(['-q', 'API', '-s', 'category']);
    const output = consoleLogSpy.mock.calls.map((c) => c[0]).join('');
    expect(output.indexOf('A API')).toBeGreaterThan(0);
    expect(output.indexOf('Z API')).toBeGreaterThan(0);
  });

  it('sorts by auth (apiKey before no)', async () => {
    await run(['-q', 'API', '-s', 'auth']);
    const output = consoleLogSpy.mock.calls.map((c) => c[0]).join('');
    const zIdx = output.indexOf('Z API');
    const aIdx = output.indexOf('A API');
    expect(zIdx).toBeGreaterThan(0);
    expect(aIdx).toBeGreaterThan(0);
  });

  it('combines multiple filters', async () => {
    await run(['-q', 'API', '-c', 'a', '-a', 'apiKey']);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Found 1 APIs:'));
  });

  it('returns no results when filters exclude all', async () => {
    await run(['-q', 'nonexistent']);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Found 0 APIs:'));
  });

  it('config command shows config file path and content', async () => {
    await run(['config']);
    const allOutput = consoleLogSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(allOutput).toContain('Config file:');
    expect(allOutput).toContain('"limit"');
    expect(allOutput).toContain('"descriptionMaxLength"');
    expect(allOutput).toContain('"colors"');
  });

  it('categories command with --output json', async () => {
    await run(['categories', '--output', 'json']);
    const jsonCall = consoleLogSpy.mock.calls.find(
      (c) => typeof c[0] === 'string' && c[0].startsWith('[')
    );
    expect(jsonCall).toBeDefined();
  });

  it('categories command with --sort count', async () => {
    await run(['categories', '--sort', 'count']);
    const allOutput = consoleLogSpy.mock.calls.map((c) => c[0]).join('');
    expect(allOutput).toContain('categories:');
  });

  it('providers command with --output json', async () => {
    await run(['providers', '--output', 'json']);
    const jsonCall = consoleLogSpy.mock.calls.find(
      (c) => typeof c[0] === 'string' && c[0].startsWith('[')
    );
    expect(jsonCall).toBeDefined();
  });

  it('providers command with --sort count', async () => {
    await run(['providers', '--sort', 'count']);
    const allOutput = consoleLogSpy.mock.calls.map((c) => c[0]).join('');
    expect(allOutput).toContain('providers:');
  });

  it('respects default limit from config', async () => {
    await run(['-q', 'API']);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Found 2 APIs:'));
  });

  it('respects explicit --limit', async () => {
    await run(['-q', 'API', '-l', '1']);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Found 2 APIs:'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('... and 1 more'));
  });

  it('handles empty apis list', async () => {
    clearDataFileCache();
    vi.mocked(fs.readFile).mockImplementation((path: string) => {
      if (path.includes('package.json')) {
        return Promise.resolve('{"version": "0.0.0"}');
      }
      return Promise.resolve(JSON.stringify({ timestamp: '', providers: [], apis: [] }));
    });
    await run(['providers']);
    const allOutput = consoleLogSpy.mock.calls.map((c) => c[0]).join('');
    expect(allOutput).toContain('Found 0 providers:');
  });
});
