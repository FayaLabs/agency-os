import { createDashboardPlugin } from '@fayz-ai/plugin-dashboard'
import type { FayzTableFilter } from '@fayz-ai/saas'
import { countRows, listRows } from '../lib/dashboard-data'

// ---------------------------------------------------------------------------
// Local date windows (browser-local, not UTC) used by the metric queries.
// ---------------------------------------------------------------------------
function getLocalMonthRange(offsetMonths = 0) {
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth() + offsetMonths, 1)
  const end = new Date(today.getFullYear(), today.getMonth() + offsetMonths + 1, 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

// Rolling window of N days ending now (used for "last 30 days" style KPIs).
function getRollingRange(days: number, offsetWindows = 0) {
  const now = new Date()
  const end = new Date(now.getTime() + offsetWindows * days * 86_400_000)
  const start = new Date(end.getTime() - days * 86_400_000)
  return { start: start.toISOString(), end: end.toISOString() }
}

// Current ISO week (Mon 00:00 → next Mon 00:00), browser-local.
function getCurrentWeekRange() {
  const now = new Date()
  const day = (now.getDay() + 6) % 7 // 0 = Monday
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day)
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7)
  return { start: start.toISOString(), end: end.toISOString() }
}

function safeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0
}

function trendOf(value: number, previousValue: number): 'up' | 'down' | 'neutral' {
  if (value > previousValue) return 'up'
  if (value < previousValue) return 'down'
  return 'neutral'
}

// ---------------------------------------------------------------------------
// Metric queries against the live pool (RLS-scoped). All resolve to 0 / [] in
// mock mode (no Supabase client) so the dashboard renders cleanly either way.
// ---------------------------------------------------------------------------

// Active contacts — the agency's people directory, person(kind='contact').
async function countActiveContacts(): Promise<number> {
  const count = await countRows({
    table: 'people',
    filters: [
      { column: 'kind', operator: 'eq', value: 'contact' },
      { column: 'is_active', operator: 'eq', value: true },
    ],
  })
  return safeNumber(count)
}

// New leads in a rolling window — person(kind='lead') created in [start,end).
async function countNewLeads(offsetWindows = 0): Promise<number> {
  const { start, end } = getRollingRange(30, offsetWindows)
  const count = await countRows({
    table: 'people',
    filters: [
      { column: 'kind', operator: 'eq', value: 'lead' },
      { column: 'created_at', operator: 'gte', value: start },
      { column: 'created_at', operator: 'lt', value: end },
    ],
  })
  return safeNumber(count)
}

// Open deals — orders(kind='deal', status='open'). Count + summed pipeline value.
async function loadOpenDeals(): Promise<{ count: number; value: number }> {
  const { rows } = await listRows<{ total?: number | string }>({
    table: 'orders',
    filters: [
      { column: 'kind', operator: 'eq', value: 'deal' },
      { column: 'status', operator: 'eq', value: 'open' },
    ],
    limit: 1000,
  })
  const value = rows.reduce((sum, r) => sum + safeNumber(Number(r.total ?? 0)), 0)
  return { count: rows.length, value }
}

// Pending invoices — receivable movements (direction='credit') still due.
async function countPendingInvoices(): Promise<number> {
  const count = await countRows({
    table: 'plg_financial_movements',
    filters: [
      { column: 'direction', operator: 'eq', value: 'credit' },
      { column: 'status', operator: 'eq', value: 'pending' },
    ],
  })
  return safeNumber(count)
}

// Meetings booked this week — appointments starting in the current ISO week,
// excluding cancelled / no-show.
async function countMeetingsThisWeek(): Promise<number> {
  const { start, end } = getCurrentWeekRange()
  const count = await countRows({
    table: 'appointments',
    filters: [
      { column: 'starts_at', operator: 'gte', value: start },
      { column: 'starts_at', operator: 'lt', value: end },
      { column: 'status', operator: 'neq', value: 'cancelled' },
      { column: 'status', operator: 'neq', value: 'no_show' },
    ],
  })
  return safeNumber(count)
}

// Revenue in a month window — paid receivable movements (direction='credit',
// status='paid') whose payment_date falls in the month.
async function revenueForMonth(offsetMonths = 0): Promise<number> {
  const { start, end } = getLocalMonthRange(offsetMonths)
  const { rows } = await listRows<{ amount?: number | string }>({
    table: 'plg_financial_movements',
    filters: [
      { column: 'direction', operator: 'eq', value: 'credit' },
      { column: 'status', operator: 'eq', value: 'paid' },
      { column: 'payment_date', operator: 'gte', value: start },
      { column: 'payment_date', operator: 'lt', value: end },
    ],
    limit: 1000,
  })
  return rows.reduce((sum, r) => sum + safeNumber(Number(r.amount ?? 0)), 0)
}

