import axios from 'axios';
import type { ApiEntry, SourceFetcher } from '../types';

interface ApisGuruEntry {
  added: string;
  updated: string;
  preferred?: string;
  versions: Record<
    string,
    {
      info: {
        title: string;
        description?: string;
        'x-origin'?: Array<{ url: string }>;
        tags?: string[];
        'x-apisguru-categories'?: string[];
      };
    }
  >;
}

const fetcher: SourceFetcher = {
  name: 'apis-guru',

  async fetchApis(): Promise<ApiEntry[]> {
    const res = await axios.get<Record<string, ApisGuruEntry>>(
      'https://api.apis.guru/v2/list.json'
    );
    const data = res.data;

    const entries: ApiEntry[] = Object.entries(data).map(([key, value]) => {
      const preferredVersion = value.preferred || Object.keys(value.versions)[0];
      const info = value.versions[preferredVersion]?.info || {};

      const categories = info['x-apisguru-categories'] || info.tags || ['Uncategorized'];

      return {
        name: info.title || key,
        description: info.description,
        link: info['x-origin']?.[0]?.url || '',
        categories,
        sources: [fetcher.name],
      };
    });

    return entries;
  },
};

export default fetcher;
