export interface ApiEntry {
  name: string;
  description?: string;
  link: string;
  auth?: string;
  https?: boolean;
  cors?: string;
  categories: string[];
  openapiSpec?: string;
  sources: string[];
}

export interface SourceFetcher {
  name: string;
  fetchApis(): Promise<ApiEntry[]>;
}
