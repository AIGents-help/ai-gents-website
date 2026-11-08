# AI Gents — Proposal-to-Project Automation

## Purpose
Make the **approved client scope** the common source of truth for commercial terms, the AI build directive and delivery tasks.

## Procedure (The Office)
1. In **Projects**, select an existing project.
2. Select and price components, add custom scope and save the business description/design brief. Review potential overlap and provider costs.
3. After the Build Prompt section, open **Proposal → Build → Delivery**.
4. Provide the proposal title, assumptions/exclusions, payment terms and any one-time discount. Click **Freeze scope and create draft proposal**. This creates:
   - a full item-and-price snapshot in `ag_scope_packages` (v1, v2, ...);
   - a linked `ag_proposals` **internal draft**, containing an itemized SOW, costs, recurring fees, assumptions and payment terms.
5. Review in **Proposals** and deliberately publish to authorized client approvers.
6. The client records **Accept** or **Request changes** using existing portal permissions. Acceptance is not a substitute for a legal signature.
7. After the latest recorded decision is acceptance, use **Create approved tasks** on that frozen scope version. Each included component creates one task with a verification requirement; re-running the action is idempotent.
8. Copy the frozen proposal, AI development prompt or delivery checklist at any time. Those outputs use the **snapshot**, not whatever is currently checked in the editable scope menu.

## Security
- No automatic emails, live Stripe invoice, payment request or production deployment occurs.
- `ag_scope_packages` and `ag_scope_delivery_tasks` are **staff-only** under RLS, with INSERT/SELECT grants and no browser UPDATE or DELETE.
- Package creation is a PostgreSQL SECURITY INVOKER RPC. It authenticates current staff and creates proposal plus snapshot within a single transaction. An unassigned authenticated user cannot invoke it successfully.
- Snapshot prices are staff-only, while the linked proposal becomes client-visible only after its explicit Publish action.
- A database trigger blocks mutating the commercial terms of any linked proposal. New terms require a **new scope package version**.
- The task generation RPC locks by package identity, requires latest scope version and a published proposal with latest client decision **accepted**, then inserts mapped tasks atomically and only once per component.
- Task creation does not modify the component's verification status or pretend that code was implemented.
- Estimated third-party costs remain distinct from AI Gents revenue. They are not authorization to purchase software.
- No duplicate repositories, accounts, databases or paid subscriptions created.

## Verification
- Owner can prepare a versioned proposal snapshot from real selected component records and saved brief in a **rolled-back** transaction.
- A non-staff authenticated identity cannot create a proposal package.
- A draft proposal cannot generate delivery tasks.
- Simulated acceptance inside a rolled-back transaction produced one task per frozen component; a second execution produced **zero** additional tasks.
- Production remains without synthetic proposals/decisions/tasks from these tests.
- Full multi-role signed-in browser testing, legal proposal language review, email delivery, and automated client handoff are still outstanding.

## Next steps
- Add explicit version comparison, client-facing SOW export (PDF), scoped change requests and approvals.
- Add true milestone owner assignment, acceptance evidence and release gates.
- Integrate only approved proposals with Stripe after test credentials and webhook E2E are verified.
- Enable Supabase Auth leaked-password protection before broader external onboarding.
