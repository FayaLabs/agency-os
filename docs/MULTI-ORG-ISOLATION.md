# Multi-org isolation (A3) — confirmation record

Agency OS runs the GoHighLevel model on the shared Fayz spine: **every sub-account
("location") IS a `saas_core.tenants` row**, and the agency operator switches between
sub-accounts via the OrgSwitcher (`multiOrg: true`, `src/config/app.tsx`). This doc
records the verified isolation chain so A-CHECK has a precise smoke-test checklist.

## The two-layer isolation model

Isolation across sub-accounts holds because of two independent layers — a hard DB
boundary plus a soft active-tenant filter:

1. **RLS (hard boundary).** Every tenant-scoped table — Ring 0 archetypes
   (`saas_core.*`), Ring 1 plugin tables, and Ring 2 extensions
   (`public.sub_accounts`, `public.snapshots`, `public.conversations`,
   `public.conversation_messages`) — enforces
   `tenant_id IN (SELECT user_tenant_ids())`. A logged-in operator can *never* read a
   tenant they are not a member of, regardless of what the client requests.
2. **Active-tenant filter (UI scoping).** Within the tenants the operator *can* see,
   reads/writes are narrowed to the **one** currently-selected sub-account via
   `getActiveTenantId()`, injected into every data provider.

## The wired chain (confirmed)

| Link | Where | Confirmed |
|---|---|---|
| OrgSwitcher lists all the operator's sub-account tenants | `packages/saas` `createSupabaseOrgAdapter.listUserOrgs` — reads `tenant_members` for `user_id`, joins `tenants` | ✓ returns every membership, so each managed sub-account appears |
| Switching a sub-account sets the active tenant | `packages/saas/src/org/store.ts` `setCurrentOrg` → `setActiveTenantId(org.id)`; `reset()` → `setActiveTenantId(undefined)` | ✓ set on switch, cleared on logout |
| Stock plugins (CRM, calendars, financial, marketing, …) scope to active tenant | `packages/core/src/data/resolve.ts` `resolveDataProvider` injects `() => getActiveTenantId()`; cache keyed on tenant | ✓ (established in beauty B7) |
| Conversations (new in A2) scopes to active tenant | `plugins/plugin-conversations/src/index.ts` `createSafeProvider` auto-selects `createSupabaseConversationsProvider({ tenantId: () => getActiveTenantId() })` when a Supabase client is present | ✓ reads filter `tenant_id`, writes stamp `tenant_id` |
| Real-vs-mock selection | `src/config/app.tsx` — `auth`/`org` adapters + `supabaseUrl` gate on `VITE_SUPABASE_URL` | ✓ boots mock with no env, real Supabase with env |

The `user_tenant_ids()` RLS helper exists in **both** schemas
(`public.user_tenant_ids()` from `20260101000002_project_rls.sql` and
`saas_core.user_tenant_ids()` from `20260101000007_fix_archetype_rls.sql`); both query
`saas_core.tenant_members` identically, so the `saas_core.`-qualified policies in the
agency Ring-2 migrations (`20260101000020`, `20260101000021`) resolve correctly.

## No custom read paths bypass scoping

Unlike beauty-saas (which had an anon public-booking read fixed in B7), Agency OS uses
**only stock SDK plugins** — there are no app-owned `fayz.data`/`supabase` reads in
`src/`. The dashboard metrics (`src/config/dashboard.tsx`) and onboarding checks are
still hardcoded mock (`async () => false`), so they touch no tenant data; wiring them to
real data is a separate task, not an isolation concern.

## A-CHECK smoke test (for the human)

1. Apply migrations to the fresh DB (`bcxumqjrduekrsasduwe`): `supabase db push`.
2. Set `VITE_SUPABASE_URL` + key in `.env` so auth/org/data use the real adapter.
3. Seed at least two tenants the test user is a member of (an agency tenant + a
   sub-account, or two sub-accounts). Optionally insert `public.sub_accounts` rows
   linking them via `agency_tenant_id`.
4. Log in; in the OrgSwitcher confirm **both** tenants appear.
5. Create a CRM contact + a conversation in sub-account A. Switch to sub-account B and
   confirm A's contact/conversation are **not** visible (active-tenant filter swaps; the
   data cache clears on switch).
6. Negative RLS check: confirm a tenant the test user is **not** a member of is absent
   from the OrgSwitcher and its rows are unreadable even by direct id.

## Open convention note (defer to M-LOCK)

The agency Ring-2 policies call `saas_core.user_tenant_ids()`; the auto-discovered
`project_rls` policies call `public.user_tenant_ids()`. Functionally identical, but the
capability gate will likely want a single canonical form (same divergence flagged for
resto in R-CHECK). Standardize at lock-time, not here.
