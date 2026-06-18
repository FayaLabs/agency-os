import { defineConfig } from 'drizzle-kit'

// Schema migrations live here (Drizzle owns the schema lifecycle); the Supabase
// CLI owns the platform (auth/storage/edge). Generate is offline — it diffs the
// composed TS schema against meta/_snapshot.json. Apply is done by the host
// (locally: `drizzle-kit migrate`; agency/editor: the Management-API executor),
// so no connection string is required to generate.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  schemaFilter: ['public', 'saas_core'],
  verbose: true,
  strict: true,
})
