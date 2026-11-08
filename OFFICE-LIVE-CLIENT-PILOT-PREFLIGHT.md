# The Office — Real Client Pilot Preflight (Record-Based, Not E2E)

## Objective
Make the next verified client pilot actionable without mistaking UI features or deployed code for functional acceptance.

## Project workspace
A new **Live Client Pilot — Evidence Checklist** appears inside **Project Readiness & Delivery Control** for internal staff. It counts **seven recorded signals** for that specific project/client, and provides **Open** shortcuts to the existing Clients, Proposals, Tasks, and Billing screens.

Checks are derived from persisted database records only:
1. Invitation record for project client — not proof of outbound email delivery.
2. Verified client membership for the client — not proof of actual browser login.
3. Eligible designated approver — verified membership and Read & respond permission.
4. At least one published proposal for the project — not proof the client could view it.
5. At least one accepted proposal decision record — not external legal e-signature.
6. Accepted latest scope with every mapped component delivery task — not proof of real functional QA.
7. At least one internal milestone invoice allocation for the latest scope — not proof of Stripe charge.

The interface explicitly warns that email receipt, client session access, proposal visibility, client acceptance E2E, browser QA, and payment tests must be verified separately before the owner trusts production readiness.

## Verification
- Read-only production counts inspected: 0 invitations, 0 verified clients, 0 approvers, 0 proposals, 0 proposal decisions, 0 linked delivery tasks and 0 linked billing drafts as of 2026-11-08.
- Staff-only HTML render with no records shows 0/7; synthetic in-memory full record set shows 7/7. No fake database identities or records were created.
- Static JavaScript syntax and HTML section balance passed.
- No client communications, purchases, approvals, invoices, external services or accounts were created.

## Pending manual pilot
Use a real authorized internal recipient first (with owner approval), confirm SMTP delivery, verify client login using a separate browser/device, publish a noncommercial test proposal after approvals, test decision capture, generate mapped tasks, verify evidence, and inspect internal draft billing without real charges. Document dates and observed outcomes independently.
