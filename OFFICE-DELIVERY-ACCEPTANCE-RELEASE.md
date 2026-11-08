# AI Gents Office — Proposal and Delivery Acceptance Release

## Added
1. **Printable branded proposal:** each visible proposal in the Proposals tab has **Review / Print / Save PDF**. The print page carries AI Gents branding, client/project/date, scope, one-time and recurring prices, and agreed terms where available. The browser's native print dialog can save a PDF. No third-party PDF service or subscription was created.
2. **One-decision, one-version client approvals:** client decisions are insert-only; a published proposal cannot silently revert to draft; a superseded scope cannot be published or accepted. Changed requirements require a new scope version. The server enforces these rules with database triggers and uniqueness.
3. **Delivery acceptance evidence:** each task generated from an accepted scope version must have a submitted evidence reference, then a separate staff verification, before its status can be Done. Staff can reject evidence, and the original submitter can revise a rejected submission. The Tasks page shows evidence status, input and review controls.
4. **Live status visibility:** scope package section shows mapped delivery-task progress; superseded packages do not invite users to generate new tasks.

## Important limitations
- **Real client account E2E is still unverified**: verified SQL transactions and rendered UI simulations do not replace testing invitation → sign in → published proposal review → acceptance → approved task creation → staff evidence verification with two live accounts.
- **E-signatures are not implemented**. A recorded portal acceptance is not a legal e-signature; external contracting remains separate.
- **Printing is browser-native**, not a server-generated attachment. A client's browser may need popups enabled, and brand output needs real-browser QA.
- Stripe requires test-mode activation/credentials and end-to-end webhook testing before live billing; no real invoices or charges are created by the new functionality.
- Supabase Auth leaked-password protection is still disabled in Auth project settings; enable it before opening broader registration.
- Email delivery needs configured transactional sender and end-to-end tests.
- Delivery evidence is a verification reference plus notes, not an automatic test or independently checked artifact; staff must actually validate it.
- No new paid providers, repos, external accounts or deployments other than the existing AI Gents website were created.

## Tested
- Simulated owner created versioned scope and proposal in rollback-only transaction, published, recorded acceptance and created tasks with no duplication.
- Client proposal duplicate decision and published→draft downgrade both rejected by database.
- Approved task cannot become Done without evidence; submitted but unverified still rejected; staff verification allows completion. Transaction rolled back.
- Print markup generated with itemized prices; unsafe user-controlled markup escaped.
- Unauthorized authenticated identity cannot view private scope packages, pricing, or task evidence; database security advisor shows only known leaked-password-protection warning.
- All frontend modules pass JavaScript syntax validation.

## Operational runbook
- Staff prepares priced component checklist, brief and frozen scope version.
- Staff reviews Proposals; publishes only after commercial/legal review.
- Authorized client opens proposal, reviews/prints, and records one acceptance or change request.
- Staff generates tasks from latest accepted scope.
- Team members submit staging/test results with references.
- Staff confirms actual workflows and permissions, then verifies evidence. Only then can a task be marked Done.
- Staff hands off documentation and deployment references, and invoices separately after finance activation.
