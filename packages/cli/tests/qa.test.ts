import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { runQa } from '../src/qa';

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
}));

const VALID_TIMESTAMP = '2024-01-15T10:30:00.000Z';

function makeData(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    timestamp: VALID_TIMESTAMP,
    providers: [{ name: 'test-source', url: 'https://example.com' }],
    apis: [
      {
        name: 'Valid API',
        link: 'https://example.com/valid',
        categories: ['Test'],
        sources: ['src'],
        description: null,
        auth: null,
        cors: null,
      },
    ],
    ...overrides,
  });
}

describe('runQa', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.mocked(readFile).mockReset();
    vi.mocked(writeFile).mockReset();
    vi.mocked(mkdir).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes grouped output to default path', async () => {
    const data = makeData({
      apis: [
        {
          name: 'Valid API',
          link: 'https://example.com/valid',
          categories: ['Test'],
          sources: ['src'],
          description: null,
          auth: null,
          cors: null,
        },
        {
          name: 'Long Desc',
          link: 'https://example.com/long',
          description: 'x'.repeat(300),
          categories: ['Test'],
          sources: ['src'],
          auth: null,
          cors: null,
        },
        {
          name: 'No Link',
          link: 'bad-url',
          categories: ['Test'],
          sources: ['src'],
          description: null,
          auth: null,
          cors: null,
        },
        {
          name: 'Empty Cat',
          link: 'https://example.com/emptycat',
          categories: [],
          sources: ['src'],
          description: null,
          auth: null,
          cors: null,
        },
        {
          name: 'Too Many Cats',
          link: 'https://example.com/manycats',
          categories: Array.from({ length: 15 }, (_, i) => `Cat${i}`),
          sources: ['src'],
          description: null,
          auth: null,
          cors: null,
        },
        {
          name: 'Non-String Auth',
          link: 'https://example.com/auth',
          categories: ['Test'],
          sources: ['src'],
          auth: 123,
          cors: null,
          description: null,
        },
      ],
    });
    vi.mocked(readFile).mockResolvedValue(data);

    await runQa(250);

    const [, payload] = vi.mocked(writeFile).mock.calls[0];
    const parsed = JSON.parse(payload as string);
    expect(parsed.total).toBe(5);
    expect(parsed.groups['Description too long (300 chars)']).toBeDefined();
    expect(parsed.groups['Missing or invalid link']).toBeDefined();
    expect(parsed.groups['Categories array is empty']).toBeDefined();
    expect(parsed.groups['Too many categories (15)']).toBeDefined();
    expect(parsed.groups['Auth is not a string']).toBeDefined();
  });

  it('writes to custom path when outputFile is given', async () => {
    const data = makeData({ apis: [] });
    vi.mocked(readFile).mockResolvedValue(data);

    await runQa(250, '/tmp/custom.json');

    expect(writeFile).toHaveBeenCalledWith('/tmp/custom.json', expect.any(String));
  });

  it('prints terminal summary with issues', async () => {
    const data = makeData({
      apis: [
        {
          name: 'Valid API',
          link: 'https://example.com/valid',
          categories: ['Test'],
          sources: ['src'],
          description: null,
          auth: null,
          cors: null,
        },
        {
          name: 'Long Desc',
          link: 'https://example.com/long',
          description: 'x'.repeat(300),
          categories: ['Test'],
          sources: ['src'],
          auth: null,
          cors: null,
        },
      ],
    });
    vi.mocked(readFile).mockResolvedValue(data);

    await runQa(250);

    const output = consoleLogSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('QA Results for 2 APIs');
    expect(output).toContain('Description too long');
    expect(output).toContain('Total issues');
    expect(output).toContain('Written to');
  });

  it('reports no issues for clean data', async () => {
    const data = makeData({});
    vi.mocked(readFile).mockResolvedValue(data);

    await runQa(250);

    const [, payload] = vi.mocked(writeFile).mock.calls[0];
    const parsed = JSON.parse(payload as string);
    expect(parsed.total).toBe(0);
    expect(Object.keys(parsed.groups)).toHaveLength(0);
  });

  it('prints "No issues found" when clean', async () => {
    const data = makeData({});
    vi.mocked(readFile).mockResolvedValue(data);

    await runQa(250);

    const output = consoleLogSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('No issues found');
    expect(output).not.toContain('Total issues');
  });

  it('flags missing name', async () => {
    const data = makeData({
      apis: [
        {
          name: '',
          link: 'https://example.com',
          categories: ['Test'],
          sources: ['src'],
          description: null,
          auth: null,
          cors: null,
        },
      ],
    });
    vi.mocked(readFile).mockResolvedValue(data);

    await runQa(250);

    const [, payload] = vi.mocked(writeFile).mock.calls[0];
    const parsed = JSON.parse(payload as string);
    expect(parsed.groups['Missing name']).toBeDefined();
  });

  it('flags invalid timestamp', async () => {
    const data = makeData({ timestamp: 'bad-date' });
    vi.mocked(readFile).mockResolvedValue(data);

    await runQa(250);

    const [, payload] = vi.mocked(writeFile).mock.calls[0];
    const parsed = JSON.parse(payload as string);
    expect(parsed.groups['Invalid timestamp format']).toBeDefined();
  });

  it('flags provider missing name', async () => {
    const data = makeData({
      providers: [{ url: 'https://example.com' }],
    });
    vi.mocked(readFile).mockResolvedValue(data);

    await runQa(250);

    const [, payload] = vi.mocked(writeFile).mock.calls[0];
    const parsed = JSON.parse(payload as string);
    expect(parsed.groups['Provider missing name']).toBeDefined();
  });

  it('flags provider invalid URL', async () => {
    const data = makeData({
      providers: [{ name: 'bad', url: 'not-a-url' }],
    });
    vi.mocked(readFile).mockResolvedValue(data);

    await runQa(250);

    const [, payload] = vi.mocked(writeFile).mock.calls[0];
    const parsed = JSON.parse(payload as string);
    expect(parsed.groups['Provider missing or invalid URL']).toBeDefined();
  });

  it('flags non-string description', async () => {
    const data = makeData({
      apis: [
        {
          name: 'Test',
          link: 'https://example.com',
          categories: ['Test'],
          sources: ['src'],
          description: 123,
          auth: null,
          cors: null,
        },
      ],
    });
    vi.mocked(readFile).mockResolvedValue(data);

    await runQa(250);

    const [, payload] = vi.mocked(writeFile).mock.calls[0];
    const parsed = JSON.parse(payload as string);
    expect(parsed.groups['Description is not a string']).toBeDefined();
  });

  it('flags non-string cors', async () => {
    const data = makeData({
      apis: [
        {
          name: 'Test',
          link: 'https://example.com',
          categories: ['Test'],
          sources: ['src'],
          description: null,
          auth: null,
          cors: true,
        },
      ],
    });
    vi.mocked(readFile).mockResolvedValue(data);

    await runQa(250);

    const [, payload] = vi.mocked(writeFile).mock.calls[0];
    const parsed = JSON.parse(payload as string);
    expect(parsed.groups['Cors is not a string']).toBeDefined();
  });

  it('flags categories not an array', async () => {
    const data = makeData({
      apis: [
        {
          name: 'Test',
          link: 'https://example.com',
          categories: 'not-array',
          sources: ['src'],
          description: null,
          auth: null,
          cors: null,
        },
      ],
    });
    vi.mocked(readFile).mockResolvedValue(data);

    await runQa(250);

    const [, payload] = vi.mocked(writeFile).mock.calls[0];
    const parsed = JSON.parse(payload as string);
    expect(parsed.groups['Categories is not an array']).toBeDefined();
  });

  it('flags empty category string', async () => {
    const data = makeData({
      apis: [
        {
          name: 'Test',
          link: 'https://example.com',
          categories: ['Valid', ''],
          sources: ['src'],
          description: null,
          auth: null,
          cors: null,
        },
      ],
    });
    vi.mocked(readFile).mockResolvedValue(data);

    await runQa(250);

    const [, payload] = vi.mocked(writeFile).mock.calls[0];
    const parsed = JSON.parse(payload as string);
    expect(parsed.groups['Category is empty or not a string']).toBeDefined();
  });

  it('flags sources not an array', async () => {
    const data = makeData({
      apis: [
        {
          name: 'Test',
          link: 'https://example.com',
          categories: ['Test'],
          sources: 'not-array',
          description: null,
          auth: null,
          cors: null,
        },
      ],
    });
    vi.mocked(readFile).mockResolvedValue(data);

    await runQa(250);

    const [, payload] = vi.mocked(writeFile).mock.calls[0];
    const parsed = JSON.parse(payload as string);
    expect(parsed.groups['Sources is not an array']).toBeDefined();
  });

  it('flags empty sources array', async () => {
    const data = makeData({
      apis: [
        {
          name: 'Test',
          link: 'https://example.com',
          categories: ['Test'],
          sources: [],
          description: null,
          auth: null,
          cors: null,
        },
      ],
    });
    vi.mocked(readFile).mockResolvedValue(data);

    await runQa(250);

    const [, payload] = vi.mocked(writeFile).mock.calls[0];
    const parsed = JSON.parse(payload as string);
    expect(parsed.groups['Sources array is empty']).toBeDefined();
  });

  it('flags empty source string', async () => {
    const data = makeData({
      apis: [
        {
          name: 'Test',
          link: 'https://example.com',
          categories: ['Test'],
          sources: ['src', ''],
          description: null,
          auth: null,
          cors: null,
        },
      ],
    });
    vi.mocked(readFile).mockResolvedValue(data);

    await runQa(250);

    const [, payload] = vi.mocked(writeFile).mock.calls[0];
    const parsed = JSON.parse(payload as string);
    expect(parsed.groups['Source is empty or not a string']).toBeDefined();
  });

  it('flags invalid openapiSpec URL', async () => {
    const data = makeData({
      apis: [
        {
          name: 'Test',
          link: 'https://example.com',
          categories: ['Test'],
          sources: ['src'],
          openapiSpec: 'not-a-url',
          description: null,
          auth: null,
          cors: null,
        },
      ],
    });
    vi.mocked(readFile).mockResolvedValue(data);

    await runQa(250);

    const [, payload] = vi.mocked(writeFile).mock.calls[0];
    const parsed = JSON.parse(payload as string);
    expect(parsed.groups['OpenAPI spec is not a valid URL']).toBeDefined();
  });

  it('flags non-string openapiSpec', async () => {
    const data = makeData({
      apis: [
        {
          name: 'Test',
          link: 'https://example.com',
          categories: ['Test'],
          sources: ['src'],
          openapiSpec: 123,
          description: null,
          auth: null,
          cors: null,
        },
      ],
    });
    vi.mocked(readFile).mockResolvedValue(data);

    await runQa(250);

    const [, payload] = vi.mocked(writeFile).mock.calls[0];
    const parsed = JSON.parse(payload as string);
    expect(parsed.groups['OpenAPI spec is not a string']).toBeDefined();
  });

  it('accepts valid description within limit', async () => {
    const data = makeData({
      apis: [
        {
          name: 'Test',
          link: 'https://example.com',
          categories: ['Test'],
          sources: ['src'],
          description: 'Short description',
          auth: null,
          cors: null,
        },
      ],
    });
    vi.mocked(readFile).mockResolvedValue(data);

    await runQa(250);

    const [, payload] = vi.mocked(writeFile).mock.calls[0];
    const parsed = JSON.parse(payload as string);
    expect(parsed.total).toBe(0);
  });

  it('accepts valid openapiSpec URL', async () => {
    const data = makeData({
      apis: [
        {
          name: 'Test',
          link: 'https://example.com',
          categories: ['Test'],
          sources: ['src'],
          openapiSpec: 'https://example.com/spec.json',
          description: null,
          auth: null,
          cors: null,
        },
      ],
    });
    vi.mocked(readFile).mockResolvedValue(data);

    await runQa(250);

    const [, payload] = vi.mocked(writeFile).mock.calls[0];
    const parsed = JSON.parse(payload as string);
    expect(parsed.total).toBe(0);
  });

  it('groups same issue type from multiple APIs', async () => {
    const data = makeData({
      apis: [
        {
          name: 'API One',
          link: 'bad-url-1',
          categories: ['Test'],
          sources: ['src'],
          description: null,
          auth: null,
          cors: null,
        },
        {
          name: 'API Two',
          link: 'bad-url-2',
          categories: ['Test'],
          sources: ['src'],
          description: null,
          auth: null,
          cors: null,
        },
      ],
    });
    vi.mocked(readFile).mockResolvedValue(data);

    await runQa(250);

    const [, payload] = vi.mocked(writeFile).mock.calls[0];
    const parsed = JSON.parse(payload as string);
    expect(parsed.groups['Missing or invalid link'].count).toBe(2);
    expect(parsed.groups['Missing or invalid link'].items).toHaveLength(2);
  });
});
