import { test as setup } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { login } from './fixtures/app'
import { ADMIN_EMAIL } from './fixtures/backend'

// Persist the admin (qa+agency) Supabase session so the specs attach as a real
// tenant member. The session token lives in localStorage under the app origin.
const authFile = path.join('e2e', '.auth', 'admin.json')

setup('authenticate (QA admin)', async ({ page }) => {
  fs.mkdirSync(path.dirname(authFile), { recursive: true })
  await login(page, ADMIN_EMAIL)
  await page.context().storageState({ path: authFile })
})
