import { readFile, writeFile, access } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { LsApisConfig } from './types';

export const CONFIG_PATH = join(homedir(), '.ls-apis');

const DEFAULTS: Required<LsApisConfig> = {
  limit: 20,
  descriptionMaxLength: 250,
  colors: true,
};

let cachedConfig: Required<LsApisConfig> | null = null;

export function clearConfigCache(): void {
  cachedConfig = null;
}

export async function loadConfig(): Promise<Required<LsApisConfig>> {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const raw = await readFile(CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as LsApisConfig;
    cachedConfig = {
      limit: parsed.limit ?? DEFAULTS.limit,
      descriptionMaxLength: parsed.descriptionMaxLength ?? DEFAULTS.descriptionMaxLength,
      colors: parsed.colors ?? DEFAULTS.colors,
    };
  } catch {
    await ensureConfigExists();
    cachedConfig = DEFAULTS;
  }

  return cachedConfig;
}

async function ensureConfigExists(): Promise<void> {
  try {
    await access(CONFIG_PATH);
  } catch {
    await writeFile(CONFIG_PATH, JSON.stringify(DEFAULTS, null, 2) + '\n');
  }
}

export async function getConfig(): Promise<{ config: Required<LsApisConfig>; filePath: string }> {
  const config = await loadConfig();
  return { config, filePath: CONFIG_PATH };
}
