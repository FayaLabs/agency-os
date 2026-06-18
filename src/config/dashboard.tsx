import { createDashboardPlugin } from '@fayz-ai/plugin-dashboard'

const m = (
  value: number,
  previousValue?: number,
  trend?: 'up' | 'down' | 'neutral',
  spark?: number[],
) => async () => ({ value, previousValue, trend, spark })

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
    { id: 'new-leads', label: 'New leads (30d)', icon: 'UserPlus', category: 'clients', defaultVisible: true, defaultOrder: 0, format: 'number', compute: m(342, 290, 'up', [210, 248, 232, 276, 261, 305, 290, 342]) },
    { id: 'conversations', label: 'Open conversations', icon: 'MessageSquare', category: 'operations', defaultVisible: true, defaultOrder: 1, format: 'number', compute: m(18, 12, 'up', [9, 11, 8, 13, 12, 15, 12, 18]) },
    { id: 'appointments', label: 'Appointments (7d)', icon: 'Calendar', category: 'operations', defaultVisible: true, defaultOrder: 2, format: 'number', compute: m(57, 61, 'down', [72, 68, 70, 63, 66, 61, 64, 57]) },
    { id: 'pipeline-value', label: 'Pipeline value', icon: 'Target', category: 'revenue', defaultVisible: true, defaultOrder: 3, format: 'currency', compute: m(128400, 110200, 'up', [88000, 96500, 92000, 104000, 110200, 118000, 121500, 128400]) },
    { id: 'revenue', label: 'Revenue (30d)', icon: 'DollarSign', category: 'revenue', defaultVisible: true, defaultOrder: 4, format: 'currency', compute: m(46800, 41200, 'up', [32000, 35500, 38000, 36500, 41200, 43000, 44800, 46800]) },
    { id: 'rating', label: 'Avg. rating', icon: 'Star', category: 'custom', defaultVisible: true, defaultOrder: 5, format: 'number', goal: 5, compute: m(4.8, 4.7, 'up') },
  ],
  onboardingSteps: [
    { id: 'connect-channels', title: 'Connect your channels', description: 'Link WhatsApp, SMS and email', icon: 'MessageSquare', order: 0, action: '/conversations', check: async () => false },
    { id: 'import-contacts', title: 'Import contacts', description: 'Bring your audience into the CRM', icon: 'UserPlus', order: 1, action: '/sales', check: async () => false },
    { id: 'build-funnel', title: 'Build your first funnel', description: 'Capture leads from a landing page', icon: 'LayoutTemplate', order: 2, action: '/sites', check: async () => false },
    { id: 'launch-automation', title: 'Launch an automation', description: 'Automate follow-ups', icon: 'Zap', order: 3, action: '/automations', check: async () => false },
  ],
})
