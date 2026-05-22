import { dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

export function projectRoot(metaUrl: string): string {
  let dir = dirname(fileURLToPath(metaUrl));
  while (true) {
    if (basename(dir) === 'packages') {
      return dirname(dir);
    }
    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error('Could not determine project root');
    }
    dir = parent;
  }
}
