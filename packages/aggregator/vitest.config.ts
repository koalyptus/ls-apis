import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    exclude: ['src/run.ts'],
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      exclude: ['src/run.ts'],
    },
  },
});
