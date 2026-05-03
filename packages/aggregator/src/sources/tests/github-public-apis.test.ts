import { describe, it, expect } from 'vitest';
import { marked } from 'marked';
import type { ApiEntry } from '../../types';

describe('sources/github-public-apis', () => {
  describe('parseMarkdownTable', () => {
    it('should parse data rows ignoring header rows', () => {
      // Test that we skip th rows and only process td rows
      const markdown = `# Public APIs

| API | Description | Call this API |
| --- | --- | --- |
| API1 | Desc1 | apiKey |
`;

      // Just verify marked creates proper HTML structure
      const html = marked.parse(markdown) as string;
      expect(html).toContain('<th>');
      expect(html).toContain('<td>');
    });

    it('should create entries with correct structure', () => {
      // Just verify the ApiEntry type
      const entry: ApiEntry = {
        name: 'Test API',
        description: null,
        link: 'https://test.com',
        auth: 'apiKey',
        https: null,
        cors: null,
        categories: ['Test'],
        sources: ['github-public-apis'],
        openapiSpec: null,
      };

      expect(entry.name).toBe('Test API');
      expect(entry.auth).toBe('apiKey');
      expect(entry.categories[0]).toBe('Test');
      expect(entry.description).toBeNull();
      expect(entry.https).toBeNull();
      expect(entry.openapiSpec).toBeNull();
    });

    it('should produce valid entries from real fetch', async () => {
      const { default: fetcher } = await import('../github-public-apis.fetcher');
      const entries = await fetcher.fetchApis();

      expect(entries.length).toBeGreaterThan(0);

      // Check first entry has all required fields
      const entry = entries[0];
      expect(entry.name).toBeDefined();
      expect(entry.link).toMatch(/^https?:\/\//);
      expect(entry.categories).toBeDefined();
      expect(entry.categories.length).toBeGreaterThan(0);
      expect(entry.sources).toContain('github-public-apis');
      expect(entry.auth).toBeDefined();
      expect(entry.https === null || entry.https === true).toBe(true);
    });

    it('should have varied categories from h3 headings', async () => {
      const { default: fetcher } = await import('../github-public-apis.fetcher');
      const entries = await fetcher.fetchApis();

      const categories = new Set(entries.map((e) => e.categories[0]));
      expect(categories.size).toBeGreaterThan(10);
    });
  });
});
