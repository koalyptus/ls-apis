import { describe, it, expect } from 'vitest';
import { getListToolsResult } from '..';
import { ToolName } from '../../types';

describe('getListToolsResult', () => {
  it('returns search-apis, list-categories, and list-providers tool definitions', () => {
    const result = getListToolsResult();
    expect(result.tools).toHaveLength(3);
    expect(result.tools[0].name).toBe(ToolName.SearchApis);
    expect(result.tools[0].inputSchema.properties).toHaveProperty('query');
    expect(result.tools[0].inputSchema.properties).toHaveProperty('category');
    expect(result.tools[0].inputSchema.properties).toHaveProperty('auth');
    expect(result.tools[0].inputSchema.properties).toHaveProperty('limit');
    expect(result.tools[1].name).toBe(ToolName.ListCategories);
    expect(result.tools[2].name).toBe(ToolName.ListProviders);
  });
});
