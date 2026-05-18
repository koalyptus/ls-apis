import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { realpathSync } from 'node:fs';

import { loadConfig } from '../../../cli/src/config';

import {
  validateJsonSyntax,
  validateDataFileSchema,
  validateProvider,
  validateApi,
  isValidIso8601Utc,
  type ApiWarning,
} from './validations';

function getDataFilePath(metaUrl: string): string {
  const currentDir = dirname(realpathSync(fileURLToPath(metaUrl)));
  return join(currentDir, '../../../cli/data/apis.json');
}

function getProjectRoot(metaUrl: string): string {
  const currentDir = dirname(realpathSync(fileURLToPath(metaUrl)));
  return join(currentDir, '../../../../');
}

export interface QaOptions {
  outputFile?: string;
  descriptionMaxLength?: number;
}

export async function runQa(options: QaOptions): Promise<void> {
  const dataFilePath = getDataFilePath(import.meta.url);
  const outputFilePath =
    options.outputFile ?? join(getProjectRoot(import.meta.url), 'qa-output/issues.json');
  const descriptionMaxLength = options.descriptionMaxLength ?? (await loadDescriptionMaxLength());

  try {
    const content = await readFile(dataFilePath, 'utf-8');

    const jsonResult = validateJsonSyntax(content);
    if (!jsonResult.valid) {
      console.error(`Invalid JSON: ${jsonResult.error}`);
      process.exit(1);
    }

    const data = JSON.parse(content) as Record<string, unknown>;

    const schemaErrors = validateDataFileSchema(data);
    if (schemaErrors.length > 0) {
      console.error('Schema validation failed:');
      for (const error of schemaErrors) {
        console.error(`  - ${error}`);
      }
      process.exit(1);
    }

    const warnings: ApiWarning[] = [];
    const providers = data.providers as unknown[];
    const apis = data.apis as unknown[];
    const timestamp = data.timestamp as string;

    if (!isValidIso8601Utc(timestamp)) {
      warnings.push({
        issue: `Invalid timestamp format: ${timestamp}`,
        data: { timestamp },
      });
    }

    if (providers.length === 0) {
      warnings.push({
        issue: 'Providers array is empty',
        data: { providersCount: 0 },
      });
    }

    for (let i = 0; i < providers.length; i++) {
      const result = validateProvider(providers[i], i);
      if (!result.valid) {
        warnings.push({
          issue: result.issue!,
          data: providers[i] as Record<string, unknown>,
        });
      }
    }

    for (let i = 0; i < apis.length; i++) {
      const result = validateApi(apis[i], i, descriptionMaxLength);

      if (!result.valid) {
        warnings.push({
          apiName: result.api?.name,
          issue: result.issue!,
          data: result.original,
        });
      }
    }

    await mkdir(dirname(outputFilePath), { recursive: true });

    const grouped: Record<string, { count: number; items: ApiWarning[] }> = {};
    for (const w of warnings) {
      const key = w.issue;
      if (!grouped[key]) {
        grouped[key] = { count: 0, items: [] };
      }
      grouped[key].count++;
      grouped[key].items.push(w);
    }

    const output = {
      total: warnings.length,
      groups: grouped,
    };

    await writeFile(outputFilePath, JSON.stringify(output, null, 2) + '\n');
    console.log(`QA complete. ${warnings.length} issues written to ${outputFilePath}`);
  } catch (err) {
    console.error(`QA failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

async function loadDescriptionMaxLength(): Promise<number> {
  const config = await loadConfig();
  return config.descriptionMaxLength;
}

runQa({}).catch(() => process.exit(1));
