import { defineConfig, devices } from "@playwright/test";

const testPort = process.env.PLAYWRIGHT_PORT ?? "3199";
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${testPort}`;
const webServerCommand = `bash scripts/playwright-webserver.sh`;

export default defineConfig({
  expect: {
    toHaveScreenshot: { maxDiffPixels: 50 },
  },
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: false,
  outputDir: "tests/browser/test-results",
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "tests/browser/report" }],
  ],
  retries: process.env.CI ? 1 : 0,
  testDir: "tests/browser",
  timeout: 60_000,
  use: {
    baseURL,
    locale: "en-US",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    viewport: { height: 900, width: 1280 },
  },
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: webServerCommand,
        env: { GENUI_FIXTURE_LAB: "1" },
        reuseExistingServer:
          Boolean(process.env.PLAYWRIGHT_BASE_URL) || process.env.CI !== "true",
        stdout: "pipe",
        timeout: 300_000,
        url: `${baseURL}/`,
      },
  workers: 1,
});
