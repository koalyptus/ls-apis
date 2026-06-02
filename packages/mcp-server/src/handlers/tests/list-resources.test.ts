import { describe, it, expect } from 'vitest';
import { getListResourcesResult } from '..';
import { ResourceUri } from '../../types';

describe('getListResourcesResult', () => {
  it('returns data, categories, providers, and stats resources', () => {
    const result = getListResourcesResult();
    expect(result.resources).toHaveLength(4);
    expect(result.resources[0].uri).toBe(ResourceUri.Data);
    expect(result.resources[1].uri).toBe(ResourceUri.Categories);
    expect(result.resources[2].uri).toBe(ResourceUri.Providers);
    expect(result.resources[3].uri).toBe(ResourceUri.Stats);
  });
});
