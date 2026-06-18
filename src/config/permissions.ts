import type { PermissionsConfig } from '@fayz-ai/saas'

const ALL = ['read', 'create', 'edit', 'delete'] as const

/**
 * Agency OS permissions — one feature per left-menu module. Mirrors how a
 * sub-account (location) operator is scoped in GoHighLevel.
 */
export const agencyPermissions: PermissionsConfig = {
  features: [
    { id: 'dashboard', label: 'Dashboard', group: 'Core' },
    { id: 'conversations', label: 'Conversations', group: 'Engage' },
    { id: 'appointments', label: 'Calendars', group: 'Engage' },
    { id: 'contacts', label: 'Contacts', group: 'Sales' },
    { id: 'sales', label: 'CRM & Opportunities', group: 'Sales' },
    { id: 'marketing', label: 'Marketing', group: 'Engage' },
    { id: 'automations', label: 'Automations', group: 'Automate' },
    { id: 'sites', label: 'Sites & Funnels', group: 'Convert' },
    { id: 'reputation', label: 'Reputation', group: 'Retain' },
    { id: 'financial', label: 'Payments', group: 'Finance' },
    { id: 'memberships', label: 'Memberships', group: 'Retain' },
    { id: 'custom_forms', label: 'Forms', group: 'Convert' },
    { id: 'reports', label: 'Reporting', group: 'Analytics' },
  ],
  defaultProfiles: [
    {
      id: 'admin',
      name: 'Admin',
      isSystem: true,
      systemPermissions: ['manage_team', 'manage_billing', 'manage_settings', 'manage_permissions'],
      grants: {
        dashboard: ['read'],
        conversations: [...ALL],
        appointments: [...ALL],
        contacts: [...ALL],
        sales: [...ALL],
        marketing: [...ALL],
        automations: [...ALL],
        sites: [...ALL],
        reputation: [...ALL],
        financial: [...ALL],
        memberships: [...ALL],
        custom_forms: [...ALL],
        reports: ['read'],
      },
    },
    {
      id: 'agent',
      name: 'Agent',
      isSystem: true,
      systemPermissions: [],
      grants: {
        dashboard: ['read'],
        conversations: ['read', 'create', 'edit'],
        appointments: ['read', 'create', 'edit'],
        contacts: ['read', 'create', 'edit'],
        sales: ['read', 'create', 'edit'],
        reputation: ['read'],
      },
    },
  ],
}
