import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadDataFile, clearDataFileCache, getVersion, clearVersionCache } from '../src/index.js';
import { readFile } from 'node:fs/promises';

const mockData = {
  timestamp: '2026-05-28T00:00:00.000Z',
  providers: [{ name: 'source-a', url: 'https://a.com' }],
  apis: [
    { name: 'API One', link: 'https://api1.com', categories: ['weather'], sources: ['source-a'] },
  ],
};

const mockPkg = { version: '1.2.3' };

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

describe('loadDataFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockData));
    clearDataFileCache();
  });

  afterEach(() => {
    clearDataFileCache();
  });

  it('loads and parses the data file', async () => {
    const data = await loadDataFile(import.meta.url);
    expect(data.timestamp).toBe('2026-05-28T00:00:00.000Z');
    expect(data.providers).toHaveLength(1);
    expect(data.apis).toHaveLength(1);
  });

  it('caches the result and reuses it', async () => {
    const a = await loadDataFile(import.meta.url);
    const b = await loadDataFile(import.meta.url);
    expect(a).toBe(b);
    expect(readFile).toHaveBeenCalledTimes(1);
  });

  it('uses explicit path when provided', async () => {
    const customPath = '/custom/path/apis.json';
    await loadDataFile(import.meta.url, customPath);
    expect(readFile).toHaveBeenCalledWith(customPath, 'utf-8');
  });

  it('re-reads the file after cache is cleared', async () => {
    await loadDataFile(import.meta.url);
    clearDataFileCache();
    vi.mocked(readFile).mockClear();
    vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockData));
    await loadDataFile(import.meta.url);
    expect(readFile).toHaveBeenCalledTimes(1);
  });

  it('handles empty apis array', async () => {
    vi.mocked(readFile).mockResolvedValue(
      JSON.stringify({ timestamp: '', providers: [], apis: [] })
    );
    const data = await loadDataFile(import.meta.url);
    expect(data.apis).toHaveLength(0);
    expect(data.providers).toHaveLength(0);
  });

  it('propagates file read errors', async () => {
    vi.mocked(readFile).mockRejectedValue(new Error('ENOENT'));
    clearDataFileCache();
    await expect(loadDataFile(import.meta.url)).rejects.toThrow('ENOENT');
  });

  it('propagates JSON parse errors', async () => {
    vi.mocked(readFile).mockResolvedValue('not valid json');
    clearDataFileCache();
    await expect(loadDataFile(import.meta.url)).rejects.toThrow();
  });
});

describe('getVersion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockPkg));
    clearVersionCache();
  });

  afterEach(() => {
    clearVersionCache();
  });

  it("reads version from the caller's package.json", async () => {
    const version = await getVersion(import.meta.url);
    expect(version).toBe('1.2.3');
  });

  it('caches the version', async () => {
    const a = await getVersion(import.meta.url);
    const b = await getVersion(import.meta.url);
    expect(a).toBe(b);
    expect(readFile).toHaveBeenCalledTimes(1);
  });

  it('re-reads after cache is cleared', async () => {
    await getVersion(import.meta.url);
    clearVersionCache();
    vi.mocked(readFile).mockClear();
    vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockPkg));
    await getVersion(import.meta.url);
    expect(readFile).toHaveBeenCalledTimes(1);
  });
});
