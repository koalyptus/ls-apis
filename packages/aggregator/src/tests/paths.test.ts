import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { resolveDataFile } from '../paths';

describe('resolveDataFile', () => {
  it('should resolve data file path from import.meta.url', () => {
    const result = resolveDataFile(import.meta.url);
    expect(result).toContain(path.join('packages', 'cli', 'data', 'apis.json'));
  });
});
