# AI Gents — The Office Account & Delegation Model

## Public account entry
- The top navigation on all major public AI Gents pages contains **Account / Sign in**.
- Once the user has a valid Supabase session, navigation becomes **My Account**, opening `/office?view=profile`.
- The Office account profile shows email, role, editable display name and phone, and password change. Display fields live in editable Supabase user metadata, **never used for authorization**.
- Access is invitation-only. No open public account-registration or staff-elevation path was added.

## Role separation
| Role | Assigned through | Read scope | Write scope |
| --- | --- | --- | --- |
| Owner | Existing privileged `ag_staff` record | All Office business data | Management and assignments; existing administrative actions |
| Other existing privileged staff | Existing `ag_staff` roles | Existing broad Office staff scope (unchanged) | Existing privileges (unchanged) |
| Employee | Owner → Team & Access | Assigned project records, milestones, tasks, conversations and notifications | Only messages and task **status** in assigned projects marked Read & respond |
| Contractor | Owner → Team & Access | Same project-scoped read | Same limited Read & respond actions; no cross-project visibility |
| Customer | Clients → Client portal invitation | Own organization and project client-facing content | Read & respond by default, or Read only if owner overrides. Read only blocks messages, design feedback, proposal decisions and approvals |

**Important:** The newly created employee/contractor memberships are **not** inserted into `ag_staff`. That existing table allows broad staff access and must not be used for project-scoped people.

## Owner operating workflow
1. Under **Clients**, create or select an organization and invite its contact. The client must verify their email before membership activates.
2. In **Team & Access**, select an existing Office project, enter an employee or contractor email, set the type and **Read only / Read & respond**, and send the invitation. This may send an actual Supabase Auth invitation email.
3. For an existing member, add/remove another assigned project or change access separately.
4. Use **Disable access** to immediately block all of a team member's project reads and writes. Revocation is checked in database RLS, not browser navigation alone.
5. Under **Clients**, owner can choose Read only / Read & respond for active verified client invitations.

## Security and deliberate limitations
- `ag-manage-access` is JWT verified, validates the authenticated user with Supabase, and requires the existing `ag_staff.role='owner'` before any privilege mutation.
- User assignments are made by server-side function using a service credential; no service credential enters browser source.
- Team memberships stored in `ag_team_members` with per-project grants in `ag_team_assignments`; client overrides in `ag_client_member_access`.
- Project access is tested against **current active membership** on every RLS query; disabling/revoking access takes effect for new reads/writes even if a previous session exists.
- Team task updates are limited by a trigger to the `status` column; they cannot change ownership, title, scope, dates or project identity.
- Client read-only accounts cannot message or make formal review/proposal decisions.
- Assigned team member notifications are generated for new non-internal project messages, only for that project.
- Team members cannot access billing, Stripe, account management, internal-only records, source integration tokens, production deployments, or owner administration.
- This release does **not** add team write access to proposal authoring, deliverable uploads, billing, editing client organizations, or production deploy actions. These should be delegated as individually auditable future permissions only when necessary.
- Existing privileged staff roles and their broad grants remain unchanged. Review legacy staff members separately before delegating.
- Supabase leaked-password protection security advisor warning remains outstanding.
- Email sender configuration must be verified before real invitations; do not test by sending to clients without owner intent.

## Verification remaining
- Test real owner, employee Read, employee Write, contractor, customer Read, customer Write, and revoked-access sessions with legitimate accounts.
- Verify a non-owner cannot invoke `ag-manage-access`; verify an unassigned team account gets no other clients.
- Check Supabase invitation email redirects to `https://aigents.help/office`, password setup and profile appearance.
- Validate responsive menu and profile on mobile browsers.
