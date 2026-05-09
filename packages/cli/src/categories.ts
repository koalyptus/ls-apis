import type { LsApisConfig } from './config';
import { getCategories } from './search';
import { formatList } from './formatter';
import { initColors } from './colors';
import type { ApiEntry } from './types';

export function handleCategories(
  apis: ApiEntry[],
  argv: { sort?: string; output?: string; color?: boolean },
  config: LsApisConfig
): void {
  const noColor = argv.color === false;
  initColors(noColor ?? !config.colors);
  const categories = getCategories(apis);
  const output = formatList(categories, 'categories', {
    sort: argv.sort as 'name' | 'count',
    output: argv.output as 'text' | 'json',
  });
  console.log(output);
}
