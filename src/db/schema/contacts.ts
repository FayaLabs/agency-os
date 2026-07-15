import { pgTable, uuid, text, tenantId, timestamps, people } from '@fayz-ai/saas/db'

// ---------------------------------------------------------------------------
// Ring-2 archetype extension: agency contacts.
// person(kind=contact) lives on public.people; this 1:1 table holds the
// agency-specific columns. The v_contacts read-view (people ⋈ contacts) is
// companion SQL. This Drizzle definition mirrors the table currently live in
// the agency DB, so it forms the migration baseline — edits here generate ALTERs.
// ---------------------------------------------------------------------------
export const contacts = pgTable('contacts', {
  personId: uuid('person_id').primaryKey().references(() => people.id, { onDelete: 'cascade' }),
  tenantId: tenantId(),
  source: text('source'),
  lifecycleStage: text('lifecycle_stage').notNull().default('lead'),
  company: text('company'),
  segment: text('segment'),
  ownerId: uuid('owner_id'),
  ...timestamps,
})