async function tableHasRows(
  table: string,
  options: { schema?: string; filters?: FayzTableFilter[] } = {},
): Promise<boolean> {
  try {
    const count = await countRows({ table, schema: options.schema, filters: options.filters })
    return safeNumber(count) > 0
  } catch {
    return false
  }
}

/**
 * Agency OS dashboard — real KPIs computed against the pool (GoHighLevel-style
 * overview). Every metric degrades to 0 in mock mode.
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
    {
      id: 'new-leads',
      label: 'New leads (30d)',
      description: 'Leads captured in the last 30 days vs. the prior 30.',
      icon: 'UserPlus',
      category: 'clients',
      defaultVisible: true,
      defaultOrder: 0,
      format: 'number',
      compute: async () => {
        const [value, previousValue] = await Promise.all([countNewLeads(0), countNewLeads(-1)])
        return { value, previousValue, trend: trendOf(value, previousValue) }
      },
    },
    {
      id: 'active-contacts',
      label: 'Active contacts',
      description: 'Total active people in your contacts directory.',
      icon: 'Users',
      category: 'clients',
      defaultVisible: true,
      defaultOrder: 1,
      format: 'number',
      compute: async () => ({ value: await countActiveContacts(), trend: 'neutral' as const }),
    },
    {
      id: 'meetings-week',
      label: 'Meetings (this week)',
      description: 'Bookings scheduled this week, excluding cancelled / no-show.',
      icon: 'Calendar',
      category: 'operations',
      defaultVisible: true,
      defaultOrder: 2,
      format: 'number',
      compute: async () => ({ value: await countMeetingsThisWeek(), trend: 'neutral' as const }),
    },
    {
      id: 'open-deals',
      label: 'Open deals',
      description: 'Deals currently open across your pipelines.',
      icon: 'Target',
      category: 'revenue',
      defaultVisible: true,
      defaultOrder: 3,
      format: 'number',
      compute: async () => ({ value: (await loadOpenDeals()).count, trend: 'neutral' as const }),
    },
    {
      id: 'pipeline-value',
      label: 'Pipeline value',
      description: 'Total value of all open deals.',
      icon: 'TrendingUp',
      category: 'revenue',
      defaultVisible: true,
      defaultOrder: 4,
      format: 'currency',
      compute: async () => ({ value: (await loadOpenDeals()).value, trend: 'neutral' as const }),
    },
    {
      id: 'pending-invoices',
      label: 'Pending invoices',
      description: 'Receivable invoices still awaiting payment.',
      icon: 'FileClock',
      category: 'revenue',
      defaultVisible: true,
      defaultOrder: 5,
      format: 'number',
      compute: async () => ({ value: await countPendingInvoices(), trend: 'neutral' as const }),
    },
    {
      id: 'revenue',
      label: 'Revenue (this month)',
      description: 'Payments received this month vs. last month.',
      icon: 'DollarSign',
      category: 'revenue',
      defaultVisible: false,
      defaultOrder: 6,
      format: 'currency',
      compute: async () => {
        const [value, previousValue] = await Promise.all([revenueForMonth(0), revenueForMonth(-1)])
        return { value, previousValue, trend: trendOf(value, previousValue) }
      },
    },
  ],
  onboardingSteps: [
    {
      id: 'import-contacts',
      title: 'Import your contacts',
      description: 'Bring your audience into the directory',
      icon: 'UserPlus',
      order: 0,
      check: () => tableHasRows('people', { filters: [{ column: 'kind', operator: 'eq', value: 'contact' }] }),
      action: '/contacts',
    },
    {
      id: 'first-deal',
      title: 'Open your first deal',
      description: 'Start tracking opportunities in the pipeline',
      icon: 'Target',
      order: 1,
      check: () => tableHasRows('orders', { filters: [{ column: 'kind', operator: 'eq', value: 'deal' }] }),
      action: '/sales',
    },
    {
      id: 'book-meeting',
      title: 'Book your first meeting',
      description: 'Schedule a meeting with a contact on the calendar',
      icon: 'Calendar',
      order: 2,
      check: () => tableHasRows('appointments'),
      action: '/agenda',
    },
    {
      id: 'send-invoice',
      title: 'Send your first invoice',
      description: 'Bill a client from Payments',
      icon: 'FileText',
      order: 3,
      check: () => tableHasRows('plg_financial_movements', { filters: [{ column: 'direction', operator: 'eq', value: 'credit' }] }),
      action: '/financial',
    },
  ],
})
