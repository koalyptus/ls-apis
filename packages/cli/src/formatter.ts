import { color } from './colors';
import type { ApiEntry, FormatOptions } from './types';

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + '...';
}

export function formatText(
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
    // Test missing braces - should trigger ESLint error
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

export function formatJson(results: ApiEntry[], limit: number): string {
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
