// Agency OS — composed Drizzle schema (the migration source of truth).
//
// Assembles the desired schema from three sources, all resolved to local
// fayz-sdk source via tsconfig `paths` (the same proxy vite/tsc use):
//   • Ring 0 spine references (@fayz-ai/db) — FK targets, baseline only
//   • Ring 1 plugin tables   (@fayz-ai/plugin-*/schema) — one line per plugin
//   • Ring 2 app extensions  — the agency's own tables (contacts)
//
// `drizzle-kit generate` diffs this against meta/_snapshot.json and emits only
// the delta. Enabling a plugin = adding one re-export line here.

// Ring 0 — spine references (baseline snapshot; never re-created live)
export { tenants, persons, orders } from '@fayz-ai/saas/db'

// Ring 2 — agency-owned extensions
export { contacts } from './contacts'

// Ring 1 — enabled plugins (canonical schema, straight from the SDK)
export * from '@fayz-ai/plugin-crm/schema'
