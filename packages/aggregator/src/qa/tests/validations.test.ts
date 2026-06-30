import { describe, it, expect } from 'vitest';
import {
  isValidUrl,
  isValidIso8601Utc,
  validateJsonSyntax,
  validateDataFileSchema,
  validateProvider,
  validateApi,
  validateProviderApiCoverage,
} from '../validations';

describe('isValidUrl', () => {
  it('accepts http URLs', () => {
    expect(isValidUrl('http://example.com')).toBe(true);
  });

  it('accepts https URLs', () => {
    expect(isValidUrl('https://api.example.com/v1')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidUrl('')).toBe(false);
  });

  it('rejects protocol-less string', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
  });

  it('rejects ftp URLs', () => {
    expect(isValidUrl('ftp://files.example.com')).toBe(false);
  });
});

describe('isValidIso8601Utc', () => {
  it('accepts valid ISO 8601 UTC', () => {
    expect(isValidIso8601Utc('2024-01-15T10:30:00.000Z')).toBe(true);
  });

  it('accepts with milliseconds', () => {
    expect(isValidIso8601Utc('2024-01-15T10:30:00.123Z')).toBe(true);
  });

  it('rejects non-UTC timezone', () => {
    expect(isValidIso8601Utc('2024-01-15T10:30:00+00:00')).toBe(false);
  });

  it('rejects date-only string', () => {
    expect(isValidIso8601Utc('2024-01-15')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidIso8601Utc('')).toBe(false);
  });

  it('rejects invalid date', () => {
    expect(isValidIso8601Utc('not-a-date')).toBe(false);
  });
});

describe('validateJsonSyntax', () => {
  it('accepts valid JSON', () => {
    const result = validateJsonSyntax('{"a": 1}');
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data).toEqual({ a: 1 });
    }
  });

  it('rejects invalid JSON', () => {
    const result = validateJsonSyntax('{invalid}');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBeTruthy();
    }
  });
});

describe('validateDataFileSchema', () => {
  it('accepts valid data file', () => {
    const data = { timestamp: '2024-01-15T10:30:00.000Z', providers: [], apis: [] };
    expect(validateDataFileSchema(data)).toEqual([]);
  });

  it('rejects null', () => {
    expect(validateDataFileSchema(null)).toEqual(['Root is not an object']);
  });

  it('rejects non-object', () => {
    expect(validateDataFileSchema('string')).toEqual(['Root is not an object']);
  });

  it('reports missing timestamp', () => {
    const data = { providers: [], apis: [] };
    expect(validateDataFileSchema(data)).toContain('Missing required field: timestamp');
  });

  it('reports missing providers', () => {
    const data = { timestamp: '2024-01-15T10:30:00.000Z', apis: [] };
    expect(validateDataFileSchema(data)).toContain('Missing required field: providers');
  });

  it('reports missing apis', () => {
    const data = { timestamp: '2024-01-15T10:30:00.000Z', providers: [] };
    expect(validateDataFileSchema(data)).toContain('Missing required field: apis');
  });
});

describe('validateProvider', () => {
  it('accepts valid provider', () => {
    const provider = { name: 'test', url: 'https://example.com' };
    expect(validateProvider(provider, 0)).toEqual({ valid: true });
  });

  it('rejects null', () => {
    const result = validateProvider(null, 0);
    expect(result.valid).toBe(false);
    expect(result.issue).toContain('not an object');
  });

  it('rejects missing name', () => {
    const provider = { url: 'https://example.com' };
    expect(validateProvider(provider, 0).valid).toBe(false);
  });

  it('rejects empty name', () => {
    const provider = { name: '', url: 'https://example.com' };
    expect(validateProvider(provider, 0).valid).toBe(false);
  });

  it('rejects whitespace name', () => {
    const provider = { name: '   ', url: 'https://example.com' };
    expect(validateProvider(provider, 0).valid).toBe(false);
  });

  it('rejects missing URL', () => {
    const provider = { name: 'test' };
    expect(validateProvider(provider, 0).valid).toBe(false);
  });

  it('rejects invalid URL', () => {
    const provider = { name: 'test', url: 'not-a-url' };
    expect(validateProvider(provider, 0).valid).toBe(false);
  });

  it('includes index in error message', () => {
    const result = validateProvider(null, 5);
    expect(result.issue).toContain('index 5');
  });
});

describe('validateProviderApiCoverage', () => {
  it('flags a provider with no matching APIs', () => {
    const provider = { name: 'publicapis-dev', url: 'https://publicapis.dev' };
    const apis = [
      {
        name: 'Example API',
        link: 'https://example.com',
        categories: ['Test'],
        sources: ['apis-guru'],
      },
    ];

    const result = validateProviderApiCoverage(provider, 0, apis);
    expect(result.valid).toBe(false);
    expect(result.issue).toContain('no APIs');
  });

  it('accepts a provider that has matching APIs', () => {
    const provider = { name: 'publicapis-dev', url: 'https://publicapis.dev' };
    const apis = [
      {
        name: 'Example API',
        link: 'https://example.com',
        categories: ['Test'],
        sources: ['publicapis-dev'],
      },
    ];

    const result = validateProviderApiCoverage(provider, 0, apis);
    expect(result.valid).toBe(true);
  });
});

