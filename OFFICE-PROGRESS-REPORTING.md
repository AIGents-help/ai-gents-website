# AI Gents — Hybrid Project Progress Updates

The Office now offers **Progress Updates**, available to AI Gents staff, scoped to an existing `ag_projects` record.

## Workflow
1. Open **The Office → Progress Updates** and select a project.
2. Optionally save its existing GitHub owner/repository and Vercel project/team IDs. This registers only read-only links; no external assets are created.
3. Click **Refresh** to request current technical status: latest available commits, open PRs, and recent deployments.
4. Click **Copy standard prompt**; paste into ChatGPT, Claude, Codex, or the current development LLM.
5. Paste the completed AI report into the Office and click **Save progress update**.
6. Older reports remain timestamped and intact. They are not silently rewritten or merged into verified technical facts.

## Boundaries
- **GitHub**: Public repositories may be readable without credentials. Private repository activity requires a read-only GitHub token stored **only** as Supabase Edge Function secret `AG_GITHUB_READ_TOKEN`. No tokens enter the browser.
- **Vercel**: Account deployment activity requires a read-only credential stored in secret `AG_VERCEL_READ_TOKEN`. If absent, the UI says credentials are required.
- Endpoint `ag-project-source-status` is Supabase JWT-verified, requires staff membership, and can request only the GitHub/Vercel identifiers already stored for a registered Office project.
- The Edge Function calls provider APIs read-only and never creates repos, deployments or accounts.
- A successful Vercel build or GitHub commit does not prove functionality or project completion. Never automatically infer completion percentage.
- Manual AI reports are factual assertions supplied by the AI/user; they are not implicitly verified by technical status.
- Reports and source links are staff-only under RLS.
- Do not publish client-sensitive report content externally without explicit review.

## Operations
The one existing project found at rollout was GOP Command Center. No source mappings were assumed or assigned. Existing AI Gents canonical website repository is `AIGents-help/ai-gents-website`, but it must be associated only with the correct Office project.

## Release test
- Validate source-link changes and report submission using a genuine staff session.
- Verify nonstaff cannot insert/select development reports or source links.
- Verify GitHub public repo status; configure read-only secret only if private repo support is necessary.
- Verify Vercel deployment status after providing a read-only token.
- Confirm original pasted report text is preserved, is project-scoped, and is dated.
