import { test, expect, type Page } from '@playwright/test'
import { gotoModule } from './fixtures/app'

// ===========================================================================
// Contacts CRUD — the agency's central people directory. The custom CRUD page
// (createCrudPage(contactEntity)) writes person(kind=contact) + the Ring-2
// public.contacts extension and reads them back through v_contacts. Full-page
// forms save via the app-wide floating SaveBar (not an inline button).
// ===========================================================================

const NAME = `QA CRUD ${Date.now()}`
const EDITED = `${NAME} Edited`

function row(page: Page, name: string) {
  return page.locator('tbody tr').filter({ hasText: name })
}

// The SaveBar slides in with an animation; a single click can land mid-animate
// and be lost. Click until the expected post-condition holds.
async function clickUntil(page: Page, button: string, done: () => Promise<void>) {
  await expect(async () => {
    const btn = page.getByRole('button', { name: button, exact: true })
    if (await btn.isVisible().catch(() => false)) await btn.click({ timeout: 3000 }).catch(() => {})
    await done()
  }).toPass({ timeout: 25_000 })
}

test('create, edit and delete a contact (persisted through v_contacts)', async ({ page }) => {
  await gotoModule(page, 'Contacts')

  // CREATE — list "+ Add Contact" opens the form; the floating SaveBar's
  // "Add Contact" (no "+") commits once the form is dirty.
  await page.getByRole('button', { name: '+ Add Contact' }).click()
  // Name is the only required field on the form — unambiguous.
  await page.locator('main input[required]').first().fill(NAME)
  await clickUntil(page, 'Add Contact', async () => {
    await expect(row(page, NAME)).toBeVisible({ timeout: 3000 })
  })

  // EDIT — open detail → Edit → change the name → Save Changes.
  await row(page, NAME).getByRole('cell', { name: NAME }).click()
  await page.getByRole('button', { name: 'Edit' }).first().click()
  await page.locator('main input[required]').first().fill(EDITED)
  await clickUntil(page, 'Save Changes', async () => {
    await expect(page.locator('main input[required]').first()).toHaveValue(EDITED, { timeout: 3000 })
    await expect(page.getByRole('button', { name: 'Save Changes' })).toHaveCount(0, { timeout: 3000 })
  })
  await gotoModule(page, 'Contacts')
  await expect(row(page, EDITED)).toBeVisible()

  // DELETE — the row's trash action → confirm dialog → Delete.
  await row(page, EDITED).locator('td:last-child button').last().click()
  const confirm = page.getByRole('dialog').filter({ hasText: /Delete Contact/i })
  await expect(confirm).toBeVisible()
  await confirm.getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(row(page, EDITED)).toHaveCount(0)
})
