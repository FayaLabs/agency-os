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
        'Projects & tasks',
        'Basic CRM',
        '1 seat',
      ],
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
    },
  ],
}
