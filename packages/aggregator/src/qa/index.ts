import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';

import { loadConfig } from '@ls-apis/shared/config';
import type { DataFile } from '../types';
import { resolveDataFile, resolveProjectRoot } from '../paths';

import type { QaOptions, QaOutput, WarningGroup, Warning } from './types';

import {
  validateJsonSyntax,
  validateDataFileSchema,
  validateProvider,
  validateProviderApiCoverage,
  validateApi,
  isValidIso8601Utc,
} from './validations';

export async function runQa(options: QaOptions): Promise<void> {
  const dataFilePath = resolveDataFile(import.meta.url);
  const outputFilePath =
    options.outputFile ?? join(resolveProjectRoot(import.meta.url), 'qa-output/issues.json');
  const descriptionMaxLength = options.descriptionMaxLength ?? (await loadDescriptionMaxLength());

  try {
    const content = await readFile(dataFilePath, 'utf-8');

    const jsonResult = validateJsonSyntax(content);
    if (!jsonResult.valid) {
      console.error(`Invalid JSON: ${jsonResult.error}`);
      process.exit(1);
    }

    const data = jsonResult.data as DataFile;

    const schemaErrors = validateDataFileSchema(data);
    if (schemaErrors.length > 0) {
      console.error('Schema validation failed:');
      for (const error of schemaErrors) {
        console.error(`  - ${error}`);
      }
      process.exit(1);
    }

    const warnings: Warning[] = [];
    const { providers, apis, timestamp } = data;

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

    for (const [i, provider] of providers.entries()) {
      const providerResult = validateProvider(provider, i);
      if (!providerResult.valid) {
        warnings.push({
          issue: providerResult.issue!,
          data: { ...provider },
        });
      }

      const coverageResult = validateProviderApiCoverage(provider, i, apis);
      if (!coverageResult.valid) {
        warnings.push({
          issue: coverageResult.issue!,
          data: { ...provider },
        });
      }
    }

    for (const [i, api] of apis.entries()) {
      const result = validateApi(api, i, descriptionMaxLength);

      if (!result.valid) {
        warnings.push({
          apiName: result.api?.name,
          issue: result.issue!,
          data: result.original!,
        });
      }
    }

    await mkdir(dirname(outputFilePath), { recursive: true });

    const grouped: Record<string, WarningGroup> = {};
    for (const w of warnings) {
      const key = w.issue;
      if (!grouped[key]) {
        grouped[key] = { count: 0, items: [] };
      }
      grouped[key].count++;
      grouped[key].items.push(w);
    }

    const output: QaOutput = {
      total: warnings.length,
      groups: grouped,
    };

    await writeFile(outputFilePath, JSON.stringify(output, null, 2) + '\n');

    const byIssue = new Map<string, number>();
    for (const w of warnings) {
      const key = w.issue.split('(')[0].trim();
      byIssue.set(key, (byIssue.get(key) ?? 0) + 1);
    }

    console.log(`\nQA Results for ${apis.length} APIs (${providers.length} providers):\n`);

    if (warnings.length === 0) {
      console.log('  No issues found');
    } else {
      for (const [issue, count] of byIssue) {
        console.log(`  ${String(count).padStart(4)}  ${issue}`);
      }

      console.log(
        `\n  ${'\u2500'.repeat(16)}\n  ${String(warnings.length).padStart(4)}  Total issues`
      );
    }

    console.log(`\nWritten to ${outputFilePath}`);
  } catch (err) {
    console.error(`QA failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

async function loadDescriptionMaxLength(): Promise<number> {
  const config = await loadConfig();
  return config.descriptionMaxLength;
}

const args = process.argv.slice(2);
const opts: QaOptions = {};
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--output' && i + 1 < args.length) {
    opts.outputFile = args[++i];
  }
  if (args[i] === '--description-max-length' && i + 1 < args.length) {
    opts.descriptionMaxLength = Number(args[++i]);
  }
}
runQa(opts).catch(() => process.exit(1));
