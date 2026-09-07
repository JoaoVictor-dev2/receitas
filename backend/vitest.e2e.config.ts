import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/e2e/**/*.test.ts'],
    globalSetup: ['tests/e2e/mysql-setup.ts'],
    testTimeout: 15_000,
    hookTimeout: 30_000,
  },
});
