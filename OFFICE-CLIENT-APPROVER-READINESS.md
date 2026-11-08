# AI Gents Office — Client Onboarding and Proposal Approver Readiness

## New Clients-screen controls
The existing **Clients** page now shows verified portal members within each client organization beneath the connected projects. Their names are displayed by the verified invitation email when available, with read-only vs. read-and-respond status. Authorized staff can assign or remove a verified member as an official proposal approver without switching to Design Studio.

Pending invitations are not treated as verified portal members. A client with no verified member gets a clear guidance message. Read-only members cannot be assigned as approvers until the owner changes their access to **Read & respond**. These controls are internal only; client portal users do not receive administrative access.

## Security
- Added a PostgreSQL trigger on `ag_client_approvers`: a newly assigned approver must already be a member of that exact organization in `ag_client_users` and must not have read-only access.
- Existing RLS staff insert/delete, client member read and proposal approval permission checks remain intact.
- Staff must confirm changes; the database remains authoritative. No client is automatically invited, emailed, published to, or charged.

## Verification
- Rolled-back database test rejected assignment without verified membership, then permitted assignment after a verified membership existed.
- An unassigned authenticated identity saw no organization approver records.
- Staff UI syntax and HTML rendering tested for two organizations, multiple portal members, active approver, read-only member and no-member empty state.
- Supabase security advisor retains the existing warning for disabled leaked-password protection.
- Real external client invitation/email, live login, and multi-user acceptance browser testing are still outstanding.
