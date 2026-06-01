import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveDataFile } from './paths';
import type { DataFile } from './types';

let cached: DataFile | null = null;
let cachedVersion: string | null = null;

export async function loadDataFile(metaUrl: string, explicitPath?: string): Promise<DataFile> {
  if (cached) {
    return cached;
  }
  const dataFilePath = explicitPath ?? resolveDataFile(metaUrl);
  const raw = await readFile(dataFilePath, 'utf-8');
  cached = JSON.parse(raw) as DataFile;
  return cached;
}

export async function getVersion(metaUrl: string): Promise<string> {
  if (cachedVersion) {
    return cachedVersion;
  }
  const pkgPath = join(dirname(fileURLToPath(metaUrl)), '../package.json');
  const pkg = JSON.parse(await readFile(pkgPath, 'utf-8'));
  cachedVersion = pkg.version;
  return cachedVersion!;
}

export function clearDataFileCache(): void {
  cached = null;
  cachedVersion = null;
}
