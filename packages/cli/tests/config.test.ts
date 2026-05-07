import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadConfig, CONFIG_DEFAULTS } from '../src/config';
import { readFile, writeFile, access } from 'node:fs/promises';

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn().mockResolvedValue(undefined),
  access: vi.fn(),
}));

vi.mock('node:os', () => ({
  homedir: vi.fn().mockReturnValue('/fake/home'),
}));

describe('config', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns defaults when config file is missing', async () => {
    vi.mocked(readFile).mockRejectedValue(new Error('ENOENT'));
    vi.mocked(access).mockRejectedValue(new Error('ENOENT'));
    const config = await loadConfig();
    expect(config).toEqual(CONFIG_DEFAULTS);
  });

  it('creates config file when missing', async () => {
    vi.mocked(readFile).mockRejectedValue(new Error('ENOENT'));
    vi.mocked(access).mockRejectedValue(new Error('ENOENT'));
    await loadConfig();
    expect(writeFile).toHaveBeenCalled();
  });

  it('returns defaults when config file is invalid JSON', async () => {
    vi.mocked(readFile).mockResolvedValue('{invalid json}');
    vi.mocked(access).mockResolvedValue(undefined);
    const config = await loadConfig();
    expect(config).toEqual(CONFIG_DEFAULTS);
  });

  it('parses valid config file', async () => {
    vi.mocked(readFile).mockResolvedValue(
      JSON.stringify({ limit: 5, descriptionMaxLength: 100, colors: false })
    );
    vi.mocked(access).mockResolvedValue(undefined);
    const config = await loadConfig();
    expect(config.limit).toBe(5);
    expect(config.descriptionMaxLength).toBe(100);
    expect(config.colors).toBe(false);
  });

  it('merges partial config with defaults', async () => {
    vi.mocked(readFile).mockResolvedValue(JSON.stringify({ limit: 10 }));
    vi.mocked(access).mockResolvedValue(undefined);
    const config = await loadConfig();
    expect(config.limit).toBe(10);
    expect(config.descriptionMaxLength).toBe(250);
    expect(config.colors).toBe(true);
  });

  it('does not create config file when it already exists', async () => {
    vi.mocked(readFile).mockRejectedValue(new Error('ENOENT'));
    vi.mocked(access).mockResolvedValue(undefined);
    await loadConfig();
    expect(writeFile).not.toHaveBeenCalled();
  });
});
