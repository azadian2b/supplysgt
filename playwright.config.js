const { defineConfig, devices } = require('@playwright/test');

const port = process.env.SUPPLY_SGT_E2E_PORT || 4173;
const baseURL = `http://127.0.0.1:${port}`;
const nodePath = process.execPath;

module.exports = defineConfig({
  testDir: './tests/browser',
  timeout: 30 * 1000,
  expect: {
    timeout: 10 * 1000
  },
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: `"${nodePath}" scripts/serve-build.js --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 15 * 1000
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 }
      }
    },
    {
      name: 'chromium-mobile',
      use: {
        ...devices['Pixel 7']
      }
    }
  ]
});
