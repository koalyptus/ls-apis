import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['src/run.ts'],
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      exclude: ['src/run.ts'],
    },
  },
});
