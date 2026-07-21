import type { FayzAppConfig } from '@fayz-ai/saas'

// ---------------------------------------------------------------------------
// Agency OS billing — subscription surface (/settings/subscription). Plans are
// seeded into the shell by the SDK; changing plan writes tenants.plan via
// adapter.updateOrg (mock persists to localStorage). Wire Stripe/Pix into the
// `onCheckout` seam when billing goes live.
// ---------------------------------------------------------------------------

export const agencyBilling: NonNullable<FayzAppConfig['billing']> = {
  plans: [
    {
      id: 'free',
      name: 'Free',
      currency: 'USD',
      priceMonthly: 0,
      description: 'For freelancers getting started',
      features: [
        '1 client workspace',
        'Up to 200 contacts',
        'Projects & tasks',
        'Basic CRM (up to 50 deals)',
        'Up to 2 seats',
      ],
      // Freemium base + contacts (clients) cap 200 and deals cap 50. Premium
      // (Pro+): marketing, reports, automations, sites and reputation.
      entitlements: {
        features: { marketing: false, reports: false, automations: false, sites: false, reputation: false },
        limits: { users: 2, locations: 1, clients: 200, bookings_month: 150, deals: 50 },
      },
    },
    {
      id: 'pro',
      name: 'Pro',
      currency: 'USD',
      priceMonthly: 49,
      popular: true,
      description: 'For growing agencies',
      features: [
        'Unlimited client workspaces',
        'Projects & tasks',
        'Full CRM & pipelines',
        'Invoicing & payments',
        'Marketing & automations',
        'Up to 15 seats',
      ],
      entitlements: {
        features: { marketing: true, reports: true, automations: true, sites: true, reputation: true },
        limits: { users: 15, locations: -1, clients: -1, bookings_month: -1, deals: -1 },
      },
    },
    {
      id: 'agency',
      name: 'Agency',
      currency: 'USD',
      priceMonthly: 99,
      description: 'For multi-brand agencies & networks',
      features: [
        'Unlimited client workspaces',
        'Projects & tasks',
        'Full CRM & pipelines',
        'Invoicing & payments',
        'Marketing & automations',
        'White-label & custom domains',
        'Advanced roles & permissions',
        'Unlimited seats',
      ],
      entitlements: {
        features: { marketing: true, reports: true, automations: true, sites: true, reputation: true },
        limits: { users: -1, locations: -1, clients: -1, bookings_month: -1, deals: -1 },
      },
    },
  ],
}
