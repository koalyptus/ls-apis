import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('initColorsFromConfig', () => {
  let initColors: (noColor?: boolean) => void;
  let initColorsFromConfig: (argvColor: boolean | undefined, configColor: boolean) => void;
  let color: { bold: (text: string) => string };

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../src/colors');
    initColors = mod.initColors;
    initColorsFromConfig = mod.initColorsFromConfig;
    color = mod.color;
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('enables colors when argvColor is undefined and configColor is true', () => {
    initColors(false);
    initColorsFromConfig(undefined, true);
    expect(color.bold('test')).not.toBe('test');
  });

  it('disables colors when argvColor is undefined and configColor is false', () => {
    initColors(false);
    initColorsFromConfig(undefined, false);
    expect(color.bold('test')).toBe('test');
  });

  it('does not override configColor when argvColor is true (no --no-color flag)', () => {
    initColors(false);
    initColorsFromConfig(true, false);
    expect(color.bold('test')).toBe('test');
  });

  it('NO_COLOR env var overrides config', () => {
    initColors(false);
    vi.stubEnv('NO_COLOR', '1');
    initColorsFromConfig(undefined, true);
    expect(color.bold('test')).toBe('test');
  });

  it('NO_COLOR env var overrides even when argvColor is false', () => {
    initColors(false);
    vi.stubEnv('NO_COLOR', '1');
    initColorsFromConfig(false, true);
    expect(color.bold('test')).toBe('test');
  });
});
