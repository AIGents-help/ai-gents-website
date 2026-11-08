# The Office — Proposal Actions and Next Steps

## Purpose
Display what needs attention after a proposal draft is created, published, or decided by the client.

## Staff workflow
- In **Proposals**, a summary lists how many proposals currently need immediate staff action.
- Proposals are ordered by next-action priority rather than arbitrary database order.
- Every card shows a human-readable next step:
  - **Draft / approver missing**: finish client access and designate an approver.
  - **Draft / approver ready**: review and publish; publishing remains an explicit action.
  - **Published / no decision**: wait for client decision; publication is not evidence of email delivery or a client's receipt.
  - **Client requested changes**: review recorded feedback and create a new frozen scope version.
  - **Accepted / delivery tasks not generated**: open project and create approved tasks from accepted scope.
  - **Accepted / tasks mapped**: continue delivery and staff evidence verification.
  - **Superseded**: use latest version rather than restarting an outdated offer.
- A staff-only **Open project** button opens the specific project workspace without searching the project list.

## Client workflow
- Authorized client users see published proposals, the next step, decision history and the existing Accept / Request Changes form.
- Proposals requiring that user's decision appear before proposals already decided.
- A client who lacks approval permission sees the status but cannot respond.
- Private project edit navigation remains restricted to staff.

## Safeguards and verification
- No schema migration or new RLS exposure: all status text derives from existing authorized proposal/decision/project records.
- UI smoke tests verified the staff draft, awaiting decision, accepted/delivery task, and authorized client review states.
- Both modified JavaScript modules parsed successfully.
- No proposal was published, approved, billed, emailed or charged during this release.
- Real signed-in owner/client browser testing and outbound email deliverability testing remain outstanding.
