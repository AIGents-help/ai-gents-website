# AI Gents Office — Notification and Billing Release

## Billing safety
- AI Gents Stripe account was NOT available through connected Stripe access (only Journey Journal live/test and sandbox).
- No Stripe key, customer, payment, invoice, subscription, webhook, or charge has been created or changed.
- The Billing workspace supports **internal draft-only** invoice preparation; these drafts are NOT sent and cannot be paid from the Office.
- The database's invoice read policy excludes draft records from client access while allowing staff access.
- Project association is validated to belong to the selected client.
- A verified AI Gents Stripe account, restricted secret key, webhook signature verification, idempotent payment ledger, and end-to-end tests are required before enabling payment processing.
- Never infer paid status from client-side UI or a success redirect. Stripe webhooks should reconcile payment state server-side.
- Before enabling any automatic tax calculation, confirm registration and relevant jurisdiction obligations.

## Notifications
- `public.ag_notifications` stores per-user notifications for messages, design decisions, published reviews, published proposals, and shared documents.
- Private triggers create notifications for client project members or AI Gents staff according to event type.
- RLS permits each signed-in user to read or acknowledge only their notifications. Trigger prevents modifying immutable notification content or reverting read state.
- **In-app only.** No outbound notification emails are sent by this release. Add only after the existing email provider, sender domain, credentials, deduplication, preferences, and delivery failures are verified.
- Notifications list is loaded from the existing client/staff Supabase session, without new background infrastructure.

## Operational checklist
1. Confirm Owner can open Billing and Notifications.
2. Add first genuine client/project, then client test user and reviewer. Do not create invented production users.
3. Create an internal invoice draft. Verify it does not show in client account.
4. Publish a proposal and design review, share a document, and post project messages from staff. Verify target client only sees their notifications.
5. Record client decisions and verify staff notification receipt.
6. Mark notification read and confirm it remains acknowledged.
7. Enable leaked-password protection in Supabase Auth settings; Supabase security advisor currently flags this as WARN.
8. Link correct AI Gents Stripe account *before* implementing monetary operations. Never use Journey Journal's Stripe account for AI Gents.
