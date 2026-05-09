import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { realpathSync } from 'node:fs';
import type { SourceFetcher } from '../types';

export async function loadAllFetchers(): Promise<SourceFetcher[]> {
  const sourcesDir = path.dirname(realpathSync(fileURLToPath(import.meta.url)));
  const files = (await fs.readdir(sourcesDir)).filter((f: string) => f.endsWith('.fetcher.ts'));

  const fetchers: SourceFetcher[] = [];

  for (const file of files) {
    const filePath = path.join(sourcesDir, file);
    const module = await import(pathToFileURL(filePath).href);
    const fetcher = (module as { default?: SourceFetcher }).default || module;

    if (isSourceFetcher(fetcher)) {
      fetchers.push(fetcher);
    }
  }

  return fetchers;
}

function isSourceFetcher(obj: unknown): obj is SourceFetcher {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as SourceFetcher).name === 'string' &&
    typeof (obj as SourceFetcher).sourceUrl === 'string' &&
    typeof (obj as SourceFetcher).fetchApis === 'function'
  );
}

export { isSourceFetcher };
