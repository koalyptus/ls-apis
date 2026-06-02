import { ResourceUri } from '../types';

export function getListResourcesResult() {
  return {
    resources: [
      {
        uri: ResourceUri.Data,
        name: 'Full API Dataset',
        description: 'Complete aggregated API dataset with all entries',
        mimeType: 'application/json',
      },
      {
        uri: ResourceUri.Categories,
        name: 'API Categories',
        description: 'All API categories with the count of APIs in each',
        mimeType: 'application/json',
      },
      {
        uri: ResourceUri.Providers,
        name: 'API Providers',
        description: 'All data providers with the count of APIs contributed by each',
        mimeType: 'application/json',
      },
      {
        uri: ResourceUri.Stats,
        name: 'Dataset Statistics',
        description: 'Summary statistics about the API dataset',
        mimeType: 'application/json',
      },
    ],
  };
}
