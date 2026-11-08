# AI Gents — Internal Standard Component Pricing & Estimate Builder

## Purpose
A cost model for quoting work in **The Office → Projects → Project components & scope**.
Standard components have editable starting implementation fees, plus optional AI Gents monthly retainer and optional estimated third-party monthly cost.

## Pricing categories
- **Setup fee:** one-time AI Gents delivery price per component, denominated in USD.
- **AI Gents monthly:** optional ongoing AI Gents support/management charge; default zero unless service has explicit ongoing maintenance.
- **External monthly:** client/provider subscription estimate, separate from AI Gents revenue; blank means *not yet estimated*. Enter zero explicitly only when verified no external charge applies.
- **Quantity:** 1 by default; multiplies all fee categories for that component.
- **Draft quote:** sums selected components only; separate one-time, monthly AI Gents and known third-party recurring amounts, plus first-year AI Gents total. One-click Copy builds a text-only **internal draft estimate**. No proposals, invoices, checkout, emails or charges are generated.

## Internal starting figures
Examples from `js/office-component-pricing.js`:
| Component | One-time USD | AI Gents/month |
|---|---:|---:|
| Public business website | 4,500 | 0 |
| Admin dashboard | 5,500 | 0 |
| CRM & contact management | 6,500 | 0 |
| Customer/member portal | 6,500 | 0 |
| User login & profiles | 2,200 | 0 |
| Stripe integration | 1,200 | 0 |
| Supabase integration | 1,800 | 0 |
| GitHub setup | 450 | 0 |
| Vercel deployment | 500 | 0 |
| Resend transactional email setup | 650 | 0 |
| Kit campaign setup | 800 | 0 |
| Smartlead campaign setup | 1,100 | 0 |
| Monitoring / uptime | 550 | 150 |
| Ongoing newsletter service | 900 | 200 |

Other catalog prices are included in the source map. These are **AI Gents starting estimates**, not a single industry standard, independently certified rates, or guaranteed market prices. Complex enterprise/regulated implementations require bespoke discovery, implementation sizing, and a separate formal quote.

## Market context / sources (consulted November 8, 2026)
- Clutch web design agency pricing: most projects under $10k, U.S. web design agency rates commonly $100–149/hr: https://clutch.co/web-designers/pricing
- Clutch general development range and project variability: https://clutch.co/web-developers/pricing
- Custom CRM development can run from several thousand for a small MVP to tens of thousands for full custom business integrations: https://www.augerelabs.com/blog/how-much-does-custom-crm-development-cost-in-2026-real-pricing-breakdown
- Upwork Smartlead experts' setup/project ranges: https://www.upwork.com/hire/smartlead-experts/
- Specific vendor subscription prices are dynamic; use official Stripe, Supabase, Vercel, Kit, Resend and Smartlead product pages *per quote*. Do **not** fold vendor plans into AI Gents implementation prices.

## Editing and permissions
- Selecting a standard component snapshots its suggested fee in `ag_component_pricing`.
- Staff can edit per-project, per-component fees and quantity via Save fees.
- Custom components start with $0 until intentionally priced; they are not silently priced from unrelated standard components.
- Price records are in a **separate staff-only table** `ag_component_pricing`, not the project scope table that assigned contractors can read. Database RLS restricts financial data to privileged `ag_staff` members.
- An employee or contractor with project Write access may change delivery status but cannot see or change internal pricing.
- All component selections and fees are estimates and draft-only; approving/sending a client quote remains a distinct step.

## Commercial controls
- Check for overlap (e.g., Website + Responsive design, Stripe + Checkout, Supabase + Login) before quoting: do not automatically double-charge shared implementation work.
- Quote needs tax treatment, statement of work, deliverables, assumptions, revisions, payment schedule, support limits, third-party pass-through terms, and optional discounts before sending.
- Do not add accounts, buy software, provision infrastructure, or create subscriptions from a selected checkbox.
- Prices do not update existing project estimates when catalog defaults change.
