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
