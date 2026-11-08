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
  {name:'Frozen scope version',good:!!latest,description:latest?'Latest version: v'+latest.version:'Create a versioned proposal after reviewing the scope.'},
  {name:'Published client proposal',good:proposal?.status==='published',description:'Publication makes the frozen proposal available to authorized client users.'},
  {name:'Recorded client acceptance',good:!!accepted,description:decisions[0]?.decision==='changes_requested'?'Client requested changes; prepare a new version.':accepted?'Latest published scope was accepted.':'Awaiting authorized client acceptance.'},
  {name:'Approved delivery tasks generated',good:!!accepted&&count>0&&maps.length===count,description:maps.length+' of '+count+' frozen components have a mapped task.'},
  {name:'Verified delivery completion',good:count>0&&maps.length===count&&verified===count,description:verified+' of '+count+' component tasks marked Done with staff-verified evidence.'}
 ];
 if(keys.has('github'))steps.push({name:'GitHub project source linked',good:!!source.github_repo,description:'Attach the approved repository using existing Project Integrations.'});
 if(keys.has('vercel'))steps.push({name:'Vercel hosting project linked',good:!!source.vercel_project_id,description:'Attach the approved Vercel project using existing Project Integrations.'});
 if(keys.has('handoff')||keys.has('documents'))steps.push({name:'Client handoff file shared',good:docs.length>0,description:docs.length+' client-visible document(s) uploaded.'});
 const good=steps.filter(x=>x.good).length;
 return '<section class="card office-readiness" id="office-project-readiness"><div class="section-head"><div><p class="eyebrow">Owner oversight</p><h3>Project Readiness & Delivery Control</h3><p>Evidence-driven progress from selected scope through client approval and verified delivery.</p></div><span class="pill">'+good+' / '+steps.length+' internal checks</span></div>'+
 '<div class="office-readiness-meter" role="progressbar" aria-label="Internal readiness checks completed" aria-valuemin="0" aria-valuemax="'+steps.length+'" aria-valuenow="'+good+'"><span style="width:'+(steps.length?Math.round(good/steps.length*100):0)+'%"></span></div>'+
 '<div class="office-readiness-list">'+steps.map(x=>'<div class="office-readiness-step"><span class="readiness-icon '+(x.good?'good':'pending')+'" aria-hidden="true">'+(x.good?'✓':'○')+'</span><div><strong>'+h(x.name)+'</strong><p class="tiny muted">'+h(x.description)+'</p></div></div>').join('')+'</div>'+
 '<p class="tiny muted"><strong>Still requires explicit owner judgment:</strong> real customer login tests, responsive/browser QA, signed contracting where applicable, payment provider credentials and webhooks, live email delivery, security review and permission to deploy. These checks never authorize purchases or production release.</p>'+
 '<div class="action-area"><button type="button" class="btn alt small" data-readiness-nav="proposals">Review proposals</button><button type="button" class="btn alt small" data-readiness-nav="tasks">Review delivery tasks</button><button type="button" class="btn alt small" data-readiness-nav="documents">Review handoff files</button></div></section>';
}
export function projectReadinessWire({root}){
 root.querySelectorAll('[data-readiness-nav]').forEach(button=>button.onclick=()=>{
  root.querySelector('[data-view="'+button.dataset.readinessNav+'"]')?.click();
 });
}
