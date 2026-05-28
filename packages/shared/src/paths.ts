import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function projectRoot(metaUrl: string): string {
  let dir = path.dirname(fileURLToPath(metaUrl));
  while (true) {
    if (path.basename(dir) === 'packages') {
      return path.dirname(dir);
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error('Could not determine project root');
    }
    dir = parent;
  }
}

export function resolveDataFile(metaUrl: string): string {
  return path.join(projectRoot(metaUrl), 'packages', 'cli', 'data', 'apis.json');
}

export function resolveRejectedFile(metaUrl: string): string {
  return path.join(projectRoot(metaUrl), 'qa-output', 'rejected.json');
}
