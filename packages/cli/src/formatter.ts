import { color } from './colors';
import type { ApiEntry, FormatOptions, ListOptions, Provider } from '@ls-apis/shared/types';

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + '...';
}

function formatText(
  results: ApiEntry[],
  total: number,
  limit: number,
  options: FormatOptions
): string {
  const maxLen = options.descriptionMaxLength ?? 250;
  const lines: string[] = [];

  lines.push(color.bold(`Found ${total} APIs:`));

  for (const api of results.slice(0, limit)) {
    lines.push(color.cyan(`  ${api.name}`));
    lines.push(
      `  ${color.dim('Description:')} ${truncate(api.description ?? 'No description', maxLen)}`
    );
    lines.push(`  ${color.dim('Link:')} ${api.link}`);
    if (api.auth !== undefined && api.auth !== null) {
      lines.push(`  ${color.dim('Auth:')} ${color.yellow(api.auth)}`);
    }
    if (api.categories.length > 0) {
      lines.push(`  ${color.dim('Categories:')} ${color.green(api.categories.join(', '))}`);
    }
    if (api.openapiSpec !== undefined && api.openapiSpec !== null) {
      lines.push(`  ${color.dim('OpenAPI Spec:')} ${api.openapiSpec}`);
    }
    if (api.sources.length > 0) {
      lines.push(`  ${color.dim('Sources:')} ${api.sources.join(', ')}`);
    }
    lines.push('');
  }

  if (results.length > limit) {
    lines.push(`  ${color.dim('... and ' + (results.length - limit) + ' more')}`);
  }

  return lines.join('\n');
}

function formatJson(results: ApiEntry[], limit: number): string {
  return JSON.stringify(results.slice(0, limit), null, 2);
}

export function formatResults(
  results: ApiEntry[],
  total: number,
  limit: number,
  options: FormatOptions
): string {
  if (options.output === 'json') {
    return formatJson(results, limit);
  }
  return formatText(results, total, limit, options);
}

export function formatList(
  items: Map<string, number>,
  label: string,
  options: ListOptions
): string {
  const sorted = [...items.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  if (options.sort === 'count') {
    sorted.sort((a, b) => b[1] - a[1]);
  }

  if (options.output === 'json') {
    return JSON.stringify(
      sorted.map(([name, count]) => ({ name, count })),
      null,
      2
    );
  }

  const lines: string[] = [`Found ${sorted.length} ${label}:`];
  for (const [name, count] of sorted) {
    lines.push(`  ${name.padEnd(20)} (${count} APIs)`);
  }
  return lines.join('\n');
}

export function formatProviders(providers: Provider[], options: ListOptions): string {
  const sorted = [...providers].sort((a, b) => a.name.localeCompare(b.name));

  if (options.sort === 'count') {
    sorted.sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
  }

  if (options.output === 'json') {
    return JSON.stringify(sorted, null, 2);
  }

  const lines: string[] = [`Found ${sorted.length} providers:`];
  for (const provider of sorted) {
    const countStr = provider.count !== undefined ? ` (${provider.count} APIs)` : '';
    lines.push(`  ${provider.name.padEnd(20)} ${color.dim(provider.url)}${countStr}`);
  }
  return lines.join('\n');
}
