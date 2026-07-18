import type { ApiEntry, LsApisConfig } from '@ls-apis/shared/types';
import { getCategories } from '@ls-apis/shared/search';
import { formatList } from './formatter';
import { initColorsFromConfig } from './colors';

export function handleCategories(
  apis: ApiEntry[],
  argv: { sort?: string; output?: string; color?: boolean },
  config: LsApisConfig
): void {
  initColorsFromConfig(argv.color === false, config.colors ?? true);
  const categories = getCategories(apis);
  const output = formatList(categories, 'categories', {
    sort: argv.sort as 'name' | 'count',
    output: argv.output as 'text' | 'json',
  });
  console.log(output);
}
