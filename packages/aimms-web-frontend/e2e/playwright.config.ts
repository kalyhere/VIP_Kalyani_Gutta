import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for AIMMS Web Platform E2E tests
 *
 * Tests run against local Docker development environment.
 * Ensure Docker services are running: npm run dev
 */
export default defineConfig({
  // Test directory (relative to this config file)
  testDir: './',

  // Output directories (relative to this config file)
  outputDir: './test-results',

  // Timeout for each test
  timeout: 30000,

  // Expect timeout for assertions
  expect: {
    timeout: 5000,
  },

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Number of workers
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['list'],
    ['html', { outputFolder: './playwright-report' }],
    ['json', { outputFile: './playwright-report/results.json' }],
  ],

  // Shared settings for all projects
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    // Collect trace - use 'on' to keep for all tests, 'retain-on-failure' for failures only
    trace: process.env.PLAYWRIGHT_TRACE || 'retain-on-failure',

    // Screenshot - use 'on' to keep for all tests, 'only-on-failure' for failures only
    screenshot: process.env.PLAYWRIGHT_SCREENSHOT || 'only-on-failure',

    // Video - use 'on' to keep for all tests, 'retain-on-failure' for failures only
    video: process.env.PLAYWRIGHT_VIDEO || 'retain-on-failure',

    // Action timeout
    actionTimeout: 10000,

    // Navigation timeout
    navigationTimeout: 15000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    // Uncomment to test in Firefox and WebKit
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    // Mobile viewports (optional, add when needed)
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  // Run local dev server before starting tests (optional)
  // Uncomment if you want Playwright to start the Docker environment automatically
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:5173',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120000,
  // },

  // Global setup/teardown (if needed)
  // globalSetup: require.resolve('./e2e/global-setup.ts'),
  // globalTeardown: require.resolve('./e2e/global-teardown.ts'),
});
