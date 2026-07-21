// ---------------------------------------------------------------------------
// Shared UI helpers — logging in and reaching the shell. The app is a hash-
// routed SPA (#/dashboard, #/agenda, …); a hard reload is `page.reload()`,
// NOT a hash navigation (hash nav preserves in-memory React state).
// ---------------------------------------------------------------------------
import { expect, type Page } from '@playwright/test'
import { APP_URL } from '../../playwright.config'
import { QA_PASSWORD, ADMIN_EMAIL } from './backend'

/** Split-login (English shell): email + password + "Sign in". */
export async function login(page: Page, email = ADMIN_EMAIL, password = QA_PASSWORD): Promise<void> {
  await page.goto(APP_URL)
  await page.getByRole('textbox', { name: 'Email' }).fill(email)
  await page.getByRole('textbox', { name: 'Password' }).fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  // Landing on the shell (the left nav rail) confirms the session.
  await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible({ timeout: 30_000 })
}

/** Ensure the authenticated shell is loaded (session comes from storageState). */
export async function openApp(page: Page): Promise<void> {
  if (!page.url().startsWith(APP_URL)) await page.goto(APP_URL)
  await expect(page.getByRole('button', { name: 'Dashboard', exact: true })).toBeVisible({ timeout: 30_000 })
}

/** Open a left-nav module by its label. Boots the shell first if needed.
 * Scoped to the sidebar (complementary) — some pages also render a same-named
 * breadcrumb button in main. */
export async function gotoModule(page: Page, label: string): Promise<void> {
  await openApp(page)
  await page.getByRole('complementary').getByRole('button', { name: label, exact: true }).click()
}
