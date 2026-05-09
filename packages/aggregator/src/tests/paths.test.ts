import { describe, it, expect } from 'vitest';
import * as pathsModule from '../paths';

describe('paths', () => {
  describe('getCurrentDir', () => {
    it('should work with actual import.meta.url', () => {
      const result = pathsModule.getCurrentDir(import.meta.url);
      expect(result).toBeTruthy();
      expect(result).toContain('src');
    });
  });

  describe('toFileUrl', () => {
    it('should convert current directory path to file URL', () => {
      const result = pathsModule.toFileUrl(process.cwd());
      expect(result).toMatch(/^file:\/\//);
    });
  });

  describe('resolveDataFile', () => {
    it('should resolve data file path from import.meta.url', () => {
      const result = pathsModule.resolveDataFile(import.meta.url);
      expect(result).toMatch(/data.*apis\.json$/i);
    });
  });
});
