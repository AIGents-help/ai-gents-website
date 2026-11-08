# The Office — Client Project Links & Quote Revision Guard

## Client relationships
In **The Office → Clients**, each organization now lists **Connected projects** directly below its contact information. Every project entry shows the project title, current status, and progress, and has **Open project →**, which reuses the existing project workspace navigation.

Projects are filtered by the organization's actual `ag_projects.client_id`. The page is already staff-only. A client with no projects shows a clear empty-state reminder to create a project assigned to that organization.

## Proposal quote freshness
When preparing a **frozen scope proposal**, the staff UI refuses to continue while pricing edits are unsaved. It sends the exact prices, quantities, item identifiers and update timestamps it displayed to `ag_prepare_scope_package`. The database locks the relevant rows and checks they still match before generating an immutable proposal draft. If another staff member changes the scope or price first, no proposal is created, and staff are prompted to refresh.

## Verification
- Client rendering smoke test: two organizations with two projects assigned to one and one to the other generated exactly the expected links; status and progress present.
- Office and client page JavaScript syntax checks passed.
- Rolled-back SQL test: current quote snapshot allowed draft creation; changing a component fee and then retrying with the old snapshot was refused; no test proposals persisted.
- Unchanged staff access restrictions and client/project database RLS.
- No client messages, invoices, accounts or subscriptions were created.

## Remaining
A signed-in end-to-end browser check of Clients → Open project and Scope → Freeze proposal using actual staff identities is still outstanding.
