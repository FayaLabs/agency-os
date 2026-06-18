-- ============================================================================
-- Agency OS — Ring 2 (conversations): the GoHighLevel unified inbox backing
-- ============================================================================
-- @fayz-ai/plugin-conversations reads/writes these two tables through
-- createSupabaseConversationsProvider (selected automatically once a Supabase
-- client is registered). Real channel connectors (Twilio / WhatsApp Cloud /
-- Meta / IMAP) deliver inbound rows here out-of-band; the plugin is the
-- read/compose surface. Tenant-scoped + RLS keyed on the shared helper, exactly
-- like the sub-accounts Ring-2 file. Idempotent: re-runnable.

-- ---------------------------------------------------------------------------
-- conversations — one thread per contact+channel
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES saas_core.tenants(id) ON DELETE CASCADE,
  contact_name text NOT NULL,
  contact_handle text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('sms', 'whatsapp', 'instagram', 'email', 'webchat')),
  last_message_preview text NOT NULL DEFAULT '',
  last_message_at timestamptz NOT NULL DEFAULT now(),
  unread_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'snoozed', 'closed')),
  assigned_to text,
  accent text NOT NULL DEFAULT '#6366f1',
  tags text[] NOT NULL DEFAULT '{}',
  location text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS conversations_tenant ON public.conversations(tenant_id);
CREATE INDEX IF NOT EXISTS conversations_tenant_last_msg
  ON public.conversations(tenant_id, last_message_at DESC);

-- ---------------------------------------------------------------------------
-- conversation_messages — the messages inside a thread
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES saas_core.tenants(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('sms', 'whatsapp', 'instagram', 'email', 'webchat')),
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  body text NOT NULL,
  author text NOT NULL DEFAULT '',
  at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS conversation_messages_conversation
  ON public.conversation_messages(conversation_id, at);
CREATE INDEX IF NOT EXISTS conversation_messages_tenant
  ON public.conversation_messages(tenant_id);

-- ---------------------------------------------------------------------------
-- RLS — tenant isolation, keyed on the shared SECURITY DEFINER helper
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['conversations', 'conversation_messages']
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
-- updated_at trigger (conversations only; messages are append-only)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS conversations_updated_at ON public.conversations;
CREATE TRIGGER conversations_updated_at BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
GRANT ALL ON public.conversations, public.conversation_messages TO authenticated, service_role;
