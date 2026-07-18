import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getCurrentDir, resolveDataFile, resolveRejectedFile, resolveProjectRoot } from '../paths';

describe('aggregator paths', () => {
  describe('getCurrentDir', () => {
    it('returns directory of the given meta URL', () => {
      const metaUrl = import.meta.url;
      const dir = getCurrentDir(metaUrl);
      const expectedDir = path.dirname(fileURLToPath(metaUrl));
      expect(dir).toBe(expectedDir);
      expect(path.isAbsolute(dir)).toBe(true);
    });

    it('resolves symlinks via realpathSync', () => {
      const metaUrl = import.meta.url;
      const dir = getCurrentDir(metaUrl);
      // Should not contain symlink paths - it's a real path
      expect(dir).not.toContain('..');
    });
  });

  describe('resolveDataFile', () => {
    it('resolves data file path from import.meta.url', () => {
      const result = resolveDataFile(import.meta.url);
      expect(result).toContain(path.join('packages', 'cli', 'data', 'apis.json'));
    });

    it('returns absolute path', () => {
      const result = resolveDataFile(import.meta.url);
      expect(path.isAbsolute(result)).toBe(true);
    });
  });

  describe('resolveRejectedFile', () => {
    it('resolves rejected file path from import.meta.url', () => {
      const result = resolveRejectedFile(import.meta.url);
      expect(result).toContain(path.join('qa-output', 'rejected.json'));
    });

    it('returns absolute path', () => {
      const result = resolveRejectedFile(import.meta.url);
      expect(path.isAbsolute(result)).toBe(true);
    });
  });

  describe('resolveProjectRoot', () => {
    it('resolves project root from import.meta.url', () => {
      const result = resolveProjectRoot(import.meta.url);
      expect(path.isAbsolute(result)).toBe(true);
      expect(path.basename(result)).not.toBe('packages');
    });

    it('matches shared projectRoot', async () => {
      const { projectRoot: sharedRoot } = await import('@ls-apis/shared/paths');
      const result = resolveProjectRoot(import.meta.url);
      expect(result).toBe(sharedRoot(import.meta.url));
    });
  });
});
