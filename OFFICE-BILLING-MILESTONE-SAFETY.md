# Office — Approved Milestone Billing Draft Safety

The Office's accepted proposal and billing draft interface now uses the approved, frozen payment terms without pre-filling the full remaining balance as an invoice amount.

## Workflow
- Open an accepted, latest frozen scope and expand **Prepare approved billing drafts**.
- Read the saved *Accepted payment terms* directly in the billing section.
- If the saved terms explicitly contain exactly three standalone payment percentages that add to 100%, the UI offers optional **Initial deposit**, **Staging milestone** and **Final handoff** suggestions. The amounts are calculated from the immutable accepted one-time price with cent-accurate rounding.
- Clicking a suggestion fills only the editable milestone name and amount. Staff must still review due date, agreement and status and deliberately click **Save internal invoice draft**, then confirm.
- If no clearly recognizable three-stage schedule exists, the amount remains blank and no figures are inferred.
- Reused milestone labels are not suggested after an allocation, even if an old invoice is void.
- Existing server-side `ag_prepare_scope_invoice_draft` enforces staff-only use, accepted non-superseded proposal and maximum unvoided allocation amount, and generates internal drafts only.
- No Stripe charge, live invoice, notification, customer email, or payment is initiated by this change.

## Verification
- JavaScript syntax checks passed.
- Test with approved 40% / 40% / 20% terms at $12,345.67 produced $4,938.27, $4,938.27 and $2,469.13, totaling exactly $12,345.67.
- Two-stage/custom terms returned no automatic suggestion.
- Test with $1.01 total rounded to $0.40 / $0.40 / $0.21 without losing cents.
- Rendered proposal showed three suggestion buttons, the accepted payment terms, and a blank required amount; no erroneous full-remaining default.
- Signed-in browser and actual client acceptance/payment workflow are not yet end-to-end verified.
