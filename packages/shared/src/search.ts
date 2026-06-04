import type { ApiEntry, SearchOptions } from './types';

export function search(apis: ApiEntry[], options: SearchOptions): ApiEntry[] {
  let results = apis;

  if (options.query) {
    const q = options.query.toLowerCase();
    results = results.filter(
      (api) => api.name.toLowerCase().includes(q) || api.description?.toLowerCase().includes(q)
    );
  }

  if (options.category) {
    const cat = options.category.toLowerCase();
    results = results.filter((api) => api.categories.some((c) => c.toLowerCase().includes(cat)));
  }

  if (options.auth) {
    const auth = options.auth.toLowerCase();
    results = results.filter((api) => {
      if (auth === 'no') {
        return api.auth === 'no';
      }
      return api.auth?.toLowerCase().includes(auth);
    });
  }

  if (options.sort) {
    results = [...results].sort((a, b) => {
      switch (options.sort) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'category': {
          const catA = a.categories[0] ?? '';
          const catB = b.categories[0] ?? '';
          return catA.localeCompare(catB);
        }
        case 'auth': {
          const authA = a.auth ?? '';
          const authB = b.auth ?? '';
          return authA.localeCompare(authB);
        }
        default:
          return 0;
      }
    });
  }

  return results;
}

export function getCategories(apis: ApiEntry[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const api of apis) {
    for (const cat of api.categories) {
      map.set(cat, (map.get(cat) ?? 0) + 1);
    }
  }
  return map;
}

export function getProviders(apis: ApiEntry[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const api of apis) {
    for (const source of api.sources) {
      counts.set(source, (counts.get(source) ?? 0) + 1);
    }
  }
  return counts;
}
