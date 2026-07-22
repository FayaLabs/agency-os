import { test, expect, type Page } from '@playwright/test'
import { gotoModule } from './fixtures/app'
import { tenantClient, countRows } from './fixtures/backend'

// ===========================================================================
// Conversations (unified inbox) — pool-backed. Creating a conversation writes a
// row to public.plg_conversations (+ plg_conversation_messages), so it survives
// a hard reload. (The inbox also shows a few static demo threads, e.g. "Marina
// Alves", as sample content; the REAL created ones persist to the pool.)
// ===========================================================================

const MSG = 'hello from the QA e2e suite'
const CONTACT = 'QA Cliente Um' // seeded person(kind=contact) in the QA tenant

async function createConversation(page: Page, contact: string) {
  await gotoModule(page, 'Conversations')
  await page.getByTestId('conversations-new').click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByPlaceholder(/jane doe/i).fill(contact)
  await dialog.getByPlaceholder(/first message/i).fill(MSG)
  await dialog.getByRole('button', { name: 'Start conversation' }).click()
  await expect(dialog).toBeHidden()
}

test('inbox renders and a new conversation can be created + shown', async ({ page }) => {
  const contact = `QA Conv ${Date.now()}`
  await gotoModule(page, 'Conversations')
  await expect(page.getByRole('button', { name: /New conversation/i })).toBeVisible()

  await createConversation(page, contact)
  // The newly-created conversation shows in the list + thread immediately.
  await expect(page.getByText(contact).first()).toBeVisible()
  await expect(page.getByText(MSG).first()).toBeVisible()
})

test('a created conversation persists to the pool across a hard reload', async ({ page }) => {
  const contact = `QA Conv Persist ${Date.now()}`
  const sb = await tenantClient()
  const before = await countRows(sb, 'plg_conversations')

  await createConversation(page, contact)
  // A real row landed in the pool…
  await expect.poll(() => countRows(sb, 'plg_conversations'), { timeout: 15_000 })
    .toBe(before + 1)

  // …and it survives a hard reload (not just in-memory state).
  await page.reload()
  await gotoModule(page, 'Conversations')
  await expect(page.getByText(contact).first()).toBeVisible()
})

// ---------------------------------------------------------------------------
// Contact picker — the compose modal uses the SAME find-or-create flow as the
// calendars (shared ContactPicker over public.people). Picking an existing
// person must LINK the thread to them (contact_person_id), not just copy their
// name as text, and it must autofill the handle from their phone/email.
// ---------------------------------------------------------------------------

test('picking a seeded contact links the thread to that person', async ({ page }) => {
  const sb = await tenantClient()

  await gotoModule(page, 'Conversations')
  await page.getByTestId('conversations-new').click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()

  // Search the tenant's people and pick a real one.
  await dialog.getByPlaceholder(/jane doe/i).fill('QA Cliente')
  await page.getByRole('option', { name: CONTACT }).click()

  // The picked person shows as a chip. This seeded contact has an email but NO
  // phone, so on WhatsApp there is nothing to derive — the composer offers to
  // add one instead of quietly messaging an email address.
  await expect(dialog.getByRole('button', { name: CONTACT })).toBeVisible()
  await expect(dialog.getByRole('button', { name: /add phone/i })).toBeVisible()

  // Switch to Email and the same contact DOES have something to derive: it
  // rides on the chip and no second field appears.
  await dialog.getByRole('button', { name: 'Email' }).click()
  await expect(dialog.getByText('qa.cliente1@fayalabs.com')).toBeVisible()
  await expect(dialog.getByLabel(/phone \/ handle \/ email/i)).toBeHidden()
  await dialog.getByRole('button', { name: 'WhatsApp' }).click()

  await dialog.getByPlaceholder(/first message/i).fill(MSG)
  await dialog.getByRole('button', { name: 'Start conversation' }).click()
  await expect(dialog).toBeHidden()

  // The row carries the person link — this is what makes the thread the same
  // "Maria" the agenda and the CRM know about.
  const { data } = await sb
    .from('plg_conversations')
    .select('contact_name, contact_person_id, contact_handle')
    .eq('contact_name', CONTACT)
    .order('created_at', { ascending: false })
    .limit(1)
  expect(data?.[0]?.contact_person_id).toBeTruthy()
})

test('an unmatched name still starts a thread, with no person attached', async ({ page }) => {
  const sb = await tenantClient()
  const contact = `QA Freetext ${Date.now()}`

  await createConversation(page, contact)

  const { data } = await sb
    .from('plg_conversations')
    .select('contact_name, contact_person_id')
    .eq('contact_name', contact)
    .limit(1)
  expect(data?.[0]).toBeTruthy()
  expect(data?.[0]?.contact_person_id).toBeNull()
})

test('creating a contact inline asks for the phone once, then links the new person', async ({ page }) => {
  const sb = await tenantClient()
  const name = `QA Novo ${Date.now()}`
  const phone = '+55 11 90000-1234'

  await gotoModule(page, 'Conversations')
  await page.getByTestId('conversations-new').click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()

  await dialog.getByPlaceholder(/jane doe/i).fill(name)
  await page.getByRole('option', { name: /new contact/i }).click()

  // While the inline create form is open it owns phone/email — the composer must
  // show neither its own field nor the "add phone" affordance (it duplicated).
  await expect(dialog.getByPlaceholder(/^Phone$/)).toBeVisible()
  await expect(dialog.getByLabel(/phone \/ handle \/ email/i)).toBeHidden()
  await expect(dialog.getByRole('button', { name: /add phone/i })).toBeHidden()

  await dialog.getByPlaceholder(/^Phone$/).fill(phone)
  await dialog.getByRole('button', { name: 'Create', exact: true }).click()

  // Created → the phone the user just entered rides on the chip (derived), so no
  // second field comes back asking for it again.
  await expect(dialog.getByRole('button', { name })).toBeVisible()
  await expect(dialog.getByText(phone)).toBeVisible()
  await expect(dialog.getByLabel(/phone \/ handle \/ email/i)).toBeHidden()

  await dialog.getByPlaceholder(/first message/i).fill(MSG)
  await dialog.getByRole('button', { name: 'Start conversation' }).click()
  await expect(dialog).toBeHidden()

  // The person exists in public.people and the thread points at them.
  const { data: people } = await sb.from('people').select('id, name, phone').eq('name', name).limit(1)
  expect(people?.[0]?.id).toBeTruthy()
  const { data: conv } = await sb
    .from('plg_conversations').select('contact_person_id').eq('contact_name', name).limit(1)
  expect(conv?.[0]?.contact_person_id).toBe(people?.[0]?.id)
})
