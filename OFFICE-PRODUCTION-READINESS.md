# AI Gents Office — Production Readiness & Client Acceptance

## In this release
- Client approval asks for a **typed full name** and an explicit scope acknowledgment when clicking Accept. The database refuses acceptance without those fields, and refuses uninformative change requests. Records retain authenticated actor and timestamp; this is not certified e-signature.
- The staff-only live quote warns when selected features may involve **shared development work** (e.g., CRM + pipeline, website + responsive, Stripe + checkout). It does not silently change prices or apply discounts.
- The staff-only **Project Readiness & Delivery Control** section shows real evidence-backed progress: scoped/priced components, saved brief, frozen proposal, publication, actual client decision, task mapping, staff-verified delivery, and selected source/handoff dependencies.
- It never represents the readiness score as authorization to deploy. Staff must explicitly review credentials, contracting, permissions, production tests, charges, and email.

## Internal sign-off workflow
1. Owner/approved staff selects components and validates price overlap.
2. Save brief (business, design, audiences) and create frozen versioned scope.
3. Review its branded printable proposal; confirm payment terms, scope exclusions, taxes and provider costs.
4. Publish draft deliberately, verify invited client can log in and see only the right project.
5. Client reviews scope, types name and acknowledges terms, then accepts; or requests changes with a reason.
6. A changed scope receives a new version; one decision only is stored for each proposal.
7. Generate tasks from latest accepted version, assign work.
8. Submit real test evidence for approved component tasks; internal staff verifies before task is Done.
9. Check handoff files, project links, account ownership, approvals and release references.
10. Separate financial activation: invoices are NOT auto-created/charged by proposal acceptance.

## Actual current limitations
- Live owner/client/contractor browser E2E has NOT been performed; no client has actually accepted a proposal.
- Password breach/leaked-password protection is disabled in Supabase Auth settings. Enable in dashboard before broad external onboarding.
- Live Stripe billing is not activated; existing test-mode functions require Stripe secrets and an approved webhook, plus end-to-end verification.
- Transactional email sending and notifications need verified Resend sender, secrets and a real delivered-email test.
- Certified e-signatures and a legally reviewed master services agreement are separate requirements.
- Browser print/PDF visual QA needs a signed-in session.
- AI-generated build prompts do not create or validate software on their own; actual repo, tests and signoff are required.

## Verified safely
- Database RLS prevents unassigned authenticated identities from reading private scopes and verification records.
- Frozen package browser users cannot mutate scope.
- Database blocks unacknowledged acceptance; rollback test confirms named acknowledgment succeeds.
- Database blocks duplicate decisions, superseded approvals, incomplete task Done states.
- All JavaScript modules syntax validated; UI data rendering smoke tested.
- Supabase security advisor's remaining warning is leaked password protection.
