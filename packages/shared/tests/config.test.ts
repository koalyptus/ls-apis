import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadConfig, getConfig, clearConfigCache, CONFIG_PATH } from '../src/config.js';
import { readFile, writeFile, access } from 'node:fs/promises';

const EXPECTED_DEFAULTS = {
  limit: 20,
  descriptionMaxLength: 250,
  colors: true,
};

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn().mockResolvedValue(undefined),
  access: vi.fn(),
}));

vi.mock('node:os', () => ({
  homedir: vi.fn().mockReturnValue('/fake/home'),
}));

describe('config - extended', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    clearConfigCache();
  });

  it('CONFIG_PATH is under home directory', () => {
    expect(CONFIG_PATH).toContain('.ls-apis');
  });

  it('getConfig returns config and file path', async () => {
    vi.mocked(readFile).mockResolvedValue(JSON.stringify(EXPECTED_DEFAULTS));
    vi.mocked(access).mockResolvedValue(undefined);
    const result = await getConfig();
    expect(result.config).toEqual(EXPECTED_DEFAULTS);
    expect(result.filePath).toBe(CONFIG_PATH);
  });

  it('caches config between calls', async () => {
    vi.mocked(readFile).mockResolvedValue(JSON.stringify(EXPECTED_DEFAULTS));
    vi.mocked(access).mockResolvedValue(undefined);
    const a = await loadConfig();
    const b = await loadConfig();
    expect(a).toBe(b);
    expect(readFile).toHaveBeenCalledTimes(1);
  });

  it('re-reads after clearConfigCache', async () => {
    vi.mocked(readFile).mockResolvedValue(JSON.stringify(EXPECTED_DEFAULTS));
    vi.mocked(access).mockResolvedValue(undefined);
    await loadConfig();
    clearConfigCache();
    vi.mocked(readFile).mockClear();
    vi.mocked(readFile).mockResolvedValue(JSON.stringify(EXPECTED_DEFAULTS));
    vi.mocked(access).mockResolvedValue(undefined);
    await loadConfig();
    expect(readFile).toHaveBeenCalledTimes(1);
  });

  it('handles empty config file (empty object)', async () => {
    vi.mocked(readFile).mockResolvedValue('{}');
    vi.mocked(access).mockResolvedValue(undefined);
    const config = await loadConfig();
    expect(config).toEqual(EXPECTED_DEFAULTS);
  });

  it('handles config with extra fields (ignores them)', async () => {
    vi.mocked(readFile).mockResolvedValue(JSON.stringify({ limit: 5, unknownField: 'ignored' }));
    vi.mocked(access).mockResolvedValue(undefined);
    const config = await loadConfig();
    expect(config.limit).toBe(5);
    expect(config.descriptionMaxLength).toBe(250);
    expect(config.colors).toBe(true);
  });

  it('handles config with limit=0', async () => {
    vi.mocked(readFile).mockResolvedValue(JSON.stringify({ limit: 0 }));
    vi.mocked(access).mockResolvedValue(undefined);
    const config = await loadConfig();
    expect(config.limit).toBe(0);
  });

  it('handles config with descriptionMaxLength=0', async () => {
    vi.mocked(readFile).mockResolvedValue(JSON.stringify({ descriptionMaxLength: 0 }));
    vi.mocked(access).mockResolvedValue(undefined);
    const config = await loadConfig();
    expect(config.descriptionMaxLength).toBe(0);
  });

  it('handles config with colors=false', async () => {
    vi.mocked(readFile).mockResolvedValue(JSON.stringify({ colors: false }));
    vi.mocked(access).mockResolvedValue(undefined);
    const config = await loadConfig();
    expect(config.colors).toBe(false);
  });

  it('creates config file with defaults when missing', async () => {
    vi.mocked(readFile).mockRejectedValue(new Error('ENOENT'));
    vi.mocked(access).mockRejectedValue(new Error('ENOENT'));
    await loadConfig();
    expect(writeFile).toHaveBeenCalledWith(CONFIG_PATH, expect.stringContaining('"limit": 20'));
  });
});
