-- ===========================================================================
-- Agency OS — QA TENANT provisioning (idempotent / re-runnable)
-- ---------------------------------------------------------------------------
-- Substituir :QA_PASSWORD antes de aplicar (via envsubst/sed/perl); nunca
-- commitar senha real. O placeholder aparece como ':QA_PASSWORD' (já entre
-- aspas SQL) — o script apply-qa-tenants.sh troca o token pela senha do env.
-- ---------------------------------------------------------------------------
-- Provisiona um QA Tenant completo no pool cluster-agency-br-01 (public schema,
-- core-v1) para os testes e2e de QA:
--   * tenant   slug 'qa-fayz'  (QA Fayz Agency OS, vertical agency, plan pro)
--   * owner    qa+agency@fayalabs.com            (membership role 'owner')
--   * restrito qa-restrito+agency@fayalabs.com   (membership role 'agent')
--   * catálogo RBAC global — perfis do src/config/permissions.ts:
--     admin / agent (owner de membership é implicit-all no SDK).
--   * seed mínimo de domínio: 2 "profissionais" + 2 "clientes" (todos people
--     kind='contact' — a agência tem um único diretório de pessoas), horários
--     de trabalho seg-sáb 09-18, 1 compromisso futuro. SEM serviços (o vertical
--     agency não tem catálogo de serviços — linhas de fatura são livres).
-- Actions vocabulary: read / create / edit / delete.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Block A — tenant + GoTrue users (owner + restricted) + memberships
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_tenant  uuid;
  v_admin   uuid;
  v_restr   uuid;
BEGIN
  INSERT INTO public.tenants (id, name, slug, plan, vertical_id, settings)
  VALUES ('a0000000-0000-4000-8000-000000000003', 'QA Fayz Agency OS', 'qa-fayz',
          'pro', 'agency', '{"timezone":"America/Sao_Paulo"}'::jsonb)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_tenant;
  IF v_tenant IS NULL THEN
    SELECT id INTO v_tenant FROM public.tenants WHERE slug = 'qa-fayz';
  END IF;

  -- Owner user
  SELECT id INTO v_admin FROM auth.users WHERE email = 'qa+agency@fayalabs.com';
  IF v_admin IS NULL THEN
    v_admin := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_admin, 'authenticated', 'authenticated',
      'qa+agency@fayalabs.com', crypt(':QA_PASSWORD', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"QA Owner (Agency OS)"}'::jsonb, now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_admin::text, v_admin,
      jsonb_build_object('sub', v_admin::text, 'email', 'qa+agency@fayalabs.com', 'email_verified', true),
      'email', now(), now(), now());
  ELSE
    UPDATE auth.users SET encrypted_password = crypt(':QA_PASSWORD', gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()) WHERE id = v_admin;
  END IF;

  -- Restricted user — role 'agent'
  SELECT id INTO v_restr FROM auth.users WHERE email = 'qa-restrito+agency@fayalabs.com';
  IF v_restr IS NULL THEN
    v_restr := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_restr, 'authenticated', 'authenticated',
      'qa-restrito+agency@fayalabs.com', crypt(':QA_PASSWORD', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"QA Agent (Agency OS)"}'::jsonb, now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_restr::text, v_restr,
      jsonb_build_object('sub', v_restr::text, 'email', 'qa-restrito+agency@fayalabs.com', 'email_verified', true),
      'email', now(), now(), now());
  ELSE
    UPDATE auth.users SET encrypted_password = crypt(':QA_PASSWORD', gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()) WHERE id = v_restr;
  END IF;

  INSERT INTO public.tenant_members (tenant_id, user_id, role)
  VALUES (v_tenant, v_admin, 'owner')
  ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = EXCLUDED.role;
  INSERT INTO public.tenant_members (tenant_id, user_id, role)
  VALUES (v_tenant, v_restr, 'agent')
  ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = EXCLUDED.role;
END $$;

