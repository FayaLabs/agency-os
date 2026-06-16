import React from 'react'
import type { FayzAppConfig } from '@fayz-ai/saas'
import { createAgendaPlugin } from '@fayz-ai/plugin-agenda'
import { createCrmPlugin } from '@fayz-ai/plugin-crm'
import { createFinancialPlugin } from '@fayz-ai/plugin-financial'
import { createCustomFormsPlugin } from '@fayz-ai/plugin-forms'
import { createCoursesPlugin } from '@fayz-ai/plugin-courses'
import { createConversationsPlugin } from '@fayz-ai/plugin-conversations'
import { createMarketingPlugin } from '@fayz-ai/plugin-marketing'
import { createAutomationsPlugin } from '@fayz-ai/plugin-automations'
import { createSitesPlugin } from '@fayz-ai/plugin-sites'
import { createReputationPlugin } from '@fayz-ai/plugin-reputation'

import { Logo } from '../components/Logo'
import { agencyDashboardPlugin } from './dashboard'
import { agencyReportsPlugin } from './reports'
import { agencyPermissions } from './permissions'
import { agencyTheme } from './theme'

const currency = { code: 'USD', locale: 'en-US', symbol: '$' }

/**
 * Agency OS — a GoHighLevel-style all-in-one platform for agencies, composed
 * from Fayz SDK plugins. This is the sub-account ("location") surface: the
 * left-menu operational product. Runs on mock data (no Supabase env = mock).
 */
export const agencyOsAppConfig: FayzAppConfig = {
  name: 'Agency OS',
  logo: React.createElement(Logo),
  layout: 'sidebar',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  locale: { default: 'en', supported: ['en'] },
  auth: {
    adapter: import.meta.env.VITE_SUPABASE_URL ? 'supabase' : 'mock',
    requireAuth: true,
    loginLayout: 'split',
    loginTagline: 'The all-in-one platform for agencies',
    loginDescription:
      'CRM, conversations, calendars, pipelines, marketing, automations, funnels and reputation — one platform you can white-label and resell.',
    showOAuth: true,
    oauthProviders: ['google'],
  },
  org: { adapter: import.meta.env.VITE_SUPABASE_URL ? 'supabase' : 'mock', multiOrg: true },
  permissions: agencyPermissions,
  theme: agencyTheme,
  plugins: [
    // 0 — Dashboard
    agencyDashboardPlugin,
    // 1 — Conversations (unified inbox) — flagship new SDK plugin
    createConversationsPlugin({ navPosition: 1 }),
    // 2 — Calendars (appointments / booking)
    createAgendaPlugin({
      navPosition: 2,
      currency,
      labels: { pageTitle: 'Calendars' },
    }),
    // 3 — CRM (Contacts + Opportunities/Pipeline) — reuses the existing plugin
    createCrmPlugin({
      navPosition: 3,
      currency,
      modules: { pipeline: true, quotes: true, activities: true },
      labels: {
        pageTitle: 'CRM',
        pageSubtitle: 'Contacts, leads, opportunities and pipeline',
      },
    }),
    // 5 — Marketing (acquisition & conversion analytics)
    createMarketingPlugin({
      domain: 'agency',
      navPosition: 5,
      currency: { code: 'USD', locale: 'en-US', symbol: '$' },
      modules: { landingPages: true },
    }),
    // 6 — Automations (workflows)
    createAutomationsPlugin({ navPosition: 6 }),
    // 7 — Sites & Funnels
    createSitesPlugin({ navPosition: 7 }),
    // 8 — Reputation (reviews)
    createReputationPlugin({ navPosition: 8 }),
    // 9 — Payments — trimmed for the agency concept: invoices/payments only,
    // no clinic-style payables / cash registers / commissions / cards / statements.
    createFinancialPlugin({
      navPosition: 9,
      currency,
      modules: {
        receivables: true,
        payables: false,
        cashRegisters: false,
        statements: false,
        commissions: false,
        cards: false,
      },
      labels: {
        pageTitle: 'Payments',
        pageSubtitle: 'Invoices and payments',
        receivables: 'Invoices',
      },
    }),
    // 10 — Memberships (courses)
    createCoursesPlugin({ navPosition: 10, navLabel: 'Memberships' }),
    // 11 — Forms & Surveys
    createCustomFormsPlugin({
      navSection: 'main',
      labels: { pageTitle: 'Forms' },
    }),
    // 12 — Reporting
    agencyReportsPlugin,
  ],
  chat: {
    title: 'Agency Assistant',
    systemPrompt:
      'You are the Agency OS assistant. Help operators run conversations, CRM, calendars, marketing, automations, sites and reputation for their client sub-accounts.',
  },
}
