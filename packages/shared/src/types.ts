export interface Provider {
  name: string;
  url: string;
  count?: number;
}

export interface DataFile {
  timestamp: string;
  providers: Provider[];
  apis: ApiEntry[];
}

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

export type SortField = 'name' | 'category' | 'auth';

export interface SearchOptions {
  query?: string;
  category?: string;
  auth?: string;
  sort?: SortField;
  limit?: number;
}

export type ListSortBy = 'name' | 'count';

export interface ListOptions {
  sort?: ListSortBy;
  output?: 'text' | 'json';
}

export interface FormatOptions {
  output?: 'text' | 'json';
  descriptionMaxLength?: number;
}

export interface LsApisConfig {
  limit?: number;
  descriptionMaxLength?: number;
  colors?: boolean;
}
