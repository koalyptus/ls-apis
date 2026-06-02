import { loadDataFile } from '@ls-apis/shared/data';
import {
  getCategories as sharedGetCategories,
  getProviders as sharedGetProviders,
} from '@ls-apis/shared/search';
import type { DataFile, ApiEntry, Provider } from '@ls-apis/shared/types';
import type { DatasetStats, NamedCount } from './types';

export function loadData(): Promise<DataFile> {
  return loadDataFile(import.meta.url);
}

export async function getApis(): Promise<ApiEntry[]> {
  const data = await loadData();
  return data.apis;
}

export async function getProviders(): Promise<Provider[]> {
  const data = await loadData();
  return data.providers;
}

export async function getStats(): Promise<DatasetStats> {
  const data = await loadData();
  const categories = await getCategories();
  return {
    totalApis: data.apis.length,
    totalProviders: data.providers.length,
    totalCategories: categories.length,
  };
}

export async function getCategories(): Promise<NamedCount[]> {
  const apis = await getApis();
  const map = sharedGetCategories(apis);
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export async function getProviderCounts(): Promise<NamedCount[]> {
  const apis = await getApis();
  const map = sharedGetProviders(apis);
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
