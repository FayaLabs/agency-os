import { test, expect } from '@playwright/test'
import { gotoModule, openApp } from './fixtures/app'
import { tenantClient, countRows, QA_TENANT_ID } from './fixtures/backend'

// ===========================================================================
// Regression sweep for the dbbf4e5 fixes + shell honesty. The QA tenant is
// seeded with 4 people(kind=contact) and 1 appointment this week, so the real
// KPIs are deterministic: Active contacts = 4, Meetings (this week) >= 1.
// ===========================================================================

async function openDashboard(page: import('@playwright/test').Page) {
  await gotoModule(page, 'Dashboard')
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 2 })).toBeVisible()
}

// A KPI card = the deepest div that contains BOTH the metric label and a digit
// (its value). Avoids brittle parent-hop assumptions about the card's DOM.
function kpiCard(page: import('@playwright/test').Page, label: string) {
  return page.locator('div').filter({ hasText: label }).filter({ hasText: /\d/ }).last()
}

test('dashboard renders REAL KPIs (not hardcoded placeholders)', async ({ page }) => {
  // Ground truth from the pool — the KPI must equal the live count, proving it
  // is computed (not a placeholder). Robust to any spec-created contacts.
  const sb = await tenantClient()
  const activeContacts = await countRows(sb, 'people', { kind: 'contact', is_active: true })
  expect(activeContacts).toBeGreaterThanOrEqual(4) // seeded baseline

  await openDashboard(page)
  await expect(kpiCard(page, 'Active contacts')).toContainText(String(activeContacts))
  await expect(kpiCard(page, 'Meetings (this week)')).toContainText(/[1-9]/)

  // The pre-fix hardcoded placeholder (342) must be gone.
  await expect(page.locator('main')).not.toContainText('342')

  // NOTE (known product bug, not asserted here): the dashboard still renders
  // three SDK-default demo cards that are NOT in src/config/dashboard.tsx —
  // "Won deals" (hardcoded 786 / +16%), "Total Balance" and "Open Pipeline".
  // The app's configured `metrics` array does not replace those defaults.
})

test('onboarding checklist reflects real tenant state (2/4 done)', async ({ page }) => {
  await openDashboard(page)
  // import-contacts (people exist) + book-meeting (1 appointment) auto-complete;
  // first-deal + send-invoice remain → 2/4.
  await expect(page.getByText('Getting Started')).toBeVisible()
  await expect(page.getByText('2/4')).toBeVisible()
})

test('company settings save and persist across reload', async ({ page }) => {
  // The seeded tenant name; restore to this so a failure can't leave the shared
  // tenant nameless (which would cascade into the workspace-switcher test).
  const KNOWN = 'QA Fayz Agency OS'
  const probe = `QA Persist Probe ${Date.now() % 10000}`

  await openApp(page)
  await page.goto('/#/settings')
  const field = page.locator('#company-name')
  await expect(field).toBeVisible()
  // The field starts empty and is populated from the org fetch ~async; typing
  // before that lands makes Save read stale state. Wait for the load first.
  await expect(field).toHaveValue(/\S/, { timeout: 15_000 })

  // The Save button that belongs to the Company Information <form> (the same
  // form as #company-name) — avoids any other "Save Changes" on the page.
  const saveBtn = page.locator('#company-name')
    .locator('xpath=ancestor::form')
    .getByRole('button', { name: 'Save Changes' })
  const sb = await tenantClient()
  const dbName = async () =>
    (await sb.from('tenants').select('name').eq('id', QA_TENANT_ID).single()).data?.name

  // Persistence is proven directly against the pool. Real typing
  // (pressSequentially) is required — a bare fill() doesn't trip this React
  // input's onChange in headless, so the form never dirties and Save no-ops.
  const setName = async (value: string) => {
    const field = page.locator('#company-name')
    await field.click()
    await field.press('ControlOrMeta+a')
    await field.pressSequentially(value)
    await expect(field).toHaveValue(value)
    await saveBtn.click()
    await expect.poll(dbName, { timeout: 15_000 }).toBe(value)
  }

  try {
    await setName(probe)
    await page.reload()
    await expect(page.locator('#company-name')).toHaveValue(probe)
  } finally {
    await setName(KNOWN).catch(() => {})
  }
})

test('a plugin settings toggle persists across a hard reload', async ({ page }) => {
  await page.goto('/#/settings/agenda')
  // Innermost row div that contains BOTH the label and its switch.
  const rowFor = (label: string) =>
    page.locator('div')
      .filter({ has: page.getByText(label, { exact: true }) })
      .filter({ has: page.getByRole('switch') })
      .last()
  const sw = rowFor('Enable Location Selection').getByRole('switch')
  await expect(sw).toBeVisible()

  const initial = await sw.getAttribute('aria-checked')
  const flipped = initial === 'true' ? 'false' : 'true'
  // force:true dispatches the toggle directly (Radix Switch), immune to
  // transient stability quirks that can swallow a normal click.
  await sw.click({ force: true })
  await expect(sw).toHaveAttribute('aria-checked', flipped)

  await page.reload()
  await expect(rowFor('Enable Location Selection').getByRole('switch'))
    .toHaveAttribute('aria-checked', flipped)

  // Restore to the initial state.
  const swAfter = rowFor('Enable Location Selection').getByRole('switch')
  if (await swAfter.getAttribute('aria-checked') !== initial) await swAfter.click({ force: true })
})

test('assistant FAB is honest when unconfigured', async ({ page }) => {
  await openDashboard(page)
  await page.getByRole('button', { name: 'Open chat' }).click()
  await expect(page.getByText(/Assistant not configured/i)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Send message' })).toBeDisabled()
})

test('notifications bell opens an honest empty inbox', async ({ page }) => {
  await openDashboard(page)
  await page.getByRole('button', { name: 'Notifications' }).click()
  await expect(page.getByText('No notifications')).toBeVisible()
})

test('workspace switcher is honest about the single workspace', async ({ page }) => {
  await openDashboard(page)
  // The workspace switcher is the FIRST button in the sidebar (<aside>) nav — a
  // Radix menu trigger above the module list; its label may render icon-only.
  const trigger = page.locator('aside nav button').first()
  // The menu isn't interactive until the org data has loaded; re-click until it
  // opens (a single click right after nav can land before it's ready).
  await expect(async () => {
    if (!(await page.getByText(/only workspace/i).isVisible().catch(() => false))) {
      await trigger.click()
    }
    await expect(page.getByText(/only workspace/i)).toBeVisible({ timeout: 2_000 })
  }).toPass({ timeout: 20_000 })
})
