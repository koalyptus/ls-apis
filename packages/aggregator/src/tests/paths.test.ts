import { describe, it, expect } from 'vitest';
import { resolveDataFile } from '../paths';

describe('resolveDataFile', () => {
  it('should resolve data file path from import.meta.url', () => {
    const result = resolveDataFile(import.meta.url);
    expect(result).toMatch(/data.*apis\.json$/i);
  });
});
