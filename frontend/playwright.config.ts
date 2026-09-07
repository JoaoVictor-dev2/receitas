import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/setup.ts',
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: { browserName: 'chromium', viewport: { width: 1280, height: 800 }, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
});
