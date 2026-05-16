import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  testMatch: ['**/*.spec.js'],
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'retain-on-failure',
    viewport: { width: 800, height: 700 },
  },
  webServer: {
    command: 'npx http-server -p 8080 -c-1 -s',
    url: 'http://localhost:8080',
    reuseExistingServer: true,
  },
  projects: [
    {
      name: 'default',
      testIgnore: ['**/visual/**'],
    },
    {
      name: 'visual',
      testMatch: ['**/visual/**'],
      use: { video: 'on' },
    },
  ],
  reporter: 'list',
});
