-- ============================================================================
-- Agency OS — Ring 2 (app-owned domain extensions for the GoHighLevel model)
-- ============================================================================
-- The agency model maps onto the shared spine like this:
--   * Each sub-account ("location" in GHL) IS a saas_core.tenants row. The
--     OrgSwitcher swaps the active tenant; multiOrg = true.
--   * public.sub_accounts is a 1:1 extension of saas_core.tenants (PK = tenant
--     id) holding the agency-reseller fields the core tenant doesn't carry.
--   * public.snapshots are agency-owned templates (GHL "snapshots") a sub-account
--     can be provisioned from.
-- Convention (DATA-MODEL Ring 2): id-shared 1:1 extensions + app-owned tables,
-- every table carries tenant_id and RLS keyed on saas_core.user_tenant_ids().
-- Idempotent: re-runnable (CREATE ... IF NOT EXISTS + guarded policies).

-- ---------------------------------------------------------------------------
-- Snapshots — agency-owned provisioning templates (GHL "snapshots")
-- Owned by the agency tenant; a sub-account references the one it was built from.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES saas_core.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  config jsonb NOT NULL DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS snapshots_tenant ON public.snapshots(tenant_id);

-- ---------------------------------------------------------------------------
-- Sub-accounts — 1:1 extension of saas_core.tenants (the GHL location surface)
-- PK is the tenant id; tenant_id column = same value so the standard RLS helper
-- and the project_rls auto-discovery both scope it correctly.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sub_accounts (
  tenant_id uuid PRIMARY KEY REFERENCES saas_core.tenants(id) ON DELETE CASCADE,
  -- The parent agency tenant that resells/manages this sub-account.
  -- NULL = this tenant is itself a top-level agency, not a managed sub-account.
  agency_tenant_id uuid REFERENCES saas_core.tenants(id) ON DELETE SET NULL,
  snapshot_id uuid REFERENCES public.snapshots(id) ON DELETE SET NULL,
  business_niche text,
  timezone text DEFAULT 'America/New_York',
  white_label_domain text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'churned')),
  onboarding_completed boolean DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sub_accounts_agency ON public.sub_accounts(agency_tenant_id);

-- ---------------------------------------------------------------------------
-- RLS — tenant isolation, keyed on the shared SECURITY DEFINER helper
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['snapshots', 'sub_accounts']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

    EXECUTE format('DROP POLICY IF EXISTS "tenant_select" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "tenant_insert" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "tenant_update" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "tenant_delete" ON public.%I', tbl);

    EXECUTE format(
      'CREATE POLICY "tenant_select" ON public.%I FOR SELECT TO authenticated USING (tenant_id IN (SELECT saas_core.user_tenant_ids()))',
      tbl
    );
    EXECUTE format(
      'CREATE POLICY "tenant_insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT saas_core.user_tenant_ids()))',
      tbl
    );
    EXECUTE format(
      'CREATE POLICY "tenant_update" ON public.%I FOR UPDATE TO authenticated USING (tenant_id IN (SELECT saas_core.user_tenant_ids()))',
      tbl
    );
    EXECUTE format(
      'CREATE POLICY "tenant_delete" ON public.%I FOR DELETE TO authenticated USING (tenant_id IN (SELECT saas_core.user_tenant_ids()))',
      tbl
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Updated_at triggers (reuse the public helper, created idempotently here so
-- this migration stands alone even if no other public Ring-2 file shipped yet)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['snapshots', 'sub_accounts']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I_updated_at ON public.%I', tbl, tbl);
    EXECUTE format('CREATE TRIGGER %I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at()', tbl, tbl);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
GRANT ALL ON public.snapshots, public.sub_accounts TO authenticated, service_role;
GRANT SELECT ON public.snapshots, public.sub_accounts TO anon;