describe('validateApi', () => {
  it('accepts valid API', () => {
    const api = {
      name: 'Test API',
      link: 'https://example.com',
      categories: ['Test'],
      sources: ['src'],
    };
    const result = validateApi(api, 0);
    expect(result.valid).toBe(true);
  });

  it('rejects null', () => {
    expect(validateApi(null, 0).valid).toBe(false);
  });

  it('rejects missing name', () => {
    const api = { link: 'https://example.com', categories: ['Test'], sources: ['src'] };
    expect(validateApi(api, 0).valid).toBe(false);
  });

  it('rejects empty name', () => {
    const api = { name: '', link: 'https://example.com', categories: ['Test'], sources: ['src'] };
    expect(validateApi(api, 0).valid).toBe(false);
  });

  it('rejects missing link', () => {
    const api = { name: 'Test', categories: ['Test'], sources: ['src'] };
    expect(validateApi(api, 0).valid).toBe(false);
  });

  it('rejects invalid link', () => {
    const api = { name: 'Test', link: 'not-a-url', categories: ['Test'], sources: ['src'] };
    expect(validateApi(api, 0).valid).toBe(false);
  });

  it('flags description too long', () => {
    const desc = 'x'.repeat(300);
    const api = {
      name: 'Test',
      link: 'https://example.com',
      description: desc,
      categories: ['Test'],
      sources: ['src'],
    };
    expect(validateApi(api, 0, 250).valid).toBe(false);
  });

  it('accepts description within limit', () => {
    const desc = 'x'.repeat(200);
    const api = {
      name: 'Test',
      link: 'https://example.com',
      description: desc,
      categories: ['Test'],
      sources: ['src'],
    };
    expect(validateApi(api, 0, 250).valid).toBe(true);
  });

  it('allows null description', () => {
    const api = {
      name: 'Test',
      link: 'https://example.com',
      description: null,
      categories: ['Test'],
      sources: ['src'],
    };
    expect(validateApi(api, 0).valid).toBe(true);
  });

  it('allows null auth', () => {
    const api = {
      name: 'Test',
      link: 'https://example.com',
      auth: null,
      categories: ['Test'],
      sources: ['src'],
    };
    expect(validateApi(api, 0).valid).toBe(true);
  });

  it('flags non-string auth', () => {
    const api = {
      name: 'Test',
      link: 'https://example.com',
      auth: 123,
      categories: ['Test'],
      sources: ['src'],
    };
    expect(validateApi(api, 0).valid).toBe(false);
  });

  it('allows null cors', () => {
    const api = {
      name: 'Test',
      link: 'https://example.com',
      cors: null,
      categories: ['Test'],
      sources: ['src'],
    };
    expect(validateApi(api, 0).valid).toBe(true);
  });

  it('flags non-string cors', () => {
    const api = {
      name: 'Test',
      link: 'https://example.com',
      cors: true,
      categories: ['Test'],
      sources: ['src'],
    };
    expect(validateApi(api, 0).valid).toBe(false);
  });

  it('flags missing categories', () => {
    const api = { name: 'Test', link: 'https://example.com', sources: ['src'] };
    expect(validateApi(api, 0).valid).toBe(false);
  });

  it('flags empty categories', () => {
    const api = { name: 'Test', link: 'https://example.com', categories: [], sources: ['src'] };
    expect(validateApi(api, 0).valid).toBe(false);
  });

  it('flags too many categories', () => {
    const categories = Array.from({ length: 15 }, (_, i) => `Cat${i}`);
    const api = { name: 'Test', link: 'https://example.com', categories, sources: ['src'] };
    expect(validateApi(api, 0).valid).toBe(false);
  });

  it('flags empty category string', () => {
    const api = {
      name: 'Test',
      link: 'https://example.com',
      categories: ['Valid', ''],
      sources: ['src'],
    };
    expect(validateApi(api, 0).valid).toBe(false);
  });

  it('flags missing sources', () => {
    const api = { name: 'Test', link: 'https://example.com', categories: ['Test'] };
    expect(validateApi(api, 0).valid).toBe(false);
  });

  it('flags empty sources', () => {
    const api = { name: 'Test', link: 'https://example.com', categories: ['Test'], sources: [] };
    expect(validateApi(api, 0).valid).toBe(false);
  });

  it('flags empty source string', () => {
    const api = {
      name: 'Test',
      link: 'https://example.com',
      categories: ['Test'],
      sources: ['', 'src'],
    };
    expect(validateApi(api, 0).valid).toBe(false);
  });

  it('ignores unknown fields', () => {
    const api = {
      name: 'Test',
      link: 'https://example.com',
      categories: ['Test'],
      sources: ['src'],
      extraField: true,
    };
    expect(validateApi(api, 0).valid).toBe(true);
  });

  it('allows null openapiSpec', () => {
    const api = {
      name: 'Test',
      link: 'https://example.com',
      categories: ['Test'],
      sources: ['src'],
      openapiSpec: null,
    };
    expect(validateApi(api, 0).valid).toBe(true);
  });

  it('flags invalid openapiSpec URL', () => {
    const api = {
      name: 'Test',
      link: 'https://example.com',
      categories: ['Test'],
      sources: ['src'],
      openapiSpec: 'not-a-url',
    };
    expect(validateApi(api, 0).valid).toBe(false);
  });

  it('combines multiple issues', () => {
    const api = { name: '', link: 'bad', categories: ['Test'], sources: ['src'] };
    const result = validateApi(api, 0);
    expect(result.valid).toBe(false);
    expect(result.issue).toContain('Missing or empty name');
    expect(result.issue).toContain('Missing or invalid link');
  });
});
