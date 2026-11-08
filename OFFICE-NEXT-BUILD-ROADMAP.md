# Client interaction queue / build roadmap

## Delivered in this increment
- The Office Overview now includes a staff/team-only **Client interaction queue**.
- Latest external/other participant messages: shown as **potential replies**, not claimed unread or outstanding.
- Current open tasks with due dates: displayed, sorted by date.
- Project delegation coverage: owner/staff can see active projects with no active employee/contractor assignment, with owner-only route to Team & Access.
- Uses existing client, project, message, task, team membership and assignment records. No new database, service, account, or paid subscription.
- Links open the existing project conversation, task list or Team & Access workspace.
- No client information is exposed in the public website.

## Known limitations before scale
- No per-message read receipts, response SLA, owner reassignment history, or resolved-follow-up status yet.
- A message from someone else may already have been handled by a phone call; the queue does not guess.
- Employee/contractor invitation workflow, actual cross-client access, and real client browser E2E tests still pending.
- Supabase Auth leaked-password protection warning remains.
- Outbound notification delivery is not verified. In-app assignment alerts exist.
- Stripe test secrets / webhook registration and test payment E2E remain unfinished.
- GitHub private repos and Vercel technical source status require read-only provider tokens.
- Document/approval workflow, invoice processing and audit-log export need client-to-completion testing.

## Recommended completion order
1. Real multi-role browser QA with owner + staff/contractor + client users, including invitation, activation, revocation and no cross-client leakage.
2. Add explicit request owner, due date, read receipt and resolved state (with timestamped audit history) instead of inferred follow-up.
3. Add secure notification/digest delivery and escalations, opt-in/preferences and transactional email sender validation.
4. Client lifecycle: intake → scoped proposal → sign-off → project onboarding → milestones → final delivery → invoice.
5. Activate and fully test AI Gents-specific Stripe sandbox; later controlled live release.
6. Read-only project connections with existing GitHub/Vercel permissions, technical progress vs human-reviewed requirements.
7. Owner scorecard: workload, stalled conversations, pipeline, budget, finance, subscriptions and renewal alerts.

## Testing
- JS syntax validated for Office and queue module.
- Client/owner role security is still enforced by existing database RLS, not JS.
- No fake clients, messages, assignments, or invoices were created for UI illustration.
