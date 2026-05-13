export interface Provider {
  name: string;
  url: string;
}

export interface DataFile {
  timestamp: string;
  providers: Provider[];
  apis: ApiEntry[];
}

export type AuthType = 'apiKey' | 'OAuth' | 'apiKey|OAuth' | string | null;

export interface ApiEntry {
  name: string;
  description: string | null;
  link: string;
  auth: AuthType;
  cors: string | null;
  categories: string[];
  openapiSpec: string | null;
  sources: string[];
}

export interface SourceFetcher {
  name: string;
  sourceUrl: string;
  fetchApis(): Promise<ApiEntry[]>;
}
