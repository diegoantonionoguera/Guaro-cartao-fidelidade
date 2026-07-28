import { defineConfig, devices } from '@playwright/test';

const artifactsRoot = 'artifacts/playwright';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 30_000,
  expect: {
    timeout: 8_000,
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.025
    }
  },
  reporter: [
    ['line'],
    ['json', { outputFile: `${artifactsRoot}/results.json` }],
    ['html', { outputFolder: `${artifactsRoot}/report`, open: 'never' }]
  ],
  outputDir: `${artifactsRoot}/test-results`,
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
  use: {
    baseURL: 'http://127.0.0.1:4176',
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'node scripts/start-quality-server.mjs',
    url: 'http://127.0.0.1:4176/api/health',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        browserName: 'chromium'
      }
    }
  ]
});
