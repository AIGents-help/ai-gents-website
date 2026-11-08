# AI Gents Office — Pending Client Invitation Recovery

## In Clients → Client access
- Pending unexpired invitations have a **Resend invite** action for the original internal inviter or Office owner.
- Resend confirms the exact recipient address before invoking the existing `ag-invite-client` Supabase Edge Function. That service checks the staff role, original inviter/owner authority, expiration, per-account daily limit, and signed-in session.
- The UI reports only that Supabase **accepted an email invitation request**. It never claims that the message was delivered, read, or that the client has signed in.
- Accepted invitations show **Active**, without resend.
- Expired invitations are not resent. Revoke/replace an expired invite through the existing authorized workflow.
- Pending invitations also offer **Copy portal link**. This copies `https://aigents.help/office`, not a token: the client still must complete actual email verification or sign in with an existing verified account.
- Approver rights remain separate. Staff must verify a client member's access level and explicitly assign proposal approval rights.

## Scope and testing
- No client invitation was sent and no client accounts were created during the development.
- Staff/client display rendering and JavaScript syntax checks passed.
- Simulated pending, expired and accepted invitation cards show correct actions; unrelated staff cannot see the resend control for another inviter's pending invitation.
- The Edge Function itself was inspected but was **not live-email tested**. Real sender deliverability remains unknown.
- Existing RLS and production Supabase/Auth security rules remain unchanged.
- A real pilot still needs delivery, verification, portal login, authorized proposal decision, and task workflow E2E checks.
