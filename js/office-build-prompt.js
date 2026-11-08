// AI Gents reusable project launch prompt. The selected Office scope is the source of truth.
// This generates a blueprint for AI-assisted development; it does not make API purchases,
// claim successful deployment, or supply secret credentials.
export function buildCommandCenterPrompt({project,items,brief}){
 const chosen=items.filter(x=>x.project_id===project.id);
 const sections=new Map();
 for(const item of chosen){
  const category=item.category||'Custom';
  if(!sections.has(category))sections.set(category,[]);
  sections.get(category).push('- '+item.component_label+(item.notes?.trim()?' — '+item.notes.trim():''));
 }
 const requirements=[...sections].map(([group,rows])=>'### '+group+'\n'+rows.join('\n')).join('\n\n');
 return `AI GENTS | PROPRIETARY BUSINESS COMMAND CENTER — BUILD DIRECTIVE
CLIENT PROJECT: ${project.title}
BUSINESS: ${brief.business_description?.trim()||'[BUSINESS DESCRIPTION REQUIRED]'}
TARGET USERS & ROLES: ${brief.audience_roles?.trim()||'[Determine with client; do not invent roles or authorizations.]'}
DESIGN DIRECTION: ${brief.design_direction?.trim()||'[Design direction to confirm with client.]'}
ADDITIONAL REQUIREMENTS: ${brief.additional_requirements?.trim()||'None specified.'}

MISSION
Design and implement a cohesive, extensible proprietary business platform appropriate for this client. Treat public website, customer experience and back-office command center as integrated modules when those capabilities are selected. The following items are the approved working scope for planning; do not add unchecked features as mandatory paid deliverables.

SELECTED PROJECT COMPONENTS (${chosen.length})
${requirements||'[No components selected yet — obtain scope approval before coding.]'}

BUILD METHOD
1. Audit the EXISTING repo, branch, services, deployments, domain, design assets and current functionality before making changes. Preserve working functionality and data. Do not create duplicate repos, databases, accounts or providers.
2. Translate every checked component into explicit user journeys, UI surfaces, data models, user permissions, acceptance criteria and test cases. For custom items, confirm boundaries before implementation.
3. Draft an integrated module architecture, sitemap, admin navigation, role/permission matrix, schema and implementation plan. If important facts are missing, identify assumptions and questions; do not pretend they are settled.
4. Develop a responsive, accessible, polished visual system matching the stated aesthetic; favor clarity and low-friction client and staff workflows.
5. Use only the components and providers explicitly selected for this client. If Supabase, Stripe, GitHub, Vercel, Resend, Kit, Smartlead or other integrations are selected, first verify whether the client already has suitable approved accounts and infrastructure. Never expose keys in frontend code.
6. Implement functionality in sensible milestones, maintaining a canonical repository and reversible changes. Apply least-privilege server authorization and row-level security to customer, employee, contractor and admin data. Never fabricate tests, payments, deploys or client approval.
7. Validate workflows with representative roles and error cases: auth, access boundaries, CRUD, notifications, integrations, responsive layouts, failures and actual provider callbacks.
8. Report at each milestone: confirmed completed work, remaining work, blockers, tests run, exact repo/branch/deployment references and owner approvals needed. Distinguish committed code from tested/working production behavior.

REQUIRED DELIVERABLES
- Product requirements and in-scope versus excluded components.
- Public site and internal command center IA / screen designs when selected.
- Role matrix, data/storage models, integration inventory and credential requirements.
- Incremental implementation with test evidence and rollback path.
- Owner-facing user documentation and admin handoff.
- Honest progress report and explicit outstanding issues.

APPROVAL GATES
No new paid subscriptions, accounts, repositories, databases, deployments, production releases, bulk email campaigns, live payment transactions or credential changes without owner authorization. Estimates and third-party subscriptions are NOT authorization to purchase. All outbound marketing must observe permission, unsubscribe and deliverability requirements.

BEGIN
First produce the discovery/architecture plan and inventory of existing systems, then start implementation only where existing permissions and project context explicitly authorize it. Clearly mark any work requiring approval. Do not claim this prompt alone guarantees a production-ready system.`;
}
