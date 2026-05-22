import type { ApiEntry } from '../types';
import type { ProviderValidationResult, ApiValidationResult } from './types';

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isValidIso8601Utc(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
  if (!regex.test(dateString)) {
    return false;
  }
  const date = new Date(dateString);
  return date.toISOString() === dateString;
}

export function validateJsonSyntax(content: string): { valid: boolean; error?: string } {
  try {
    JSON.parse(content);
    return { valid: true };
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export function validateDataFileSchema(data: unknown): string[] {
  const errors: string[] = [];

  if (data === null || typeof data !== 'object') {
    errors.push('Root is not an object');
    return errors;
  }

  if (!('timestamp' in (data as Record<string, unknown>))) {
    errors.push('Missing required field: timestamp');
  }
  if (!('providers' in (data as Record<string, unknown>))) {
    errors.push('Missing required field: providers');
  }
  if (!('apis' in (data as Record<string, unknown>))) {
    errors.push('Missing required field: apis');
  }

  return errors;
}

export function validateProvider(
  provider: unknown,
  index: number
): ProviderValidationResult {
  if (provider === null || typeof provider !== 'object') {
    return { valid: false, issue: `Provider at index ${index} is not an object` };
  }

  const p = provider as Record<string, unknown>;

  if (typeof p.name !== 'string' || p.name.trim() === '') {
    return { valid: false, issue: `Provider at index ${index} has invalid or missing name` };
  }

  if (typeof p.url !== 'string' || !isValidUrl(p.url)) {
    return { valid: false, issue: `Provider at index ${index} has invalid or missing URL` };
  }

  return { valid: true };
}

export function validateApi(
  api: unknown,
  index: number,
  descriptionMaxLength?: number
): ApiValidationResult {
  if (api === null || typeof api !== 'object') {
    return { valid: false, issue: `API at index ${index} is not an object`, original: {} };
  }

  const a = api as Record<string, unknown>;
  const issues: string[] = [];

  if (typeof a.name !== 'string' || a.name.trim() === '') {
    issues.push('Missing or empty name');
  }

  if (typeof a.link !== 'string' || !isValidUrl(a.link)) {
    issues.push('Missing or invalid link');
  }

  if (a.description !== undefined && a.description !== null) {
    if (typeof a.description !== 'string') {
      issues.push('Description is not a string');
    } else if (a.description.length > (descriptionMaxLength ?? 250)) {
      issues.push(`Description too long (${a.description.length} chars)`);
    }
  }

  if (a.auth !== undefined && a.auth !== null && typeof a.auth !== 'string') {
    issues.push('Auth is not a string');
  }

  if (a.cors !== undefined && a.cors !== null && typeof a.cors !== 'string') {
    issues.push('Cors is not a string');
  }

  if (!Array.isArray(a.categories)) {
    issues.push('Categories is not an array');
  } else {
    if (a.categories.length === 0) {
      issues.push('Categories array is empty');
    }
    if (a.categories.length > 10) {
      issues.push(`Too many categories (${a.categories.length})`);
    }
    for (let i = 0; i < a.categories.length; i++) {
      if (typeof a.categories[i] !== 'string' || a.categories[i].trim() === '') {
        issues.push(`Category at index ${i} is empty or not a string`);
        break;
      }
    }
  }

  if (!Array.isArray(a.sources)) {
    issues.push('Sources is not an array');
  } else {
    if (a.sources.length === 0) {
      issues.push('Sources array is empty');
    }
    for (let i = 0; i < a.sources.length; i++) {
      if (typeof a.sources[i] !== 'string' || a.sources[i].trim() === '') {
        issues.push(`Source at index ${i} is empty or not a string`);
        break;
      }
    }
  }

  if (a.openapiSpec !== undefined && a.openapiSpec !== null) {
    if (typeof a.openapiSpec !== 'string') {
      issues.push('OpenAPI spec is not a string');
    } else if (!isValidUrl(a.openapiSpec)) {
      issues.push('OpenAPI spec is not a valid URL');
    }
  }

  const knownFields = new Set([
    'name',
    'description',
    'link',
    'auth',
    'cors',
    'categories',
    'openapiSpec',
    'sources',
  ]);
  const unknownFields = Object.keys(a).filter((key) => !knownFields.has(key));
  if (unknownFields.length > 0) {
    issues.push(`Unknown fields: ${unknownFields.join(', ')}`);
  }

  if (issues.length === 0) {
    return {
      valid: true,
      api: {
        name: a.name as string,
        description: a.description as string | null,
        link: a.link as string,
        auth: a.auth as string | null,
        cors: a.cors as string | null,
        categories: a.categories as string[],
        openapiSpec: a.openapiSpec as string | null,
        sources: a.sources as string[],
      },
      original: a as Partial<ApiEntry>,
    };
  }

  return {
    valid: false,
    issue: issues.join('; '),
    original: a as Partial<ApiEntry>,
  };
}
