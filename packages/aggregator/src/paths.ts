import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { realpathSync } from 'node:fs';

export function getCurrentDir(metaUrl: string): string {
  return path.dirname(realpathSync(fileURLToPath(metaUrl)));
}

export function toFileUrl(filePath: string): string {
  return pathToFileURL(filePath).href;
}

export function resolveDataFile(metaUrl: string): string {
  const currentDir = getCurrentDir(metaUrl);
  return path.join(currentDir, '../../../data/apis.json');
}
