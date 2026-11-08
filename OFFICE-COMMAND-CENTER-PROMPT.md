# Office — Collapsible Components & AI Command Center Build Prompt

## Client component checklist
- The five standard categories and the Custom section render as collapsed native `<details>` blocks. Each summary shows the number of components selected.
- Selected components remain visible when the category is expanded, but their editable fee form is collapsed behind a **Fees** summary. Scope, status and quote totals are retained unchanged.
- Custom components also use expandable fee editors.
- This reduces the length of a project workspace without discarding requested scope.

## Generate build prompt
- **The Office → Projects → [project] → Generate Client Command Center Build Prompt**
- Enter a description of the business, preferred visual aesthetics, target user roles and optional special requirements.
- **Save brief** persists details to `ag_project_build_briefs`; **Generate build prompt** also saves the latest brief while showing an editable-selection-derived prompt; **Copy prompt** places the displayed text on the clipboard.
- Build prompt includes *only* checked components. It is designed to paste into ChatGPT, Claude, Codex or another development LLM.
- The prompt instructs the receiving AI to examine existing repos, infrastructure and assets, build an integrated frontend/admin architecture, define workflows and permissions, develop incrementally, verify tests, and report progress.
- Guardrails prohibit duplicate infrastructure, unapproved paid accounts/subscriptions, live Stripe charges, production deployment, and mass email campaigns. It does not assert that one prompt automatically yields reliable production software.
- Product pricing is **not** included in the development prompt, and build briefs are staff-only.

## Technical fix
- The Office table loader previously assumed every table had a `created_at` column. `ag_component_pricing` uses `updated_at` instead. This caused selected components to appear as $0 even when prices were correctly saved.
- Now selects the valid `updated_at` sort column for pricing and new brief records, restoring the saved fee display.

## Checks
- HTML output smoke test: six category accordions, nested fee details, eleven balanced `<details>` pairs, prompt generator present.
- JavaScript syntax and sample prompt generation verified.
- No project scope, saved prices, payment or customer data changed by the release.
- Real signed-in visual/browser test still outstanding.
