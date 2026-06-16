import { createReportsPlugin } from '@fayz-ai/plugin-reports'

/**
 * Agency OS reporting — report catalogue (GoHighLevel-style). The backing views
 * are not provisioned in mock mode, so each report is marked `available: false`
 * and renders a graceful "connect data" state. Real views land with the
 * Supabase milestone.
 */
export const agencyReportsPlugin = createReportsPlugin({
  navPosition: 12,
  showHeader: false, // the shell top bar owns the page title
  currency: { code: 'USD', locale: 'en-US', symbol: '$' },
  labels: { pageTitle: 'Reporting', pageSubtitle: 'Performance across every module' },
  reports: [
    {
      id: 'lead-source', name: 'Leads by source', description: 'Where your leads come from', icon: 'UserPlus',
      category: 'Sales', available: false, dataSource: { kind: 'view', name: 'rep_leads_by_source' },
      columns: [
        { key: 'source', label: 'Source', type: 'text' },
        { key: 'leads', label: 'Leads', type: 'number' },
        { key: 'conversion', label: 'Conversion', type: 'number' },
      ],
    },
    {
      id: 'pipeline', name: 'Pipeline by stage', description: 'Open deals across stages', icon: 'Filter',
      category: 'Sales', available: false, dataSource: { kind: 'view', name: 'rep_pipeline_by_stage' },
      columns: [
        { key: 'stage', label: 'Stage', type: 'text' },
        { key: 'deals', label: 'Deals', type: 'number' },
        { key: 'value', label: 'Value', type: 'currency', currency: 'USD' },
      ],
    },
    {
      id: 'campaigns', name: 'Campaign performance', description: 'Opens, clicks & replies', icon: 'Megaphone',
      category: 'Marketing', available: false, dataSource: { kind: 'view', name: 'rep_campaign_performance' },
      columns: [
        { key: 'campaign', label: 'Campaign', type: 'text' },
        { key: 'sent', label: 'Sent', type: 'number' },
        { key: 'openRate', label: 'Open rate', type: 'number' },
      ],
    },
    {
      id: 'appointments', name: 'Appointments by period', description: 'Bookings over time', icon: 'Calendar',
      category: 'Operations', available: false, dataSource: { kind: 'view', name: 'rep_appointments_by_period' },
      columns: [
        { key: 'period', label: 'Period', type: 'text' },
        { key: 'booked', label: 'Booked', type: 'number' },
        { key: 'noShow', label: 'No-show', type: 'number' },
      ],
    },
  ],
})
