export interface DatasetStats {
  totalApis: number;
  totalProviders: number;
  totalCategories: number;
}

export interface NamedCount {
  name: string;
  count: number;
}

export const ToolName = {
  SearchApis: 'search-apis',
  ListCategories: 'list-categories',
  ListProviders: 'list-providers',
} as const;

export type ToolName = (typeof ToolName)[keyof typeof ToolName];

export const ResourceUri = {
  Data: 'apis://data',
  Categories: 'apis://categories',
  Providers: 'apis://providers',
  Stats: 'apis://stats',
} as const;

export type ResourceUri = (typeof ResourceUri)[keyof typeof ResourceUri];
