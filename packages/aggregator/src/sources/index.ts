import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { SourceFetcher } from '../types';
import { getCurrentDir } from '../paths';

const FETCHER_SUFFIX = '.fetcher.ts';

export async function loadAllFetchers(): Promise<SourceFetcher[]> {
  const sourcesDir = getCurrentDir(import.meta.url);
  const files = (await fs.readdir(sourcesDir)).filter((f: string) => f.endsWith(FETCHER_SUFFIX));

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

export function isSourceFetcher(obj: unknown): obj is SourceFetcher {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as SourceFetcher).name === 'string' &&
    typeof (obj as SourceFetcher).sourceUrl === 'string' &&
    typeof (obj as SourceFetcher).fetchApis === 'function'
  );
}
