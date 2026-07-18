import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { realpathSync } from 'node:fs';
import { resolveDataFile, resolveRejectedFile } from '@ls-apis/shared/paths';

export function getCurrentDir(metaUrl: string): string {
  return path.dirname(realpathSync(fileURLToPath(metaUrl)));
}

export { resolveDataFile, resolveRejectedFile };
