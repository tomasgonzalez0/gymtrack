import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/e2e",
  workers: 1,
  use: { baseURL: "http://127.0.0.1:3000" },
  webServer: { command: "npm run db:e2e && npm run build && npm start", url: "http://127.0.0.1:3000", reuseExistingServer: false, timeout: 180_000, env: { E2E_TEST_MODE: "true", AUTH_TRUST_HOST: "true", AUTH_SECRET: "gymtrack-e2e-only-secret-not-for-production" } },
  projects: [
    { name: "mobile", use: { viewport: { width: 375, height: 812 } } },
    { name: "desktop", use: { viewport: { width: 1280, height: 800 } } },
  ],
});
