import type { EntityDef } from '@fayz-ai/core'

export interface AgencyContact {
  id: string
  name: string
  email: string
  phone: string
  company: string
  lifecycleStage: string
  source: string
}

// ---------------------------------------------------------------------------
// Contacts — the agency's central people directory (GHL-style).
// person archetype (kind=contact) + Ring-2 extension public.contacts.
// The archetype provider reads v_contacts and writes persons + contacts.
// ---------------------------------------------------------------------------
export const contactEntity: EntityDef<AgencyContact> = {
  name: 'Contact',
  namePlural: 'Contacts',
  icon: 'Contact',
  layout: 'person',
  displayField: 'name',
  subtitleField: 'email',
  defaultSort: 'name',
  fields: [
    { key: 'name', label: 'Name', type: 'text', required: true, searchable: true, showInTable: true },
    { key: 'email', label: 'Email', type: 'email', searchable: true, showInTable: true },
    { key: 'phone', label: 'Phone', type: 'phone', showInTable: true },
    { key: 'company', label: 'Company', type: 'text', showInTable: true },
    {
      key: 'lifecycleStage', label: 'Stage', type: 'select',
      options: ['lead', 'prospect', 'customer', 'churned'], defaultValue: 'lead', showInTable: true,
    },
    { key: 'source', label: 'Source', type: 'text', placeholder: 'How did they find us?', showInTable: false },
    { key: 'notes', label: 'Notes', type: 'textarea', showInTable: false },
    { key: 'isActive', label: 'Active', type: 'boolean', defaultValue: true, inlineToggle: true, showInTable: true },
  ],
  data: {
    table: 'contacts',
    tenantScoped: true,
    archetype: 'person',
    archetypeKind: 'contact',
    searchColumns: ['name', 'email', 'phone'],
  },
}
