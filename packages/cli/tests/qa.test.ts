import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runQa } from '../src/qa';

vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

describe('runQa', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('executes aggregator QA script without output flag', async () => {
    const { execSync } = await import('node:child_process');

    await runQa(250);

    expect(execSync).toHaveBeenCalledOnce();
    const [cmd, opts] = vi.mocked(execSync).mock.calls[0];
    expect(cmd).toContain('index.ts');
    expect(cmd).not.toContain('--output');
    expect(opts.stdio).toBe('inherit');
  });

  it('passes --output flag when outputFile is given', async () => {
    const { execSync } = await import('node:child_process');

    await runQa(250, 'custom-qa.json');

    const [cmd] = vi.mocked(execSync).mock.calls[0];
    expect(cmd).toContain('--output');
    expect(cmd).toContain('custom-qa.json');
  });

  it('uses npx tsx to run the script', async () => {
    const { execSync } = await import('node:child_process');

    await runQa(250);

    const [cmd] = vi.mocked(execSync).mock.calls[0];
    expect(cmd).toContain('npx');
    expect(cmd).toContain('tsx');
  });

  it('accepts different descriptionMaxLength values', async () => {
    const { execSync } = await import('node:child_process');

    await runQa(100);

    expect(execSync).toHaveBeenCalledOnce();
  });

  it('does not add --output for undefined file', async () => {
    const { execSync } = await import('node:child_process');

    await runQa(250, undefined);

    const [cmd] = vi.mocked(execSync).mock.calls[0];
    expect(cmd).not.toContain('--output');
  });

  it('propagates errors from execSync', async () => {
    const { execSync } = await import('node:child_process');
    vi.mocked(execSync).mockImplementation(() => {
      throw new Error('QA failed');
    });

    await expect(runQa(250)).rejects.toThrow('QA failed');
  });
});
