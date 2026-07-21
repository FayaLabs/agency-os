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
  await dialog.getByRole('button', { name: 'Add client' }).click()
  await dialog.getByRole('combobox', { name: /search client/i }).fill('QA')
  await page.getByRole('option', { name: CLIENT }).click()

  // The chosen contact is now shown, and Save is ENABLED — the regression.
  await expect(dialog.getByRole('button', { name: CLIENT })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Save' })).toBeEnabled()
})

// ---------------------------------------------------------------------------
// KNOWN PRODUCT BUG (expected-fail) — the Meeting does not persist E2E on this
// pool. The Save-enable fix above is correct, but clicking Save fails because:
//   1) plugin-agenda sends `assignee_id: ""` (empty string) for a booking type
//      with professional:false → Postgres 22P02 "invalid input syntax for type
//      uuid: \"\"" → POST /orders?select=id 400. Root cause:
//      AppointmentModal.tsx:300 defaults professionalId to '' and passes it
//      straight to data/supabase.ts:279 `assignee_id: input.professionalId`.
//   2) the read model view `public.v_appointments` is missing on this pool
//      (404), so even a persisted row never renders on the calendar grid.
// When the SDK fixes (1), this test will start passing and Playwright will flag
// it as "unexpectedly passed" — the signal to drop test.fail().
// ---------------------------------------------------------------------------
test('a Meeting persists to the pool after Save', async ({ page }) => {
  test.fail(true, 'plugin-agenda posts assignee_id:"" (uuid 400) + v_appointments 404 — see block comment')

  const sb = await tenantClient()
  const before = await countRows(sb, 'appointments')

  const dialog = await openNewMeeting(page)
  await dialog.getByRole('button', { name: 'Add client' }).click()
  await dialog.getByRole('combobox', { name: /search client/i }).fill('QA')
  await page.getByRole('option', { name: CLIENT }).click()
  await dialog.getByRole('button', { name: 'Save' }).click()

  // On success the modal closes; here it stays open because the write 400s.
  await expect(dialog).toBeHidden({ timeout: 10_000 })
  const after = await countRows(sb, 'appointments')
  expect(after).toBe(before + 1)
})
