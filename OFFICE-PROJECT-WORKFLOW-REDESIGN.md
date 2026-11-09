# The Office — Project Workflow redesign (2026-11-08)

## Why
The two separate "Project Readiness" and "Live Client Pilot" panels were confusing and had repeated boilerplate buttons that only navigated to broad sections. They were misleadingly presented as completion progress.

## Replacement
One compact **What happens next?** card now appears at the TOP of the staff project workspace, before milestone, component and proposal controls. It contains:
- One project-specific next action and a plain-language description.
- A working action button.
- A collapsed optional four-stage overview (project setup, client access, agreement, build/delivery).
- A brief reminder that records do not prove real client delivery, legal signature, functioning software or payment.
- No fabricated progress percentage, no duplicate seven-signal checklist.

## Direct actions implemented
- **Edit business description**: opens project-specific Command Center generator and focuses description field.
- **Edit project scope**: navigates to actual scope editor / quote accordion.
- **Invite client**: opens the real invitation dialog with the CURRENT project client already selected.
- **Check invitation**: navigates to this exact client's existing pending/expired invitation instead of creating duplicates.
- **Assign decision-maker**: highlights the actual client's approver controls in Clients.
- **Prepare proposal**: opens the current project's editable scope/proposal form.
- **Review proposal**: navigates to that project's exact proposal card, including Publish when applicable.
- **Create work tasks**: invokes the existing approved-scope task action (retaining the existing confirmation and server authorization).
- **Prepare billing draft**: expands accepted scope's actual billing form.
- **Review tasks**: jumps to a task tied to this project instead of a generic section.
- **Share files**: opens the real secure deliverable-upload dialog with the correct project selected.

The workflow infers its next step only from the Office's existing staff-authorized records. It does NOT send mail, approve work, create invoices, create paid services or release anything automatically.

## Verification
- JS syntax checks for the four changed modules passed.
- Render cases tested: empty brief; brief-only; priced scope; pending invitation; verified member; approver assigned; draft; published/awaiting; changes requested; accepted/no task mappings; task mapping/no billing; billed/needs verification; verified/no handoff; completed handoff.
- The new project card contains only one next-action button and a collapsed four-stage summary. Both legacy panels were removed from rendering.
- Client invitation dialog supports project-preselected organization and separate permission controls remain unchanged.
- The proposal card has a stable ID for exact scroll targeting.
- Existing server-side row-level security, proposal version checks, and billing authorization remain unchanged.
- Real owner/client browser testing remains open. Vercel READY confirms a build and alias, not real client functionality.

## Manual acceptance checks outstanding
1. Sign in as Office owner and open GOP Command Center.
2. Click next action for its current record state; ensure the correct project/client form opens.
3. Inspect pending-invite behavior without sending a duplicate.
4. Repeat navigation for a draft/published proposal, accepted tasks and billing using safe controlled test records.
5. Verify mobile layout, screen reader labels and signed-in client access.
