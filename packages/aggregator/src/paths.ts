import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { realpathSync } from 'node:fs';

function getCurrentDir(metaUrl: string): string {
  return path.dirname(realpathSync(fileURLToPath(metaUrl)));
}

export function resolveDataFile(metaUrl: string): string {
  const currentDir = getCurrentDir(metaUrl);
  return path.join(currentDir, '../../cli/data/apis.json');
}
