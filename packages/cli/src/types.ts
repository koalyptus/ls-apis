export interface ApiEntry {
  name: string;
  description?: string;
  link: string;
  auth?: string;
  cors?: string;
  categories: string[];
  openapiSpec?: string;
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

export interface FormatOptions {
  output?: 'text' | 'json';
  descriptionMaxLength?: number;
}

export type ListSortBy = 'name' | 'count';

export interface ListOptions {
  sort?: ListSortBy;
  output?: 'text' | 'json';
}
