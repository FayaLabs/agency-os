import { createDashboardPlugin } from '@fayz-ai/plugin-dashboard'

const m = (value: number, previousValue?: number, trend?: 'up' | 'down' | 'neutral') =>
  async () => ({ value, previousValue, trend })

/**
 * Agency OS dashboard — mock agency KPIs (GoHighLevel-style overview).
 */
export const agencyDashboardPlugin = createDashboardPlugin({
  navIcon: 'LayoutDashboard',
  showHeader: false, // the shell top bar owns the page title
  labels: {
    pageTitle: 'Dashboard',
    pageSubtitle: 'Your account at a glance',
    kpiTitle: 'Key Metrics',
    onboardingTitle: 'Getting Started',
    onboardingSubtitle: 'Set up your account',
    settingsTitle: 'Dashboard',
  },
  currency: { code: 'USD', locale: 'en-US', symbol: '$' },
  metrics: [
    { id: 'new-leads', label: 'New leads (30d)', icon: 'UserPlus', category: 'clients', defaultVisible: true, defaultOrder: 0, format: 'number', compute: m(342, 290, 'up') },
    { id: 'conversations', label: 'Open conversations', icon: 'MessageSquare', category: 'operations', defaultVisible: true, defaultOrder: 1, format: 'number', compute: m(18, 12, 'up') },
    { id: 'appointments', label: 'Appointments (7d)', icon: 'Calendar', category: 'operations', defaultVisible: true, defaultOrder: 2, format: 'number', compute: m(57, 61, 'down') },
    { id: 'pipeline-value', label: 'Pipeline value', icon: 'Target', category: 'revenue', defaultVisible: true, defaultOrder: 3, format: 'currency', compute: m(128400, 110200, 'up') },
    { id: 'revenue', label: 'Revenue (30d)', icon: 'DollarSign', category: 'revenue', defaultVisible: true, defaultOrder: 4, format: 'currency', compute: m(46800, 41200, 'up') },
    { id: 'rating', label: 'Avg. rating', icon: 'Star', category: 'custom', defaultVisible: true, defaultOrder: 5, format: 'number', compute: m(4.8, 4.7, 'up') },
  ],
  onboardingSteps: [
    { id: 'connect-channels', title: 'Connect your channels', description: 'Link WhatsApp, SMS and email', icon: 'MessageSquare', order: 0, action: '/conversations', check: async () => false },
    { id: 'import-contacts', title: 'Import contacts', description: 'Bring your audience into the CRM', icon: 'UserPlus', order: 1, action: '/sales', check: async () => false },
    { id: 'build-funnel', title: 'Build your first funnel', description: 'Capture leads from a landing page', icon: 'LayoutTemplate', order: 2, action: '/sites', check: async () => false },
    { id: 'launch-automation', title: 'Launch an automation', description: 'Automate follow-ups', icon: 'Zap', order: 3, action: '/automations', check: async () => false },
  ],
})
