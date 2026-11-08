// Internal project readiness. Every badge is derived from real Office records;
// does not assert external payment, signatures, deployments or tests are verified.
export function projectReadinessPage({rows,project,escape,staff}){
 if(!staff)return '';
 const h=escape;
 const scoped=(rows.ag_project_components||[]).filter(x=>x.project_id===project.id);
 const pricing=rows.ag_component_pricing||[];
 const brief=(rows.ag_project_build_briefs||[]).find(b=>b.project_id===project.id);
 const packages=(rows.ag_scope_packages||[]).filter(p=>p.project_id===project.id).sort((a,b)=>b.version-a.version);
 const latest=packages[0],proposal=(rows.ag_proposals||[]).find(p=>p.id===latest?.proposal_id);
 const decisions=(rows.ag_proposal_decisions||[]).filter(d=>d.proposal_id===proposal?.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
 const accepted=proposal?.status==='published'&&decisions[0]?.decision==='accepted';
 const linkedApprovers=(rows.ag_client_approvers||[]).filter(a=>
  a.client_id===project.client_id &&
  (rows.ag_client_users||[]).some(u=>u.client_id===a.client_id&&u.user_id===a.user_id) &&
  !(rows.ag_client_member_access||[]).some(x=>x.client_id===a.client_id&&x.user_id===a.user_id&&x.access_level==='read')
 );
 const maps=(rows.ag_scope_delivery_tasks||[]).filter(m=>m.package_id===latest?.id);
 const allTasks=rows.ag_tasks||[],proof=rows.ag_task_verifications||[];
 const count=latest?.items?.length||0;
 const verified=maps.filter(m=>allTasks.find(t=>t.id===m.task_id)?.status==='done'&&proof.find(e=>e.task_id===m.task_id)?.review_status==='verified').length;
 const source=(rows.ag_project_integrations||[]).find(c=>c.project_id===project.id)||{};
 const keys=new Set(scoped.map(x=>x.component_key));
 const docs=(rows.ag_documents||[]).filter(d=>d.project_id===project.id&&d.visible_to_client);
 const steps=[
  {name:'Business and design brief',good:!!brief?.business_description&&brief.business_description.trim().length>=10,description:'Describe the company, its operations, design direction and users.'},
  {name:'Selected and priced scope',good:scoped.length>0&&scoped.every(c=>pricing.some(p=>p.component_id===c.id)),description:scoped.length+' component(s) selected; every selected component must have a saved price.'},
  {name:'Verified client approver',good:linkedApprovers.length>0,description:linkedApprovers.length?linkedApprovers.length+' designated authorized approver(s) linked.':'Client must verify a portal account with Read & respond access, then be assigned as approver.'},
  {name:'Frozen scope version',good:!!latest,description:latest?'Latest version: v'+latest.version:'Create a versioned proposal after reviewing the scope.'},
  {name:'Published client proposal',good:proposal?.status==='published',description:'Publication makes the frozen proposal available to authorized client users.'},
  {name:'Recorded client acceptance',good:!!accepted,description:decisions[0]?.decision==='changes_requested'?'Client requested changes; prepare a new version.':accepted?'Latest published scope was accepted.':'Awaiting authorized client acceptance.'},
  {name:'Approved delivery tasks generated',good:!!accepted&&count>0&&maps.length===count,description:maps.length+' of '+count+' frozen components have a mapped task.'},
  {name:'Verified delivery completion',good:count>0&&maps.length===count&&verified===count,description:verified+' of '+count+' component tasks marked Done with staff-verified evidence.'}
 ];
 if(keys.has('github'))steps.push({name:'GitHub project source linked',good:!!source.github_repo,description:'Attach the approved repository using existing Project Integrations.'});
 if(keys.has('vercel'))steps.push({name:'Vercel hosting project linked',good:!!source.vercel_project_id,description:'Attach the approved Vercel project using existing Project Integrations.'});
 if(keys.has('handoff')||keys.has('documents'))steps.push({name:'Client handoff file shared',good:docs.length>0,description:docs.length+' client-visible document(s) uploaded.'});
 const invitations=(rows.ag_client_invitations||[]).filter(i=>i.client_id===project.client_id);
 const verifiedMembers=(rows.ag_client_users||[]).filter(m=>m.client_id===project.client_id);
 const activeInvites=invitations.filter(i=>i.accepted_by&&verifiedMembers.some(m=>m.user_id===i.accepted_by));
 const published=(rows.ag_proposals||[]).filter(p=>p.project_id===project.id&&p.status==='published');
 const decisionRecords=(rows.ag_proposal_decisions||[]).filter(d=>published.some(p=>p.id===d.proposal_id));
 const draftScope=packages.length>0?packages[0]:null;
 const acceptedDraft=!!accepted;
 const internalInvoices=(rows.ag_scope_invoice_allocations||[]).filter(a=>a.package_id===draftScope?.id);
 const pilot=[
  {label:'Invitation record',present:invitations.length>0,detail:invitations.length+' recorded invitation(s); an invitation record is not proof an email arrived.',destination:'clients'},
  {label:'Verified client portal membership',present:verifiedMembers.length>0,detail:verifiedMembers.length+' verified member(s) linked to this client; an authenticated browser login has not been tested here.',destination:'clients'},
  {label:'Approver authorization',present:linkedApprovers.length>0,detail:linkedApprovers.length+' eligible authorized approver(s); only verified members with Read & respond access can approve.',destination:'clients'},
  {label:'Published proposal',present:published.length>0,detail:published.length+' published offer(s) on this project; publication does not prove client visibility or email receipt.',destination:'proposals'},
  {label:'Client acceptance record',present:decisionRecords.some(d=>d.decision==='accepted'),detail:decisionRecords.length+' recorded decision(s); this is not a legal e-signature or proof of independent live end-to-end testing.',destination:'proposals'},
  {label:'Accepted delivery task mapping',present:acceptedDraft&&count>0&&maps.length===count,detail:maps.length+' of '+count+' approved scope component tasks mapped; functional QA still requires evidence.',destination:'tasks'},
  {label:'Internal milestone billing draft',present:internalInvoices.length>0,detail:internalInvoices.length+' scope-linked billing draft(s); not proof of a Stripe test, charge or invoice delivery.',destination:'invoices'}
 ];
 const pilotReady=pilot.filter(row=>row.present).length;
 const good=steps.filter(x=>x.good).length;
 return '<section class="card office-readiness" id="office-project-readiness"><div class="section-head"><div><p class="eyebrow">Owner oversight</p><h3>Project Readiness & Delivery Control</h3><p>Evidence-driven progress from selected scope through client approval and verified delivery.</p></div><span class="pill">'+good+' / '+steps.length+' internal checks</span></div>'+
 '<div class="office-readiness-meter" role="progressbar" aria-label="Internal readiness checks completed" aria-valuemin="0" aria-valuemax="'+steps.length+'" aria-valuenow="'+good+'"><span style="width:'+(steps.length?Math.round(good/steps.length*100):0)+'%"></span></div>'+
 '<div class="office-readiness-list">'+steps.map(x=>'<div class="office-readiness-step"><span class="readiness-icon '+(x.good?'good':'pending')+'" aria-hidden="true">'+(x.good?'✓':'○')+'</span><div><strong>'+h(x.name)+'</strong><p class="tiny muted">'+h(x.description)+'</p></div></div>').join('')+'</div>'+
 '<div class="office-pilot-preflight"><div class="section-head"><div><h4>Live Client Pilot — Evidence Checklist</h4><p class="tiny muted">Record-based signals only. This is not a completed end-to-end test or a release authorization.</p></div><span class="pill">'+pilotReady+' of '+pilot.length+' recorded signals</span></div>'+
 '<div class="office-pilot-list">'+pilot.map(x=>'<div class="office-pilot-item"><span class="readiness-icon '+(x.present?'good':'pending')+'" aria-hidden="true">'+(x.present?'✓':'○')+'</span><div><strong>'+h(x.label)+'</strong><p class="tiny muted">'+h(x.detail)+'</p></div><button type="button" class="btn alt small" data-readiness-nav="'+h(x.destination)+'">Open</button></div>').join('')+'</div>'+
 '<p class="tiny muted"><strong>Not automatically verified:</strong> email receipt, login on a real client device, ability to see the published offer, independent client acknowledgment, legal signature, payment provider credentials or transactions, cross-browser usability, and actual deployment functionality. These require controlled tests with an authorized client and supporting evidence.</p></div>'+
 '<p class="tiny muted"><strong>Still requires explicit owner judgment:</strong> real customer login tests, responsive/browser QA, signed contracting where applicable, payment provider credentials and webhooks, live email delivery, security review and permission to deploy. These checks never authorize purchases or production release.</p>'+
 '<div class="action-area"><button type="button" class="btn alt small" data-readiness-nav="proposals">Review proposals</button><button type="button" class="btn alt small" data-readiness-nav="tasks">Review delivery tasks</button><button type="button" class="btn alt small" data-readiness-nav="documents">Review handoff files</button></div></section>';
}
export function projectReadinessWire({root}){
 root.querySelectorAll('[data-readiness-nav]').forEach(button=>button.onclick=()=>{
  root.querySelector('[data-view="'+button.dataset.readinessNav+'"]')?.click();
 });
}
