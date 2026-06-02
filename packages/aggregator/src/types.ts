import type { ApiEntry, DataFile, Provider } from '@ls-apis/shared/types';
export type { ApiEntry, DataFile, Provider };

export type AuthType = 'apiKey' | 'OAuth' | 'apiKey|OAuth' | string | null;

export interface SourceFetcher {
  name: string;
  sourceUrl: string;
  fetchApis(): Promise<ApiEntry[]>;
}

export type NormalizeResult = ApiEntry | { valid: false; reason: string; entry: ApiEntry };

export interface RejectedEntry {
  name: string | undefined;
  link: string | undefined;
  reason: string;
  sources: string[];
  categories: string[];
}

export interface RejectedFile {
  timestamp: string;
  total: number;
  entries: RejectedEntry[];
}