-- ---------------------------------------------------------------------------
-- Block B — RBAC catalog + default role grants (global; guarded)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.permissions') IS NULL OR to_regclass('public.role_permissions') IS NULL THEN
    RAISE NOTICE 'QA: public.permissions/role_permissions ausente — pulando catálogo RBAC';
    RETURN;
  END IF;

  INSERT INTO public.permissions (id, category, description)
  SELECT c.category || '.' || a.action, c.category, c.label || ' — ' || a.action
  FROM (VALUES
    ('dashboard',     'Dashboard'),
    ('conversations', 'Conversations'),
    ('appointments',  'Calendars'),
    ('contacts',      'Contacts'),
    ('sales',         'CRM & Opportunities'),
    ('marketing',     'Marketing'),
    ('automations',   'Automations'),
    ('sites',         'Sites & Funnels'),
    ('reputation',    'Reputation'),
    ('financial',     'Payments'),
    ('memberships',   'Memberships'),
    ('custom_forms',  'Forms'),
    ('reports',       'Reporting')
  ) AS c(category, label)
  CROSS JOIN (VALUES ('read'), ('create'), ('edit'), ('delete')) AS a(action)
  ON CONFLICT (id) DO UPDATE SET category = EXCLUDED.category, description = EXCLUDED.description;

  INSERT INTO public.role_permissions (role, permission_id, actions)
  SELECT g.role, g.cat || '.' || act, ARRAY[act]
  FROM (VALUES
    -- admin
    ('admin','dashboard','{read}'::text[]),
    ('admin','conversations','{read,create,edit,delete}'::text[]),
    ('admin','appointments','{read,create,edit,delete}'::text[]),
    ('admin','contacts','{read,create,edit,delete}'::text[]),
    ('admin','sales','{read,create,edit,delete}'::text[]),
    ('admin','marketing','{read,create,edit,delete}'::text[]),
    ('admin','automations','{read,create,edit,delete}'::text[]),
    ('admin','sites','{read,create,edit,delete}'::text[]),
    ('admin','reputation','{read,create,edit,delete}'::text[]),
    ('admin','financial','{read,create,edit,delete}'::text[]),
    ('admin','memberships','{read,create,edit,delete}'::text[]),
    ('admin','custom_forms','{read,create,edit,delete}'::text[]),
    ('admin','reports','{read}'::text[]),
    -- agent (usuário restrito de QA)
    ('agent','dashboard','{read}'::text[]),
    ('agent','conversations','{read,create,edit}'::text[]),
    ('agent','appointments','{read,create,edit}'::text[]),
    ('agent','contacts','{read,create,edit}'::text[]),
    ('agent','sales','{read,create,edit}'::text[]),
    ('agent','reputation','{read}'::text[])
  ) AS g(role, cat, acts)
  CROSS JOIN LATERAL unnest(g.acts) AS act
  ON CONFLICT (role, permission_id) DO UPDATE SET actions = EXCLUDED.actions;
END $$;

-- ---------------------------------------------------------------------------
-- Block C — domain seed no QA tenant (guarded). SEM serviços (agency vertical).
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_tenant uuid;
  v_prof1  uuid;
  v_prof2  uuid;
  v_cli1   uuid;
  v_appt_start timestamptz := date_trunc('day', now()) + interval '2 days' + interval '10 hours';
