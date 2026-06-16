# Agency OS

All-in-one agency platform built with [@fayz-ai/sdk](https://www.npmjs.com/package/@fayz-ai/sdk).

## What it does

One platform to run — and resell — a digital agency:

- **CRM** — Leads, contacts, and pipelines
- **Conversations** — Unified inbox across channels
- **Agenda** — Calendars and scheduling
- **Marketing** — Campaigns and funnels
- **Automations** — Workflow triggers and actions
- **Sites** — Landing pages and websites
- **Forms** — Custom intake and lead-capture forms
- **Courses** — Course delivery and memberships
- **Financial** — Invoicing and payment tracking
- **Reputation** — Reviews and reputation management
- **Reports** — Cross-module analytics and dashboards

## Setup

```bash
yarn install
cp .env.example .env  # add your Supabase credentials
yarn dev              # runs on http://localhost:5190
```

## Stack

- React + TypeScript + Vite
- @fayz-ai/sdk (Fayz SaaS framework + plugins)
- Supabase (auth, database, storage)
- Tailwind CSS
