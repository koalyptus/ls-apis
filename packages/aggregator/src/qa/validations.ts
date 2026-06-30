import type { ApiEntry, Provider } from '../types';
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

export function validateJsonSyntax(
  content: string
): { valid: true; data: unknown } | { valid: false; error: string } {
  try {
    return { valid: true, data: JSON.parse(content) };
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

  const obj = data as Record<string, unknown>;
  if (!('timestamp' in obj)) {
    errors.push('Missing required field: timestamp');
  }
  if (!('providers' in obj)) {
    errors.push('Missing required field: providers');
  }
  if (!('apis' in obj)) {
    errors.push('Missing required field: apis');
  }

  return errors;
}

export function validateProvider(provider: Provider, index: number): ProviderValidationResult {
  if (provider === null || typeof provider !== 'object') {
    return { valid: false, issue: `Provider at index ${index} is not an object` };
  }

  if (typeof provider.name !== 'string' || provider.name.trim() === '') {
    return { valid: false, issue: `Provider at index ${index} has invalid or missing name` };
  }

  if (typeof provider.url !== 'string' || !isValidUrl(provider.url)) {
    return { valid: false, issue: `Provider at index ${index} has invalid or missing URL` };
  }

  return { valid: true };
}

export function validateProviderApiCoverage(
  provider: Provider,
  index: number,
  apis: ApiEntry[]
): ProviderValidationResult {
  if (provider === null || typeof provider !== 'object') {
    return { valid: false, issue: `Provider at index ${index} is not an object` };
  }

  const providerName = provider.name?.trim();
  if (!providerName) {
    return { valid: true };
  }

  const hasMatchingApis = apis.some((api) => api.sources?.includes(providerName));
  if (!hasMatchingApis) {
    return {
      valid: false,
      issue: `Provider "${providerName}" returned no APIs`,
    };
  }

  return { valid: true };
}

export function validateApi(
  api: ApiEntry,
  index: number,
  descriptionMaxLength?: number
): ApiValidationResult {
  if (api === null || typeof api !== 'object') {
    return { valid: false, issue: `API at index ${index} is not an object`, original: {} };
  }

  const issues: string[] = [];

  if (typeof api.name !== 'string' || api.name.trim() === '') {
    issues.push('Missing or empty name');
  }

  if (typeof api.link !== 'string' || !isValidUrl(api.link)) {
    issues.push('Missing or invalid link');
  }

  if (api.description !== undefined && api.description !== null) {
    if (typeof api.description !== 'string') {
      issues.push('Description is not a string');
    } else if (api.description.length > (descriptionMaxLength ?? 250)) {
      issues.push(`Description too long (${api.description.length} chars)`);
    }
  }

  if (api.auth !== undefined && api.auth !== null && typeof api.auth !== 'string') {
    issues.push('Auth is not a string');
  }

  if (api.cors !== undefined && api.cors !== null && typeof api.cors !== 'string') {
    issues.push('Cors is not a string');
  }

  if (!Array.isArray(api.categories)) {
    issues.push('Categories is not an array');
  } else {
    if (api.categories.length === 0) {
      issues.push('Categories array is empty');
    }
    if (api.categories.length > 10) {
      issues.push(`Too many categories (${api.categories.length})`);
    }
    for (let i = 0; i < api.categories.length; i++) {
      if (typeof api.categories[i] !== 'string' || api.categories[i].trim() === '') {
        issues.push(`Category at index ${i} is empty or not a string`);
        break;
      }
    }
  }

  if (!Array.isArray(api.sources)) {
    issues.push('Sources is not an array');
  } else {
    if (api.sources.length === 0) {
      issues.push('Sources array is empty');
    }
    for (let i = 0; i < api.sources.length; i++) {
      if (typeof api.sources[i] !== 'string' || api.sources[i].trim() === '') {
        issues.push(`Source at index ${i} is empty or not a string`);
        break;
      }
    }
  }

  if (api.openapiSpec !== undefined && api.openapiSpec !== null) {
    if (typeof api.openapiSpec !== 'string') {
      issues.push('OpenAPI spec is not a string');
    } else if (!isValidUrl(api.openapiSpec)) {
      issues.push('OpenAPI spec is not a valid URL');
    }
  }

  if (issues.length === 0) {
    return { valid: true };
  }

  return {
    valid: false,
    issue: issues.join('; '),
    original: api as Partial<ApiEntry>,
  };
}
