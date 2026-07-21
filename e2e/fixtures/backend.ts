// ---------------------------------------------------------------------------
// Shared backend helpers for the Agency OS QA suite.
//
// The app and these helpers talk to the SAME live pool (cluster-agency-br-01 /
// bcxumqjrduekrsasduwe) with the SAME publishable key the app uses. Credentials
// are read at runtime from the repo's own (gitignored) .env — NEVER hardcoded.
// A password-authenticated client (RLS-scoped as the QA tenant member) is used
// only to READ the pool for assertions (e.g. "did the row actually persist?").
// No Management API, no service-role key.
// ---------------------------------------------------------------------------
import fs from 'node:fs'
import path from 'node:path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function readDotEnv(): Record<string, string> {
  const file = path.resolve(process.cwd(), '.env')
  const out: Record<string, string> = {}
  if (!fs.existsSync(file)) return out
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return out
}
const dotenv = readDotEnv()
function envVar(...names: string[]): string | undefined {
  for (const n of names) {
    if (process.env[n]) return process.env[n]
    if (dotenv[n]) return dotenv[n]
  }
  return undefined
}

export const SUPABASE_URL = envVar('VITE_SUPABASE_URL', 'SUPABASE_URL') ?? ''
export const SUPABASE_ANON_KEY =
  envVar('VITE_SUPABASE_PUBLISHABLE_KEY', 'VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY') ?? ''
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('[e2e] Missing Supabase config — set VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY in .env')
}

// Seeded QA tenant (Clínica/Agency QA). Both users are members of it.
export const QA_TENANT_ID = 'a0000000-0000-4000-8000-000000000003'

// The QA users share one password (gitignored). The admin is the tenant owner;
// the restricted user is an "agent" (see src/config/permissions.ts).
export const QA_PASSWORD = envVar('QA_TENANT_PASSWORD')
  ?? (() => { throw new Error('QA_TENANT_PASSWORD missing — set it in .env (gitignored)') })()
export const ADMIN_EMAIL = envVar('QA_ADMIN_EMAIL') ?? 'qa+agency@fayalabs.com'
export const AGENT_EMAIL = envVar('QA_AGENT_EMAIL') ?? 'qa-restrito+agency@fayalabs.com'

/** Password-authenticated client acting as a tenant member (READ-only usage). */
export async function tenantClient(email = ADMIN_EMAIL): Promise<SupabaseClient> {
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { error } = await sb.auth.signInWithPassword({ email, password: QA_PASSWORD })
  if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`)
  return sb
}

/** Exact row count for a table (RLS-scoped to the signed-in member). */
export async function countRows(
  sb: SupabaseClient, table: string, filters: Record<string, string | number | boolean> = {},
): Promise<number> {
  let q = sb.from(table).select('*', { count: 'exact', head: true })
  for (const [k, v] of Object.entries(filters)) q = q.eq(k, v)
  const { count, error } = await q
  if (error) throw new Error(`countRows(${table}): ${error.message}`)
  return count ?? 0
}
