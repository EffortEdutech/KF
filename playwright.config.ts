import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.KF_STUDIO_URL ?? "http://localhost:4700";
const testResetToken = process.env.KF_TEST_RESET_TOKEN ?? "kf-local-runtime-reset";
const webServer = process.env.KF_SKIP_PLAYWRIGHT_WEBSERVER
  ? undefined
  : {
      command: "node scripts/runtime-studio-server.mjs",
      env: {
        KF_ALLOW_DATABASE_TEST_RESET: "1",
        KF_ENABLE_TEST_RESET: "1",
        KF_TEST_RESET_TOKEN: testResetToken
      },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      url: baseURL
    };

export default defineConfig({
  testDir: "./tests/runtime",
  timeout: 30_000,
  expect: {
    timeout: 10_000
  },
  use: {
    baseURL,
    extraHTTPHeaders: {
      "x-kf-test-reset-token": testResetToken
    },
    trace: "retain-on-failure"
  },
  webServer,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
