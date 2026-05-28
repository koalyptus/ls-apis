---
name: add-fetcher
description: Guide for adding a new API data source fetcher to the ls-apis aggregator
---

# Add API Fetcher Skill

This skill guides you through adding a new API data source fetcher to the ls-apis aggregator.

## When to Use

Use this skill when you want to add a new API data source (like APIs.guru, Public APIs, etc.) to the aggregator.

## How to Invoke

Use the skill with `/skill add-fetcher` command

## Process

1. Prompt for fetcher name. Validate that the name uses only lowercase letters, digits, and hyphens, starts with a letter, and is max 30 characters (example: newsource)
2. Create fetcher file from template at `packages/aggregator/src/sources/<fetcher-name>.fetcher.ts` where `<fetcher-name>` is exactly the validated name from step 1. If a file with this name exists, abort and prompt to choose a different name.
3. Create test file from template at `packages/aggregator/src/sources/tests/<fetcher-name>.test.ts`
4. Implement the fetcher to export a default object that conforms to the SourceFetcher interface:
   - `name`: string (should match the fetcher name from step 1)
   - `sourceUrl`: string (the base URL of the API source)
   - `fetchApis()`: async function that returns Promise<ApiEntry[]>

   The `fetchApis()` function must:
   - Make HTTP requests to the source's API
   - Transform response data into the ApiEntry shape defined in ../types.ts
   - Throw errors on non-2xx HTTP responses (after 3 retry attempts with exponential backoff)
   - Validate fetched records against the ApiEntry schema; log warnings and skip invalid records
   - Return an array of ApiEntry objects where each entry has:
     - `name`: string (API title/name)
     - `description`: string | null (API description)
     - `link`: string (API homepage/link)
     - `auth`: string | null (authentication type: 'apiKey', 'OAuth', 'no', etc.)
     - `cors`: string | null ('yes', 'no', 'unknown')
     - `categories`: string[] (array of category strings)
     - `openapiSpec`: string | null (URL to OpenAPI/Spec document)
     - `sources`: string[] (should include the fetcher name)

5. Update the test file with:
   - Unit tests for success and error responses (must include mock network responses)
   - Integration test that runs the fetcher and asserts at least one aggregated item is produced
   - Assertions for the expected ApiEntry structure
   - Tests that validate error handling and retry logic
   - If mocks are missing, fail the test with a message: 'Missing required mock for <endpoint>'
6. After successful test creation, run `npm run test:aggregator` to verify the new fetcher test passes (failing tests should cause this command to exit non-zero)
7. Run `npm run aggregate` and verify:
   - Command exits with code 0
   - Aggregated output includes entries from the new source
   - Check that `packages/cli/data/apis.json` contains at least one record with `sources` containing the fetcher name
8. Run `npm run lint` and `npm run format` before considering the task complete (CI will reject commits that fail linting)
