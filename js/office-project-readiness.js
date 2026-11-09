// A small, actionable owner workflow. Records show administrative progress,
// not proof of email delivery, signed contracting, payments, or working software.
export function projectReadinessPage({rows,project,escape,staff}){
 if(!staff)return '';
 const h=escape,clientId=project.client_id;
 const components=(rows.ag_project_components||[]).filter(c=>c.project_id===project.id);
 const prices=rows.ag_component_pricing||[];
 const brief=(rows.ag_project_build_briefs||[]).find(b=>b.project_id===project.id);
 const priced=components.length>0&&components.every(c=>prices.some(p=>p.component_id===c.id));
 const memberIds=new Set((rows.ag_client_users||[]).filter(m=>m.client_id===clientId).map(m=>m.user_id));
 const access=rows.ag_client_member_access||[];
 const eligible=uid=>memberIds.has(uid)&&!access.some(a=>a.client_id===clientId&&a.user_id===uid&&a.access_level==='read');
 const approvers=(rows.ag_client_approvers||[]).filter(a=>a.client_id===clientId&&eligible(a.user_id));
 const unlinkedInvites=(rows.ag_client_invitations||[]).filter(i=>i.client_id===clientId&&!i.accepted_by);
 const packages=(rows.ag_scope_packages||[]).filter(x=>x.project_id===project.id).sort((a,b)=>b.version-a.version);
 const pkg=packages[0];
 const proposals=rows.ag_proposals||[],proposal=proposals.find(p=>p.id===pkg?.proposal_id);
 const decisions=(rows.ag_proposal_decisions||[]).filter(d=>d.proposal_id===proposal?.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
 const decision=decisions[0]?.decision;
 const accepted=proposal?.status==='published'&&decision==='accepted';
 const maps=(rows.ag_scope_delivery_tasks||[]).filter(m=>m.package_id===pkg?.id);
 const taskCount=Array.isArray(pkg?.items)?pkg.items.length:0;
 const mapped=accepted&&taskCount>0&&maps.length>=taskCount;
 const tasks=rows.ag_tasks||[],proof=rows.ag_task_verifications||[];
 const verified=mapped&&maps.every(m=>tasks.some(t=>t.id===m.task_id&&t.status==='done')&&proof.some(v=>v.task_id===m.task_id&&v.review_status==='verified'));
 const billing=(rows.ag_scope_invoice_allocations||[]).some(a=>a.package_id===pkg?.id);
 const docs=(rows.ag_documents||[]).some(d=>d.project_id===project.id&&d.visible_to_client);
 const setup=!!brief?.business_description?.trim()&&priced;
 const client=memberIds.size>0&&approvers.length>0;
 const agreement=!!accepted;
 const stages=[
  {title:'Prepare the project',done:setup,detail:setup?'Business brief and component prices saved':'Describe the job and price the work'},
  {title:'Connect the customer',done:client,detail:client?'Verified member and decision-maker assigned':'Invite the client and choose who can approve'},
  {title:'Agree on the work',done:agreement,detail:agreement?'Latest proposal acceptance recorded':proposal?.status==='published'?'Proposal shared in client portal; awaiting a decision':'Prepare and publish a proposal'},
  {title:'Build and deliver',done:!!verified&&!!docs,detail:verified&&docs?'Tasks verified and handoff file shared':mapped?'Work items created; completion still requires checking':'Work starts after proposal acceptance'}
 ];
 let action='brief',title='Describe the customer’s project',description='Save what the client needs and what the platform should do.';
 if(!brief?.business_description?.trim()){action='brief';}
 else if(!priced){action='components';title='Choose and price the work';description='Select the items AI Gents will deliver, then save their quoted prices.';}
 else if(memberIds.size===0&&unlinkedInvites.length){action='pending-invite';title='Check the client invitation';description='An invitation is already on record. Check its status before sending another.';}
 else if(memberIds.size===0){action='invite';title='Invite your customer';description='Send access to the correct client organization. The customer must verify their account.';}
 else if(!approvers.length){action='approver';title='Choose who can approve the proposal';description='Assign one verified customer representative with Read & respond permission.';}
 else if(!pkg){action='scope';title='Prepare the client proposal';description='Review the selected work, price and payment terms, then create the draft.';}
 else if(proposal?.status==='draft'){action='publish';title='Review and publish the proposal';description='The draft exists. Publish it when the terms are ready for the authorized client.';}
 else if(decision==='changes_requested'){action='scope';title='Update the proposal requested by the client';description='Review the feedback and prepare a new scope version. Do not change the original offer.';}
 else if(proposal?.status==='published'&&!accepted){action='review';title='Await the customer’s decision';description='The proposal is available in the client portal. Email receipt and review are not verified here.';}
 else if(!mapped){action='tasks';title='Create the approved work list';description='Turn accepted proposal items into tasks for your team.';}
 else if(!billing){action='billing';title='Prepare the agreed payment milestone';description='Review the accepted payment schedule and prepare an internal invoice draft.';}
 else if(!verified){action='work';title='Review and verify the work';description='Check completed tasks and supporting evidence before marking delivery finished.';}
 else if(!docs){action='handoff';title='Share the final handoff';description='Upload and share the approved files with the customer.';}
 else {action='review';title='Review the completed handoff';description='Internal task evidence and handoff records exist. Confirm real client delivery separately.';}
 const labels={brief:'Edit business description',components:'Edit project scope',invite:'Invite client','pending-invite':'Check invitation',approver:'Assign decision-maker',scope:'Prepare proposal',publish:'Review proposal',review:'View proposal',tasks:'Create work tasks',billing:'Prepare billing draft',work:'Review tasks',handoff:'Share files'};
 const summary=stages.filter(x=>x.done).length;
 return '<section class="card office-workflow" id="office-project-readiness"><div class="section-head"><div><p class="eyebrow">Project management</p><h3>What happens next?</h3><p>One clear next step. The rest is handled as the project moves forward.</p></div><span class="pill">'+h(summary+' of 4 stages recorded')+'</span></div>'+
 '<div class="office-workflow-primary"><div><span class="tiny muted">YOUR NEXT ACTION</span><h4>'+h(title)+'</h4><p>'+h(description)+'</p></div>'+
 '<button class="btn" type="button" data-workflow-action="'+h(action)+'" data-workflow-project="'+h(project.id)+'">'+h(labels[action])+'</button></div>'+
 '<details class="office-workflow-details"><summary>View the project steps</summary><div class="office-workflow-steps">'+stages.map(s=>
 '<div class="office-workflow-step"><span class="readiness-icon '+(s.done?'good':'pending')+'" aria-hidden="true">'+(s.done?'✓':'○')+'</span><div><strong>'+h(s.title)+'</strong><p class="tiny muted">'+h(s.detail)+'</p></div></div>').join('')+'</div></details>'+
 '<p class="tiny muted office-workflow-note">These are saved Office records, not proof of email delivery, a legally signed contract, working software, or successful payment. Real client testing and owner approval are still required.</p></section>';
}
export function projectReadinessWire({root,project,onAction}){
 root.querySelectorAll('[data-workflow-action]').forEach(b=>b.onclick=()=>{
  if(b.dataset.workflowProject!==project.id)return;
  onAction?.(b.dataset.workflowAction,project);
 });
}
