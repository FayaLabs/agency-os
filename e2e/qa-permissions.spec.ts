import { test, expect } from '@playwright/test'
import { login } from './fixtures/app'
import { AGENT_EMAIL } from './fixtures/backend'

// ===========================================================================
// RBAC — src/config/permissions.ts. The "agent" system profile (the restricted
// QA user) is granted: dashboard, conversations, appointments (Calendars),
// contacts, sales (CRM) and reputation(read). It is NOT granted: marketing,
// automations, sites, financial (Payments), memberships, custom_forms (Forms)
// or reports (Reporting). Nav is gated by these grants and forbidden routes are
// guarded even via direct URL.
//
// (Note: `public.tenant_roles` 404s on this pool — the custom-roles table is
// missing — but the code-defined defaultProfiles still gate correctly.)
// ===========================================================================

const AGENT_MODULES = ['Dashboard', 'Conversations', 'Calendars', 'Contacts', 'CRM', 'Reputation']
// Modules the admin has and the agent does NOT. NOTE: the Forms plugin
// (createCustomFormsPlugin) is configured but never renders in the sidebar for
// anyone (see exploratory findings), so it is intentionally absent here — it
// cannot serve as an admin-vs-agent differentiator.
const ADMIN_ONLY = ['Marketing', 'Automations', 'Sites', 'Payments', 'Memberships', 'Reporting']

test('admin (owner) sees every module', async ({ page }) => {
  // Uses the shared admin storageState from the setup project.
  await page.goto('/#/dashboard')
  const nav = page.getByRole('navigation')
  for (const m of [...AGENT_MODULES, ...ADMIN_ONLY]) {
    await expect(nav.getByRole('button', { name: m, exact: true })).toBeVisible()
  }
})

test.describe('restricted agent', () => {
  // Ignore the admin session; this block logs in as the agent.
  test.use({ storageState: { cookies: [], origins: [] } })

  test('agent nav is scoped to its granted modules', async ({ page }) => {
    await login(page, AGENT_EMAIL)
    const nav = page.getByRole('navigation')

    for (const m of AGENT_MODULES) {
      await expect(nav.getByRole('button', { name: m, exact: true })).toBeVisible()
    }
    for (const m of ADMIN_ONLY) {
      await expect(nav.getByRole('button', { name: m, exact: true })).toHaveCount(0)
    }
  })

  test('agent is blocked from a forbidden route via direct URL', async ({ page }) => {
    await login(page, AGENT_EMAIL)
    await page.goto('/#/financial')
    await expect(page.getByText(/Access restricted/i)).toBeVisible()
    await expect(page.getByText(/don't have permission/i)).toBeVisible()
  })
})
