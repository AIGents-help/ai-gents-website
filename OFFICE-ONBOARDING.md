# AI Gents The Office — onboarding and operational gates

## Current status
- Live domain: https://aigents.help/office
- Database: existing AI Gents Supabase project `apcvfezfmegqqjuonrgl`
- No new Supabase project or Vercel project created.
- Private design bucket: `ag-design-previews` (15 MiB; PNG/JPEG/WebP/PDF).
- The Design Studio stores immutable approval decisions, visual comments, and version-specific samples.
- Explicitly linked approval milestones are completed by the verified database decision trigger. No link means no automatic milestone change.

## First administrator — required setup
The AI Gents Supabase Auth tenant has zero users as of 2026-11-08. Avoid unauthenticated owner bootstraps or hard-coded passwords.
1. In Supabase Dashboard → project **AI Gents** → Authentication → Users, invite the verified owner email using Supabase's administrative invitation interface.
2. Complete the invite and verify the account can sign in.
3. Obtain the user's UUID from Auth Users in that exact project.
4. In a privileged dashboard SQL editor, insert into `public.ag_staff (user_id,role)` with that UUID and role `owner`.
5. Sign out/in to refresh authorization; visit https://aigents.help/office.
6. Disable open/public registration if not needed, configure SMTP invitation delivery, and require MFA for staff before accepting sensitive client work.

No account is pre-created; do not paste any passwords, tokens, or service-role keys into chat or client-side code.

## Client review workflow
1. Staff creates a client and project.
2. Invite client users using trusted Auth administrative workflow; add `ag_client_users` membership.
3. Assign named approvers using Design Studio's Authorized Approvers control.
4. Create a design review, optionally choosing an approval-specific milestone from the *same* project.
5. Add a version as draft; upload a sample (PNG/JPEG/WebP/PDF) privately or add HTTPS preview URL.
6. Publish the version and review when ready. Clients see only published items.
7. Client reviewers may add notes. Designated approvers can approve or request changes.
8. Approvals are append-only. An approved version completes the explicitly linked milestone only.

## Known release limitations
- Browser E2E tests for authentication, upload/download, cross-client separation, and decisions require seeded test users; none exist yet.
- File upload currently has no progress bar; previews use short-lived signed URLs.
- Position-based annotations work on images, not PDFs. Precise positioning on letterboxed / differently sized images needs visual QA.
- A URL preview is hosted externally; use private bucket for confidential samples.
- Existing Stripe synchronization, invoice sending, and client onboarding remain separate pending features.
- There is no automatic status email from Design Studio yet.

## Verification
- Check Supabase security advisor after migration.
- Test staff, assigned client reviewer, assigned client approver, unrelated client, and anonymous user.
- Test impossible URL/path traversal, oversize file, unauthorized file, wrong project milestone, non-approver approval, and revision history immutability.

## New: email-driven client access
- Under The Office → Clients, a permitted staff user creates a client organization and selects **Add client access**.
- The client invitation is stored by normalized email in `ag_client_invitations`.
- A JWT-verified, role-checked Supabase Edge Function `ag-invite-client` sends an Auth invitation through Supabase. Its service key stays inside Supabase's secret environment.
- After Supabase verifies the email, a database Auth trigger connects the user to the invitation's specific organization in `ag_client_users`. Already-verified Auth users are linked at invitation creation.
- Revoke access through the Office interface. A restricted, invoker-rights RPC deletes membership, removes approval authority through the foreign key, and records a private audit entry. Unrestricted database table mutations remain unavailable to clients.
- Email delivery depends on the project's configured Supabase Auth email provider, redirects, and rate limits. Confirm in a role-based sign-in test before inviting live clients.
- Revisit SMTP configuration and Auth redirect allowlist (`https://aigents.help/office`) when onboarding the first user.

## New: client activity timeline and account settings
- The dashboard displays recent project messages, milestone changes, design decisions, and project status updates. These are persisted to `ag_project_activity` and constrained by project RLS.
- Staff can update task statuses directly in the Tasks workspace.
- Signed-in users can set/change a password through **My Account** without exposing passwords to AI Gents.
- No notification email on routine activity yet; the feed is in-app only.

## Security hardening
- Anonymous role privileges removed from all Office `ag_*` tables.
- `TRUNCATE`, `TRIGGER`, and `REFERENCES` revoked from authenticated users for Office tables.
- Supabase advisor returns no findings following privileged revocation function conversion to security-invoker.
- Permission policies, invitations, and Auth email triggers require actual multi-user integration tests.