BEGIN
  SELECT id INTO v_tenant FROM public.tenants WHERE slug = 'qa-fayz';
  IF v_tenant IS NULL THEN RAISE NOTICE 'QA: tenant qa-fayz ausente — pulando seed'; RETURN; END IF;
  IF to_regclass('public.people') IS NULL THEN
    RAISE NOTICE 'QA: archetype public.people ausente — pulando seed de domínio'; RETURN;
  END IF;

  -- "Profissionais" (assignees) — people kind='contact'
  INSERT INTO public.people (tenant_id, kind, name, email, is_active)
  SELECT v_tenant, 'contact', d.name, d.email, true
  FROM (VALUES
    ('QA Agente Marina', 'qa.marina@fayalabs.com'),
    ('QA Agente Carlos', 'qa.carlos@fayalabs.com')
  ) AS d(name, email)
  WHERE NOT EXISTS (SELECT 1 FROM public.people p
    WHERE p.tenant_id = v_tenant AND p.kind = 'contact' AND lower(p.name) = lower(d.name));

  -- "Clientes" (parties) — people kind='contact'
  INSERT INTO public.people (tenant_id, kind, name, email, is_active)
  SELECT v_tenant, 'contact', c.name, c.email, true
  FROM (VALUES
    ('QA Cliente Um',   'qa.cliente1@fayalabs.com'),
    ('QA Cliente Dois', 'qa.cliente2@fayalabs.com')
  ) AS c(name, email)
  WHERE NOT EXISTS (SELECT 1 FROM public.people p
    WHERE p.tenant_id = v_tenant AND p.kind = 'contact' AND lower(p.name) = lower(c.name));

  SELECT id INTO v_prof1 FROM public.people WHERE tenant_id = v_tenant AND kind='contact' AND name='QA Agente Marina';
  SELECT id INTO v_prof2 FROM public.people WHERE tenant_id = v_tenant AND kind='contact' AND name='QA Agente Carlos';
  SELECT id INTO v_cli1  FROM public.people WHERE tenant_id = v_tenant AND kind='contact' AND name='QA Cliente Um';

  -- (sem serviços — agency vertical não tem catálogo de serviços)

  IF to_regclass('public.schedules') IS NOT NULL THEN
    INSERT INTO public.schedules (tenant_id, kind, assignee_id, day_of_week, starts_at, ends_at, is_active)
    SELECT v_tenant, 'working_hours', pr.id, dow, time '09:00', time '18:00', true
    FROM (VALUES (v_prof1), (v_prof2)) AS pr(id)
    CROSS JOIN generate_series(1, 6) AS dow
    WHERE pr.id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.schedules x
        WHERE x.tenant_id = v_tenant AND x.assignee_id = pr.id
          AND x.kind = 'working_hours' AND x.day_of_week = dow);
  END IF;

  IF to_regclass('public.appointments') IS NOT NULL AND v_cli1 IS NOT NULL AND v_prof1 IS NOT NULL THEN
    INSERT INTO public.appointments (tenant_id, kind, party_id, assignee_id, starts_at, ends_at, status, notes)
    SELECT v_tenant, 'appointment', v_cli1, v_prof1, v_appt_start, v_appt_start + interval '30 minutes',
           'scheduled', 'QA e2e appointment'
    WHERE NOT EXISTS (SELECT 1 FROM public.appointments x
      WHERE x.tenant_id = v_tenant AND x.notes = 'QA e2e appointment');
  END IF;
END $$;

-- ===========================================================================
-- Verificação (rode manualmente após aplicar):
--   SELECT id, name, slug, plan, vertical_id, settings FROM public.tenants WHERE slug='qa-fayz';
--   SELECT email FROM auth.users WHERE email IN ('qa+agency@fayalabs.com','qa-restrito+agency@fayalabs.com');
--   SELECT m.role, u.email FROM public.tenant_members m JOIN auth.users u ON u.id=m.user_id
--     WHERE m.tenant_id=(SELECT id FROM public.tenants WHERE slug='qa-fayz');
--   SELECT role, count(*) FROM public.role_permissions WHERE role IN ('admin','agent') GROUP BY role;
--   SELECT kind, count(*) FROM public.people WHERE tenant_id=(SELECT id FROM public.tenants WHERE slug='qa-fayz') GROUP BY kind;
--   SELECT count(*) schedules FROM public.schedules    WHERE tenant_id=(SELECT id FROM public.tenants WHERE slug='qa-fayz');
--   SELECT count(*) appts     FROM public.appointments WHERE tenant_id=(SELECT id FROM public.tenants WHERE slug='qa-fayz');
-- ===========================================================================
