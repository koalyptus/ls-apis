import { z } from 'zod';

/** Zod schema for `search-apis` tool input. */
export const SearchApisInput = z.object({
  query: z.string().optional().describe('Search term to match against API names and descriptions'),
  category: z.string().optional().describe('Filter by category (e.g., weather, finance, animals)'),
  auth: z.string().optional().describe('Filter by authentication type: apiKey, OAuth, or no'),
  limit: z.number().optional().describe('Maximum number of results to return (default: 20)'),
});

/** Zod schema for `list-categories` tool input (no arguments). */
export const ListCategoriesInput = z.object({});

/** Zod schema for `list-providers` tool input (no arguments). */
export const ListProvidersInput = z.object({});