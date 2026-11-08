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
