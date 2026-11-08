import {buildCommandCenterPrompt} from '/js/office-build-prompt.js';
import {asUsd} from '/js/office-component-pricing.js';

// All three outputs originate from one immutable database snapshot.
// The proposal/decision permissions are enforced by Supabase RLS and RPC checks.
export function scopePackagePage({rows,project,escape,staff}) {
 if(!staff)return '';
 const h=escape,packages=(rows.ag_scope_packages||[]).filter(x=>x.project_id===project.id).sort((a,b)=>b.version-a.version);
 const proposals=rows.ag_proposals||[],decisions=rows.ag_proposal_decisions||[],tasks=rows.ag_scope_delivery_tasks||[];
 const itemCount=(rows.ag_project_components||[]).filter(x=>x.project_id===project.id).length;
 const brief=(rows.ag_project_build_briefs||[]).find(x=>x.project_id===project.id);
 const ready=itemCount>0&&!!brief?.business_description?.trim();
 const display=packages.map(pkg=>{
  const proposal=proposals.find(p=>p.id===pkg.proposal_id);
  const history=decisions.filter(d=>d.proposal_id===pkg.proposal_id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  const last=history[0]?.decision||null;
  const accepted=last==='accepted'&&proposal?.status==='published';
  const superseded=packages.some(other=>other.version>pkg.version);
  const assignedMappings=tasks.filter(t=>t.package_id===pkg.id);
  const completedTasks=assignedMappings.length;
  const allTasks=rows.ag_tasks||[];
  const verifiedTasks=assignedMappings.filter(link=>allTasks.find(task=>task.id===link.task_id)?.status==='done').length;
  const n=Array.isArray(pkg.items)?pkg.items.length:0;
  return '<article class="scope-version"><div class="section-head"><div><strong>Scope v'+pkg.version+' · '+h(pkg.title)+'</strong><p class="tiny muted">Frozen '+new Date(pkg.created_at).toLocaleString()+' · '+n+' components · '+asUsd(pkg.estimated_one_time_cents)+' one-time · '+asUsd(pkg.monthly_total_cents)+'/mo</p></div><span class="pill">'+h(accepted?'Client accepted':proposal?.status==='published'?(last==='changes_requested'?'Changes requested':'Awaiting client decision'):'Internal draft')+'</span></div>'+
   '<div class="scope-actions"><button type="button" class="btn alt small" data-package-copy="'+h(pkg.id)+'" data-type="proposal">Copy proposal</button><button type="button" class="btn alt small" data-package-copy="'+h(pkg.id)+'" data-type="build">Copy frozen AI build prompt</button><button type="button" class="btn alt small" data-package-copy="'+h(pkg.id)+'" data-type="plan">Copy delivery checklist</button>'+
   (accepted&&!superseded?'<button type="button" class="btn small" data-package-tasks="'+h(pkg.id)+'">'+(completedTasks?'Sync approved tasks':'Create approved tasks')+'</button>':'')+'</div>'+
   '<p class="tiny muted">'+(completedTasks?verifiedTasks+' / '+completedTasks+' mapped tasks marked done. ':'')+(superseded?'This version has been superseded; a new version requires review and acceptance. ':'')+'Publish the related draft on the Proposals tab. Client acceptance is recorded there; no client is contacted automatically by creating this package.</p></article>';
 }).join('');
 return '<section class="card scope-packages" id="scope-packages"><div class="section-head"><div><h3>Proposal → Build → Delivery</h3><p>One frozen scope version powers all three outputs. Editing checked items later does not silently change an existing proposal.</p></div></div>'+
 '<details class="scope-package-create"><summary>Create a new scope and proposal draft</summary><form id="scope-package-form"><label class="form-field">Proposal name<input required maxlength="160" minlength="3" name="title" value="'+h(project.title+' — Proprietary Platform')+'"></label><label class="form-field">Assumptions and exclusions<textarea name="assumptions" rows="3" maxlength="3500" placeholder="Included revisions, training, dependencies, excluded work, scope overlap, hosting ownership"></textarea></label><label class="form-field">Payment terms<textarea name="payment_terms" rows="2" maxlength="3500" placeholder="Example: 40% deposit, 40% at staging acceptance, 20% on handoff (edit for this engagement)"></textarea></label><label class="form-field">One-time discount ($)<input type="number" name="discount" min="0" max="9999999.99" step="0.01" value="0"></label><button type="submit" class="btn" '+(!ready?'disabled':'')+'>Freeze scope and create draft proposal</button><p class="tiny muted">'+(ready?'This creates an internal draft only. No email, account, invoice, or deployment is created.':'Select and price at least one component, then save the business description first.')+'</p></form></details>'+
 '<div class="scope-actions"><button class="btn alt small" type="button" data-scope-open-proposals>Open Proposals & Client Approval</button></div>'+ 
 '<h4 class="scope-versions-title">Version history</h4>'+(display||'<p class="tiny muted">No frozen scope versions yet. Finish the checklist and create an internal proposal draft.</p>')+
 '<p class="tiny muted">The frozen proposal is published separately under Proposals. A client acceptance is not a legal e-signature or permission to charge; deployment and provider expenses still require owner authorization.</p></section>';
}
export function scopePackageWire({root,rows,project,supabase,notify,reload,staff}){
 if(!staff)return;
 const section=root.querySelector('#scope-packages');if(!section)return;
 const form=section.querySelector('#scope-package-form');
 section.querySelector('[data-scope-open-proposals]')?.addEventListener('click',()=>root.querySelector('[data-view="proposals"]')?.click());
 const packages=rows.ag_scope_packages||[];
 const toDollars=v=>{const n=Number(v);return Number.isFinite(n)&&n>=0&&Number.isSafeInteger(Math.round(n*100))?Math.round(n*100):null;};
 if(form)form.onsubmit=async e=>{
  e.preventDefault();
  const v=Object.fromEntries(new FormData(form));
  const discount=toDollars(v.discount);
  if(discount===null){notify('Enter a valid discount.');return;}
  if(!confirm('Freeze current saved component prices and create a new internal proposal draft? The new version will not change automatically when you edit the checklist.'))return;
  const button=form.querySelector('[type=submit]');button.disabled=true;
  const {data,error}=await supabase.rpc('ag_prepare_scope_package',{p_project_id:project.id,p_title:String(v.title||'').trim(),p_assumptions:String(v.assumptions||'').trim(),p_payment_terms:String(v.payment_terms||'').trim(),p_discount_cents:discount});
  if(error||!data){notify(error?.message||'Could not prepare scope version. Confirm all components have saved prices.');button.disabled=false;return;}
  notify('Frozen scope and draft proposal created. Go to Proposals to review and publish.');await reload();
 };
 const asText=pkg=>{
  const lines=pkg.items.map(item=>'- [ ] '+item.label+' — '+(item.notes||'Confirm detailed acceptance criteria')+' (Qty '+item.quantity+')');
  return ['AI GENTS | DELIVERY CHECKLIST','Project: '+project.title,'Frozen scope: v'+pkg.version,'Package ID: '+pkg.id,
    'Client acceptance required before task creation. Do not claim completion without functional verification.',
    '',...lines,'','Each deliverable requires role-appropriate tests, deployment evidence, handoff documentation and approval as applicable.'].join('\n');
 };
 const toPrompt=pkg=>buildCommandCenterPrompt({
  project,
  items:(pkg.items||[]).map(item=>({project_id:project.id,category:item.category,component_label:item.label,notes:item.notes})),
  brief:{business_description:pkg.business_description,design_direction:pkg.design_direction,audience_roles:pkg.audience_roles,additional_requirements:pkg.additional_requirements}
 })+'\n\nAUTHORITATIVE SCOPE VERSION: '+pkg.version+'\nUse the frozen requirements in this prompt. Changes need a separately approved scope version.';
 section.querySelectorAll('[data-package-copy]').forEach(button=>button.onclick=async()=>{
  const pkg=packages.find(x=>x.id===button.dataset.packageCopy);
  if(!pkg)return;
  const proposal=(rows.ag_proposals||[]).find(p=>p.id===pkg.proposal_id);
  const text=button.dataset.type==='proposal'?(proposal?.scope||'Proposal unavailable'):button.dataset.type==='build'?toPrompt(pkg):asText(pkg);
  try{await navigator.clipboard.writeText(text);notify(button.dataset.type==='proposal'?'Frozen proposal copied.':'Frozen project document copied.');}
  catch{notify('Clipboard access blocked.');}
 });
 section.querySelectorAll('[data-package-tasks]').forEach(button=>button.onclick=async()=>{
  const pkg=packages.find(x=>x.id===button.dataset.packageTasks);if(!pkg)return;
  if(!confirm('Create task records for accepted scope v'+pkg.version+'? Existing mapped tasks will not be duplicated.'))return;
  button.disabled=true;
  const {data,error}=await supabase.rpc('ag_generate_accepted_scope_tasks',{p_package_id:pkg.id});
  if(error){notify(error.message);button.disabled=false;return;}
  notify(data+' new delivery task(s) created from accepted scope v'+pkg.version+'.');await reload();
 });
}
