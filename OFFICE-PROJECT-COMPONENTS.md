# AI Gents — Standard & Custom Project Components

## Purpose
Offer a consistent building-block menu when scoping any AI Gents engagement, then track individual delivery statuses.

## Existing Office flow
1. Open The Office → Projects → choose an existing project.
2. Under **Project components & scope**, select any standard checkbox that is requested/in the agreed scope.
3. The selection creates one persistent record scoped to that project, initially marked **Not started**. It does **not** provision that service.
4. Add as many uniquely named **Custom components** as required.
5. For selected items, set **In progress**, **Blocked**, or **Completed**. Completion requires a confirmation in the UI.
6. Store any dependencies, acceptance criteria, external-service owner, or handoff notes against each selected item.
7. View selected, completed, and blocked totals at a glance. Unselected items do not count toward completion.

## Default menu
- **Experience:** website, brand system, responsive design, content management, forms, client portal, authentication, role controls, accessibility, SEO, analytics.
- **Operations:** admin dashboard, CRM, pipeline, approvals, tasks, documents, booking, notifications, reporting, automation, AI workflows, integrations.
- **Commerce:** Stripe, invoices, subscriptions, checkout, service catalog, tax/compliance review.
- **Infrastructure:** Supabase, GitHub, Vercel, domain/DNS, storage/backups, security/audit, monitoring, handoff/training.
- **Marketing:** Resend, Kit, Smartlead, newsletter, email templates, reviews, social integration, consent/deliverability.
- **Custom:** arbitrary project-specific requested components.

## Design and access rules
- Checkbox = **in requested scope**. Never equate this with purchased, configured, deployed or verified.
- Status = **delivery state**, distinct from scope selection.
- Scope edits (add/remove items and notes) = existing privileged AI Gents staff. Delivery status may also be updated by an active assigned employee/contractor with project Write permission.
- Customer accounts cannot change these internal agreed-scope records.
- No purchases, new accounts, repositories, databases, deployments or subscription costs are created by checkbox changes.
- No fake completion or selected catalog records are seeded.
- Changes persist in `ag_project_components`, with a per-project unique component key, actor IDs, timestamps and a completion timestamp.
- The database trigger blocks scoped team members from editing label, scope, notes, project or other fields while allowing only status.
- If customer-facing request forms are desired, treat them as **scope requests for staff review**, not automatically approved project scope.

## Next enhancements
- Formal approval/acceptance gate for scope changes, with immutable history and customer sign-off.
- Assignment, due date, dependency linking and acceptance evidence for each component.
- Prebuilt estimate and price line items based on selected components. Never auto-purchase infrastructure.
- Starter templates (brochure website, client portal, e-commerce, proprietary operations platform) that preselect components only when intentionally applied.
- A customer questionnaire showing the standard menu without exposing internal deployment records.
