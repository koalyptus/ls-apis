import type { ApiEntry, Provider, LsApisConfig } from '@ls-apis/shared/types';
import { getProviders } from '@ls-apis/shared/search';
import { formatProviders } from './formatter';
import { initColors } from './colors';

export function handleProviders(
  providers: Provider[],
  apis: ApiEntry[],
  argv: { sort?: string; output?: string; color?: boolean },
  config: LsApisConfig
): void {
  const noColor = argv.color === false;
  initColors(noColor ?? !config.colors);

  const counts = getProviders(apis);

  const providersWithCounts = providers.map((p) => ({
    ...p,
    count: counts.get(p.name) ?? 0,
  }));

  const output = formatProviders(providersWithCounts, {
    sort: argv.sort as 'name' | 'count',
    output: argv.output as 'text' | 'json',
  });
  console.log(output);
}
