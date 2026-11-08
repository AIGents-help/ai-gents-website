# The Office — Editable Proposal Working Drafts and Offer Preview

## What changed
Within a project's **Prepare client proposal** section, AI Gents now saves a private, editable proposal working draft for each project. The saved fields are the proposal name, assumptions/exclusions, payment terms and one-time discount.

The default commercial language appears only when no saved working draft exists. Edits are automatically saved after typing stops, or immediately through **Save proposal details**. An internal **Preview offer** shows the selected component names, one-time setup prices, recurring AI Gents service fees, estimated discount and the exact edited terms. No customer publication or billing occurs from saving or previewing.

The existing **Freeze scope and create draft proposal** button remains a deliberate, separate step. It first saves the current terms, then checks the project's saved component price revision before creating the linked versioned proposal. Published versions stay immutable.

## Private data and operational safeguards
- New `ag_project_proposal_drafts` table stores one working draft per project with `updated_by` and `updated_at`.
- RLS and grants restrict read and write to verified internal Office staff. The new table is not fetched for customers or delegated contractors.
- An authenticated nonstaff identity saw zero working-draft records in a database test.
- Navigation and page refresh prompt before discarding unsaved proposal edits. Pending delayed autosave is canceled when a user explicitly leaves and discards.
- A failed database save is shown as a failure; no customer message, invoice, Stripe transaction, paid service, or deployment is created.
- The offer preview is for internal review; it is not a signature, legally finalized agreement or sent proposal.

## Verification
- Rolled-back staff database transaction verified insert/update, audit timestamp, and staff identity. No real customer proposal was altered.
- Staff, previously saved draft, and default-language HTML renders were checked; edited values, discount and escape handling were correct.
- All modified JavaScript source files passed syntax validation.
- Real signed-in owner browser interaction, multiple-staff simultaneous editing and external client approval still need end-to-end testing.

## Use
The Office → Projects → select project → Proposal → Build → Delivery → Prepare client proposal.
