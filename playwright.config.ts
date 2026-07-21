import { defineConfig, devices } from '@playwright/test'

// ---------------------------------------------------------------------------
// Agency OS — QA E2E suite (real Supabase pool, live dev server on :5303).
//
// The app runs against the LIVE "cluster-agency-br-01" pool
// (bcxumqjrduekrsasduwe) with VITE_SUPABASE_ENABLED=true, authenticated as the
// seeded QA tenant (a0000000-…-0003). The `setup` project logs in once as the
// admin (qa+agency) and persists the Supabase session to storageState so the
// specs attach as a real tenant member. qa-permissions logs in inline as the
// restricted `agent` user (its own context), so it does NOT use the shared
// admin session.
//
// The dev server is expected to already be running; reuseExistingServer
// attaches to whatever is on :5303 (and boots it if nothing is there).
// ---------------------------------------------------------------------------
export const APP_PORT = 5303
export const APP_URL = `http://localhost:${APP_PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Serial: specs share the one QA tenant's live data; a row created by one
  // spec must not race another's assertions.
  workers: 1,
  reporter: [['list']],
  timeout: 90_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: APP_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 20_000,
    locale: 'en-US',
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/admin.json' },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: APP_URL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
