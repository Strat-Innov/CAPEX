# FAI CAPEX Tracker

Internal tool for Filinvest Alabang Inc. Strategy & Innovation Group — tracks CAPEX budget requests through a
PD Staff → PD Manager → Finance Manager approval chain.

## Stack

React 18 + Vite + TypeScript + Tailwind CSS + Supabase (Postgres + Auth + Row Level Security) + Recharts.

## Environment variables

Copy `.env.local.example` to `.env.local` for local dev, or set these in Vercel → Environment Variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Role model

- **PD Staff** — can create entries. Cannot edit after submitting (enforced by database row-level security, not just the UI).
- **PD Manager** — sees all entries, can edit + approve/reject entries in `pending_pd_manager` status.
- **Finance Manager** — sees all entries, can approve/reject entries in `pending_finance_manager` status (final approval).

New sign-ups default to `pd_staff`. Elevate roles manually via SQL in Supabase — see the bottom of the schema file.

## Phase 1 scope

- Notifications (Teams/Outlook) are mocked — logged to the `notifications` table, not actually delivered.
  Real delivery requires a Microsoft Graph API integration and Azure AD app registration (future phase).
- Dashboard shows submitted/approved budget figures only. It does not yet include actual disbursement data
  (Availment), since that requires a separate accounting-system integration not built yet.
