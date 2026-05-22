import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { realpathSync } from 'node:fs';

export function getCurrentDir(metaUrl: string): string {
  return path.dirname(realpathSync(fileURLToPath(metaUrl)));
}

function projectRoot(metaUrl: string): string {
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

export function resolveProjectRoot(metaUrl: string): string {
  return projectRoot(metaUrl);
}

export function resolveRejectedFile(metaUrl: string): string {
  return path.join(projectRoot(metaUrl), 'qa-output', 'rejected.json');
}
