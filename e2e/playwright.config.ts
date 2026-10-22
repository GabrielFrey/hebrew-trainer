import { defineConfig, devices } from "@playwright/test";

const api = process.env.E2E_API_URL || "http://127.0.0.1:43180";
const web = process.env.E2E_WEB_URL || "http://127.0.0.1:43181";
const python = process.env.E2E_PYTHON || "apps/api/.venv/bin/python";

export default defineConfig({
  testDir: "./",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: web,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: `${python} -m uvicorn biti.main:app --app-dir apps/api --host 127.0.0.1 --port 43180`,
      url: `${api}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        BITI_ENV: "development",
        BITI_DEMO_MODE: "true",
        BITI_SECRET_KEY: "e2e-secret-key-not-for-production",
        BITI_DATABASE_URL: "sqlite:///./data/local/biti-e2e.sqlite",
        BITI_CORS_ORIGINS: "http://127.0.0.1:43181,http://localhost:43181",
      },
    },
    {
      command: "npm --prefix apps/web run dev",
      url: web,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        NEXT_PUBLIC_API_URL: api,
      },
    },
  ],
});
