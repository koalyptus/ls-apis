import { realpathSync } from 'node:fs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DataFile } from './types';

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

interface QaIssue {
  apiName?: string;
  issue: string;
  data?: Record<string, unknown>;
}

export async function runQa(descriptionMaxLength: number, outputFile?: string): Promise<void> {
  const currentDir = dirname(realpathSync(fileURLToPath(import.meta.url)));
  const dataFile = join(currentDir, '../data/apis.json');
  const content = await readFile(dataFile, 'utf-8');
  const data = JSON.parse(content) as DataFile;

  const issues: QaIssue[] = [];

  for (const api of data.apis) {
    if (!api.name) {
      issues.push({ apiName: api.name, issue: 'Missing name', data: { name: api.name } });
    }

    if (!api.link || !isValidUrl(api.link)) {
      issues.push({
        apiName: api.name,
        issue: 'Missing or invalid link',
        data: { link: api.link },
      });
    }

    if (api.description !== undefined && api.description !== null) {
      if (typeof api.description !== 'string') {
        issues.push({
          apiName: api.name,
          issue: 'Description is not a string',
          data: { description: api.description },
        });
      } else if (api.description.length > descriptionMaxLength) {
        issues.push({
          apiName: api.name,
          issue: `Description too long (${api.description.length} chars)`,
          data: { descriptionLength: api.description.length },
        });
      }
    }

    if (api.auth !== undefined && api.auth !== null && typeof api.auth !== 'string') {
      issues.push({ apiName: api.name, issue: 'Auth is not a string', data: { auth: api.auth } });
    }

    if (api.cors !== undefined && api.cors !== null && typeof api.cors !== 'string') {
      issues.push({ apiName: api.name, issue: 'Cors is not a string', data: { cors: api.cors } });
    }

    if (!Array.isArray(api.categories)) {
      issues.push({
        apiName: api.name,
        issue: 'Categories is not an array',
        data: { categories: api.categories },
      });
    } else {
      if (api.categories.length === 0) {
        issues.push({
          apiName: api.name,
          issue: 'Categories array is empty',
          data: { categories: api.categories },
        });
      }
      if (api.categories.length > 10) {
        issues.push({
          apiName: api.name,
          issue: `Too many categories (${api.categories.length})`,
          data: { categoriesCount: api.categories.length },
        });
      }
      for (const cat of api.categories) {
        if (typeof cat !== 'string' || cat.trim() === '') {
          issues.push({
            apiName: api.name,
            issue: 'Category is empty or not a string',
            data: { categories: api.categories },
          });
          break;
        }
      }
    }

    if (!Array.isArray(api.sources)) {
      issues.push({
        apiName: api.name,
        issue: 'Sources is not an array',
        data: { sources: api.sources },
      });
    } else {
      if (api.sources.length === 0) {
        issues.push({
          apiName: api.name,
          issue: 'Sources array is empty',
          data: { sources: api.sources },
        });
      }
      for (const src of api.sources) {
        if (typeof src !== 'string' || src.trim() === '') {
          issues.push({
            apiName: api.name,
            issue: 'Source is empty or not a string',
            data: { sources: api.sources },
          });
          break;
        }
      }
    }

    if (api.openapiSpec !== undefined && api.openapiSpec !== null) {
      if (typeof api.openapiSpec !== 'string') {
        issues.push({
          apiName: api.name,
          issue: 'OpenAPI spec is not a string',
          data: { openapiSpec: api.openapiSpec },
        });
      } else if (!isValidUrl(api.openapiSpec)) {
        issues.push({
          apiName: api.name,
          issue: 'OpenAPI spec is not a valid URL',
          data: { openapiSpec: api.openapiSpec },
        });
      }
    }
  }

  const timestamp = data.timestamp;
  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
  if (
    typeof timestamp !== 'string' ||
    !isoRegex.test(timestamp) ||
    new Date(timestamp).toISOString() !== timestamp
  ) {
    issues.push({ issue: 'Invalid timestamp format', data: { timestamp } });
  }

  for (const provider of data.providers) {
    if (!provider.name) {
      issues.push({ issue: 'Provider missing name', data: { provider } });
    }
    if (!provider.url || !isValidUrl(provider.url)) {
      issues.push({ issue: 'Provider missing or invalid URL', data: { provider } });
    }
  }

  const outputPath = outputFile ?? join(currentDir, '../../../qa-output/issues.json');
  await mkdir(dirname(outputPath), { recursive: true });

  const groupedOutput: Record<string, { count: number; items: typeof issues }> = {};
  for (const issue of issues) {
    if (!groupedOutput[issue.issue]) {
      groupedOutput[issue.issue] = { count: 0, items: [] };
    }
    groupedOutput[issue.issue].count++;
    groupedOutput[issue.issue].items.push(issue);
  }

  await writeFile(
    outputPath,
    JSON.stringify({ total: issues.length, groups: groupedOutput }, null, 2) + '\n'
  );

  const grouped = new Map<string, number>();
  for (const issue of issues) {
    const key = issue.issue.split('(')[0].trim();
    grouped.set(key, (grouped.get(key) ?? 0) + 1);
  }

  console.log(`\nQA Results for ${data.apis.length} APIs (${data.providers.length} providers):\n`);

  if (issues.length === 0) {
    console.log('  No issues found');
  } else {
    for (const [issue, count] of grouped) {
      console.log(`  ${String(count).padStart(4)}  ${issue}`);
    }

    console.log(`\n  ${'\u2500'.repeat(16)}\n  ${String(issues.length).padStart(4)}  Total issues`);
  }

  console.log(`\nWritten to ${outputPath}`);
}
