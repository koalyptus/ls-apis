import { readFile } from 'node:fs/promises';
import { resolveDataFile } from '@ls-apis/shared/paths';
import {
  getCategories as sharedGetCategories,
  getProviders as sharedGetProviders,
} from '@ls-apis/shared/search';
import type { DataFile, ApiEntry, Provider } from '@ls-apis/shared/types';

let cached: DataFile | null = null;

export async function loadData(): Promise<DataFile> {
  if (cached) {
    return cached;
  }
  const dataFilePath = resolveDataFile(import.meta.url);
  const raw = await readFile(dataFilePath, 'utf-8');
  cached = JSON.parse(raw) as DataFile;
  return cached;
}

export function getApis(): Promise<ApiEntry[]> {
  return loadData().then((d) => d.apis);
}

export function getProviders(): Promise<Provider[]> {
  return loadData().then((d) => d.providers);
}

export function getStats(): Promise<{
  totalApis: number;
  totalProviders: number;
  totalCategories: number;
}> {
  return loadData().then((data) => {
    const categories = new Set(data.apis.flatMap((a) => a.categories));
    return {
      totalApis: data.apis.length,
      totalProviders: data.providers.length,
      totalCategories: categories.size,
    };
  });
}

export async function getCategories(): Promise<Array<{ name: string; count: number }>> {
  const apis = await getApis();
  const map = sharedGetCategories(apis);
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export async function getProviderCounts(): Promise<Array<{ name: string; count: number }>> {
  const apis = await getApis();
  const map = sharedGetProviders(apis);
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
