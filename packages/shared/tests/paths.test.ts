import { describe, it, expect } from 'vitest';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { projectRoot, resolveDataFile, resolveRejectedFile } from '../src/paths.js';

describe('paths', () => {
  const srcFile = path.resolve('packages/shared/src/paths.ts');
  const fakeMetaUrl = pathToFileURL(srcFile).href;

  it('resolves project root from meta URL', () => {
    const root = projectRoot(fakeMetaUrl);
    const expected = path.resolve('');
    expect(root).toBe(expected);
  });

  it('resolves data file path', () => {
    const dataFile = resolveDataFile(fakeMetaUrl);
    const expected = path.resolve('packages/cli/data/apis.json');
    expect(dataFile).toBe(expected);
  });

  it('resolves rejected file path', () => {
    const rejectedFile = resolveRejectedFile(fakeMetaUrl);
    const expected = path.resolve('qa-output/rejected.json');
    expect(rejectedFile).toBe(expected);
  });
});
