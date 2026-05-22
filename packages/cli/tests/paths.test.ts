import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { accessSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { projectRoot } from '../src/paths';

describe('projectRoot', () => {
  it('should resolve project root from within packages directory', () => {
    const root = projectRoot(import.meta.url);
    const rootPackageJson = path.join(root, 'package.json');
    const cliPackage = path.join(root, 'packages', 'cli');
    expect(() => accessSync(rootPackageJson)).not.toThrow();
    expect(() => accessSync(cliPackage)).not.toThrow();
  });

  it('should return parent of packages directory, not packages itself', () => {
    const root = projectRoot(import.meta.url);
    expect(path.basename(root)).not.toBe('packages');
  });

  it('should throw when packages directory is not found in ancestors', () => {
    const testPath = path.resolve('/tmp', 'some', 'deep', 'path', 'file.ts');
    const url = pathToFileURL(testPath);
    expect(() => projectRoot(url.href)).toThrow('Could not determine project root');
  });
});
