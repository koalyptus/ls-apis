import { readFile, writeFile, access } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

const CONFIG_PATH = join(homedir(), '.ls-apis');

export interface LsApisConfig {
  limit?: number;
  descriptionMaxLength?: number;
  colors?: boolean;
}

const DEFAULTS: Required<LsApisConfig> = {
  limit: 20,
  descriptionMaxLength: 250,
  colors: true,
};

export async function loadConfig(): Promise<Required<LsApisConfig>> {
  try {
    const raw = await readFile(CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as LsApisConfig;
    return {
      limit: parsed.limit ?? DEFAULTS.limit,
      descriptionMaxLength: parsed.descriptionMaxLength ?? DEFAULTS.descriptionMaxLength,
      colors: parsed.colors ?? DEFAULTS.colors,
    };
  } catch {
    await ensureConfigExists();
    return DEFAULTS;
  }
}

async function ensureConfigExists(): Promise<void> {
  try {
    await access(CONFIG_PATH);
  } catch {
    await writeFile(CONFIG_PATH, JSON.stringify(DEFAULTS, null, 2) + '\n');
  }
}
