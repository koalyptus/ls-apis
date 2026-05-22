import type { ApiEntry } from '../types';

interface TimestampWarning {
  issue: string;
  data: { timestamp: string };
}

interface EmptyProvidersWarning {
  issue: string;
  data: { providersCount: number };
}

interface ProviderWarning {
  issue: string;
  data: { name: string; url: string };
}

interface ApiWarning {
  apiName?: string;
  issue: string;
  data: Partial<ApiEntry>;
}

export type Warning =
  | TimestampWarning
  | EmptyProvidersWarning
  | ProviderWarning
  | ApiWarning;

export interface ProviderValidationResult {
  valid: boolean;
  issue?: string;
}

export interface ApiValidationResult {
  valid: boolean;
  issue?: string;
  api?: Partial<ApiEntry>;
  original: Partial<ApiEntry>;
}

export interface QaOptions {
  outputFile?: string;
  descriptionMaxLength?: number;
}

export interface WarningGroup {
  count: number;
  items: Warning[];
}

export interface QaOutput {
  total: number;
  groups: Record<string, WarningGroup>;
}
