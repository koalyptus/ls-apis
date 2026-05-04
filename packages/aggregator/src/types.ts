export interface ApiEntry {
  name: string;
  description: string | null;
  link: string;
  auth: string | null;
  cors: string | null;
  categories: string[];
  openapiSpec: string | null;
  sources: string[];
}

export interface SourceFetcher {
  name: string;
  fetchApis(): Promise<ApiEntry[]>;
}
