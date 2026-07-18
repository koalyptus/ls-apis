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

interface GenericListItem {
  name: string;
  count?: number;
  url?: string;
}

interface GenericListOptions extends ListOptions {
  showUrl?: boolean;
}

function formatListGeneric(
  items: GenericListItem[],
  header: string,
  options: GenericListOptions,
  formatLine: (item: GenericListItem, options: GenericListOptions) => string
): string {
  const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));
  if (options.sort === 'count') {
    sorted.sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
  }

  if (options.output === 'json') {
    return JSON.stringify(sorted, null, 2);
  }

  const lines: string[] = [header];
  for (const item of sorted) {
    lines.push(formatLine(item, options));
  }
  return lines.join('\n');
}

export function formatList(
  items: Map<string, number>,
  label: string,
  options: ListOptions
): string {
  const itemsArray: GenericListItem[] = [...items.entries()].map(([name, count]) => ({
    name,
    count,
  }));
  return formatListGeneric(
    itemsArray,
    `Found ${itemsArray.length} ${label}:`,
    options,
    (item) => `  ${item.name.padEnd(20)} (${item.count} APIs)`
  );
}

export function formatProviders(providers: Provider[], options: ListOptions): string {
  const itemsArray: GenericListItem[] = providers.map((p) => ({
    name: p.name,
    count: p.count,
    url: p.url,
  }));
  return formatListGeneric(
    itemsArray,
    `Found ${itemsArray.length} providers:`,
    { ...options, showUrl: true },
    (item, opts) => {
      const countStr = item.count !== undefined ? ` (${item.count} APIs)` : '';
      const urlStr = opts.showUrl ? ` ${color.dim(item.url ?? '')}` : '';
      return `  ${item.name.padEnd(20)}${urlStr}${countStr}`;
    }
  );
}
