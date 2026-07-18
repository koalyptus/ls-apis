import { describe, it, expect } from 'vitest';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { projectRoot, resolveDataFile, resolveRejectedFile } from '../src/paths.js';

describe('paths - extended', () => {
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

  it('resolves data file under project root', () => {
    const dataFile = resolveDataFile(fakeMetaUrl);
    const expectedSegment = path.join('packages', 'cli', 'data', 'apis.json');
    expect(dataFile).toContain(expectedSegment);
  });

  it('resolves rejected file under project root', () => {
    const rejectedFile = resolveRejectedFile(fakeMetaUrl);
    const expectedSegment = path.join('qa-output', 'rejected.json');
    expect(rejectedFile).toContain(expectedSegment);
  });

  it('projectRoot returns absolute path', () => {
    const root = projectRoot(fakeMetaUrl);
    expect(path.isAbsolute(root)).toBe(true);
  });

  it('projectRoot does not include "packages" in result', () => {
    const root = projectRoot(fakeMetaUrl);
    expect(path.basename(root)).not.toBe('packages');
  });

  it('handles nested package paths', () => {
    const deepFile = path.resolve('packages/shared/src/nested/deep/file.ts');
    const deepUrl = pathToFileURL(deepFile).href;
    const root = projectRoot(deepUrl);
    expect(root).toBe(path.resolve(''));
  });
});
