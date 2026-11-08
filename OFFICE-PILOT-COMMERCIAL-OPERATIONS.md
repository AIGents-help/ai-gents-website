# AI Gents Office — Publication, Historical Benchmarks, Milestone Billing

## Newly implemented

### 1. Proposal recipient preflight
- A proposal cannot be published unless the corresponding client has an active `ag_client_users` membership, an `ag_client_approvers` authorization, and no read-only access restriction.
- This is enforced in PostgreSQL for **both INSERT and UPDATE** publication paths. The verified publication timestamp is set at the server.
- The Proposals screen provides direct shortcuts to **Client relationships** (grant verified portal access) and **Design Studio** (assign an approver) when a draft has no eligible recipient.
- Project Readiness adds a real linked-approver check. No phantom recipient or fake "sent" status.

### 2. Immutable AI Gents benchmarks
- Existing standard component quote rows were backfilled with original benchmark setup/monthly values in `ag_component_pricing`.
- Each new standard component price record receives the catalog reference amount at creation; a PostgreSQL trigger blocks later changes to benchmark fields while **allowing quoted amounts to be edited**.
- Staff UI displays the stored benchmark snapshot, not just the current catalog default. This protects an old project's comparison when new catalog fees are introduced.
- Custom components have no fabricated reference amount. Benchmarks are AI Gents **industry-informed starting estimates**, not independently certified market rates.

### 3. Approved-scope milestone billing drafts
- After a frozen scope is published and the latest client decision is **accepted**, staff can expand **Prepare approved billing drafts** in that project scope version.
- Choose a unique milestone label, amount, and optional due date. Saves a linked, **internal draft** in the existing `ag_invoices` table and the new staff-only `ag_scope_invoice_allocations` table.
- No Stripe API, charge, customer notification, or outgoing invoice occurs during preparation.
- Database limits the aggregate non-void invoices under that scope to its accepted one-time implementation total, and rejects duplicate milestone labels, superseded versions, unapproved scopes, and unauthorized actors.
- Monthly support amounts and third-party subscriptions are deliberately **not** automatically invoiced.
- Billing page identifies milestone draft records and their frozen scope version.

## Owner use
1. Select components, review editable quote and retained reference price.
2. Save business brief, prepare frozen scope draft.
3. Grant client portal access; wait until verified. In Design Studio, grant final approver rights.
4. Publish proposal; client can review and acknowledge once.
5. Create approved delivery tasks and review verification evidence.
6. Open the accepted package; prepare installment drafts that match the **actual contract**. Review under Billing.
7. Configure/test Stripe separately before attempting a test gateway draft or real collection.

## Safety & QA
- Verified DB rollback transaction: publication denied without approver; granted linked membership/approver allowed publication. A direct published **INSERT** was also denied without an approver.
- Verified DB rollback transaction: reference benchmark cannot be mutated; negotiated client price can be changed.
- Verified DB rollback transaction: accepted-scope milestone drafts succeed, aggregate amount cannot exceed approved implementation total, duplicate milestone label rejected.
- Unassigned authenticated role cannot invoke the billing RPC or read private milestone allocations.
- New frontend modules parsed successfully; simulated owner project display shows approved milestones and remaining authorized amount; nonstaff does not see internal package.
- All synthetic test records rolled back: no client, invoice, approval, or account was durably created.
- **Still not performed:** signed-in real client E2E; an actual external email deliverability test; Stripe test credentials & webhook end-to-end; e-signatures and legal contract review; live-browser print and mobile QA.
- Supabase leaked-password protection setting must be enabled in Auth settings before wider external onboarding.

## Operational caveat
The cap applies to invoice drafts linked through this approved-scope workflow. Independent manually created invoices are not counted; reconcile the full account before any payment collection.
