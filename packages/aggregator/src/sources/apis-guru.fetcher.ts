import axios from 'axios';
import type { ApiEntry, SourceFetcher } from '../types';

interface ApisGuruEntry {
  added: string;
  updated: string;
  preferred: string;
  versions: Record<
    string,
    {
      info: {
        title: string;
        description?: string;
        'x-origin'?: Array<{ url: string }>;
        'x-apisguru-categories'?: string[];
      };
      swaggerUrl?: string;
      openapiVer?: string;
    }
  >;
}

const API_URL = 'https://api.apis.guru/v2/list.json';
const WEB_URL = 'https://apis.guru/';

const fetcher: SourceFetcher = {
  name: 'apis-guru',
  sourceUrl: WEB_URL,

  async fetchApis(): Promise<ApiEntry[]> {
    const res = await axios.get<Record<string, ApisGuruEntry>>(API_URL);
    const data = res.data;

    const entries: ApiEntry[] = Object.entries(data).map(([key, value]) => {
      const versionObj = value.versions[value.preferred] ?? {};
      const info = versionObj.info ?? {};

      const categories = info['x-apisguru-categories'] || ['Uncategorized'];

      return {
        name: info.title || key,
        description: info.description || null,
        link: info['x-origin']?.[0]?.url || '',
        auth: null,
        cors: null,
        categories,
        openapiSpec: versionObj.swaggerUrl ?? null,
        sources: [fetcher.name],
      };
    });

    return entries;
  },
};

export default fetcher;
