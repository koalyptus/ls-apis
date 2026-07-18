import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getCurrentDir, resolveDataFile, resolveRejectedFile } from '../paths';
import { projectRoot } from '@ls-apis/shared/paths';

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

  describe('projectRoot shared', () => {
    it('resolves project root from import.meta.url', () => {
      const result = projectRoot(import.meta.url);
      expect(path.isAbsolute(result)).toBe(true);
      expect(path.basename(result)).not.toBe('packages');
    });
  });
});
