-- Agency Contacts — the central people directory (GHL-style). Ring-2 extension of
-- person(kind=contact): saas_core.persons holds identity, public.contacts holds the
-- agency fields. The archetype provider reads v_contacts and writes persons+contacts.
CREATE TABLE IF NOT EXISTS public.contacts (
  person_id       uuid PRIMARY KEY REFERENCES saas_core.persons(id) ON DELETE CASCADE,
  tenant_id       uuid NOT NULL REFERENCES saas_core.tenants(id) ON DELETE CASCADE,
  source          text,
  lifecycle_stage text NOT NULL DEFAULT 'lead',
  company         text,
  owner_id        uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contacts_tenant_idx ON public.contacts(tenant_id);

-- RLS — canonical tenant isolation (matches the locked convention)
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS contacts_select ON public.contacts;
DROP POLICY IF EXISTS contacts_insert ON public.contacts;
DROP POLICY IF EXISTS contacts_update ON public.contacts;
DROP POLICY IF EXISTS contacts_delete ON public.contacts;
CREATE POLICY contacts_select ON public.contacts FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.user_tenant_ids()));
CREATE POLICY contacts_insert ON public.contacts FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()));
CREATE POLICY contacts_update ON public.contacts FOR UPDATE TO authenticated USING (tenant_id IN (SELECT public.user_tenant_ids()));
CREATE POLICY contacts_delete ON public.contacts FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.user_tenant_ids()));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.contacts_set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS contacts_updated_at ON public.contacts;
CREATE TRIGGER contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.contacts_set_updated_at();

-- v_contacts read model (persons ⨝ contacts); security_invoker keeps persons RLS enforced
CREATE OR REPLACE VIEW public.v_contacts AS
SELECT p.id, c.tenant_id, p.name, p.email, p.phone, p.document_number, p.notes,
       p.is_active, p.tags, c.source, c.lifecycle_stage, c.company, c.owner_id,
       c.created_at, c.updated_at
FROM public.contacts c
INNER JOIN saas_core.persons p ON p.id = c.person_id;
ALTER VIEW public.v_contacts SET (security_invoker = true);
GRANT SELECT ON public.v_contacts TO authenticated;
NOTIFY pgrst, 'reload schema';
