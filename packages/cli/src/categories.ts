import type { LsApisConfig, ApiEntry } from '@ls-apis/shared/types';
import { getCategories } from '@ls-apis/shared/search';
import { formatList } from './formatter';
import { initColors } from './colors';

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
