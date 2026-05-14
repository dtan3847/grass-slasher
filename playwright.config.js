import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npx http-server -p 8080 -c-1 -s',
    url: 'http://localhost:8080',
    reuseExistingServer: true,
  },
  reporter: 'list',
});
