import { test, expect } from '@playwright/test'
import { gotoModule } from './fixtures/app'
import { tenantClient, countRows } from './fixtures/backend'

// ===========================================================================
// REGRESSION OF THE PRIMARY FIX (commit dbbf4e5) — the agency "Meeting".
//
// An agency books MEETINGS with a contact and NO service catalog. The stock
// 'appointment' booking type defaults to requiresServices:true, which made the
// modal's Save UNREACHABLE (no serviceLookup ⇒ can never satisfy the gate).
// The app redefines the type as client-only (requiresServices:false,
// requiresClient:true) + a contactLookup, so Save now hinges solely on picking
// a contact. Before the fix, Save NEVER enabled.
// ===========================================================================

const CLIENT = 'QA Cliente Um' // seeded person(kind=contact) in the QA tenant

async function openNewMeeting(page: import('@playwright/test').Page) {
  await gotoModule(page, 'Calendars')
  await page.getByRole('button', { name: 'Create' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  return dialog
}

test('Save is gated until a contact is chosen, then enables (the fix)', async ({ page }) => {
  const dialog = await openNewMeeting(page)

  // Fresh modal: no client yet ⇒ Save disabled (this is exactly what the fix
  // keeps honest — it enables on client, not on a phantom service).
  await expect(dialog.getByRole('button', { name: 'Save' })).toBeDisabled()

  // Pick a seeded contact from the client lookup.
  await dialog.getByRole('combobox', { name: /search client/i }).fill('QA')
  await page.getByRole('option', { name: CLIENT }).click()

  // The chosen contact is now shown, and Save is ENABLED — the regression.
  await expect(dialog.getByRole('button', { name: CLIENT })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Save' })).toBeEnabled()
})

// ---------------------------------------------------------------------------
// Was an expected-fail for two now-fixed causes, kept documented so the history
// reads straight: (1) plugin-agenda posted `assignee_id: ""` for a booking type
// with professional:false → uuid 22P02 → POST /orders 400; the provider now
// writes `input.professionalId || null`. (2) `public.v_appointments` was missing
// from this pool; it exists. Both verified before dropping test.fail().
// ---------------------------------------------------------------------------
test('a Meeting persists to the pool after Save', async ({ page }) => {
  const sb = await tenantClient()
  const before = await countRows(sb, 'appointments')

  const dialog = await openNewMeeting(page)
  await dialog.getByRole('combobox', { name: /search client/i }).fill('QA')
  await page.getByRole('option', { name: CLIENT }).click()
  await dialog.getByRole('button', { name: 'Save' }).click()

  await expect(dialog).toBeHidden({ timeout: 10_000 })
  const after = await countRows(sb, 'appointments')
  expect(after).toBe(before + 1)
})
