import {buildCommandCenterPrompt} from '/js/office-build-prompt.js';
import {asUsd} from '/js/office-component-pricing.js';

// All three outputs originate from one immutable database snapshot.
// The proposal/decision permissions are enforced by Supabase RLS and RPC checks.
// Suggested starting terms, fully editable for every client proposal.
// Commercial examples, not a legal contract or universal industry requirement.
const DEFAULT_ASSUMPTIONS = [
 'Included scope: Only the components and functionality specifically listed in this proposal are included.',
 'Revisions: Up to two consolidated rounds of reasonable design/content revisions before final approval. New features or substantial scope changes require a separately approved estimate or change order.',
 'Client responsibilities: Client provides required content, logos, brand assets, access to approved existing accounts, timely feedback, and one authorized decision-maker.',
 'Schedule: Milestones depend on timely client approvals, content, credentials, and third-party availability. Delays or changed requirements may require schedule adjustments.',
 'Testing and handoff: AI Gents will perform agreed functional checks and provide reasonable administrative orientation and handoff materials for delivered components.',
 'Exclusions unless explicitly listed: Ongoing content creation, major copywriting, data migration, paid advertising, legal/compliance certification, extensive training, post-launch feature development, and integrations outside approved scope.',
 'Third-party services: Hosting, domain renewals, payment processing, email platforms, software subscriptions, usage fees, and taxes are separate unless expressly included. No new account or paid service is authorized by this proposal alone.',
 'Ownership and support: Domain/account ownership, access handoff, post-launch support, maintenance and any source-code/IP transfer are governed by the final written agreement.'
].join('\n\n');

const DEFAULT_PAYMENT_TERMS = [
 '40% deposit upon acceptance of the proposal and before scheduled implementation begins.',
 '40% at delivery of a functional staging build for client review, before production launch.',
 '20% upon final approved handoff or production launch, according to the agreed acceptance criteria.',
 'Invoices are payable within 15 calendar days of issue unless otherwise agreed in writing.',
 'Any recurring AI Gents management/support charges begin only on the agreed service start date and are billed monthly under a separate approved recurring-services arrangement.',
 'Third-party subscriptions, transaction fees and applicable taxes are additional unless expressly included. Changes to scope, price, or milestone schedule require written approval.'
].join('\n\n');

let activeProposalSaveCancel=null;
export const hasUnsavedOfficeProposalDraft=()=>document.querySelector('#scope-package-form')?.dataset.unsaved==='true';
export function cancelPendingOfficeProposalSave(){
 if(activeProposalSaveCancel)activeProposalSaveCancel();
 activeProposalSaveCancel=null;
}
// A schedule suggestion is shown only for explicit, three-stage percentage terms.
export function scopeBillingSuggestions(paymentTerms,oneTimeCents){
 const terms=String(paymentTerms||'');
 const lines=terms.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 const matches=lines.map(line=>line.match(/^(\d{1,3})%\s+(.+)$/)).filter(Boolean);
 if(matches.length!==3||matches.some(m=>Number(m[1])<=0)||matches.reduce((n,m)=>n+Number(m[1]),0)!==100)return [];
 const total=Number(oneTimeCents);
 if(!Number.isSafeInteger(total)||total<=0)return [];
 const cents=matches.map((m,i)=>i===matches.length-1?0:Math.round(total*Number(m[1])/100));
 cents[2]=total-cents[0]-cents[1];
 return matches.map((m,i)=>({
  label:(i===0?'Initial deposit':i===1?'Staging milestone':'Final handoff'),
  note:m[2].slice(0,210),
  percent:Number(m[1]),
  amount_cents:cents[i]
 })).filter(x=>x.amount_cents>0);
}

export function scopePackagePage({rows,project,escape,staff}) {
 if(!staff)return '';
 const h=escape,packages=(rows.ag_scope_packages||[]).filter(x=>x.project_id===project.id).sort((a,b)=>b.version-a.version);
 const proposals=rows.ag_proposals||[],decisions=rows.ag_proposal_decisions||[],tasks=rows.ag_scope_delivery_tasks||[];
 const itemCount=(rows.ag_project_components||[]).filter(x=>x.project_id===project.id).length;
 const brief=(rows.ag_project_build_briefs||[]).find(x=>x.project_id===project.id);
 const workingDraft=(rows.ag_project_proposal_drafts||[]).find(x=>x.project_id===project.id);
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
  const allocations=(rows.ag_scope_invoice_allocations||[]).filter(a=>a.package_id===pkg.id);
  const matchingInvoices=(rows.ag_invoices||[]).filter(i=>allocations.some(a=>a.invoice_id===i.id));
  const usedCents=matchingInvoices.filter(i=>i.status!=='void').reduce((n,i)=>n+Number(i.amount_cents||0),0);
  const remainingCents=Math.max(0,Number(pkg.estimated_one_time_cents||0)-usedCents);
  const schedule=scopeBillingSuggestions(pkg.payment_terms,pkg.estimated_one_time_cents);
  const allocatedLabels=new Set(allocations.map(a=>a.milestone_label));
  const suggestions=schedule.filter(x=>!allocatedLabels.has(x.label)&&x.amount_cents<=remainingCents);
  const suggestedButtons=suggestions.map(x=>'<button class="btn alt small" type="button" data-billing-suggestion="'+h(pkg.id)+'" data-milestone-name="'+h(x.label)+'" data-milestone-cents="'+x.amount_cents+'">'+h(x.label)+' · '+x.percent+'% · '+asUsd(x.amount_cents)+'</button>').join('');
  const invoicePreview=allocations.map(a=>{
    const invoice=matchingInvoices.find(i=>i.id===a.invoice_id);
    return '<div class="scope-invoice-line"><span>'+h(a.milestone_label)+'</span><span>'+asUsd(invoice?.amount_cents||0)+'</span><span class="pill">'+h(invoice?.status||'Record unavailable')+'</span></div>';
  }).join('');
  return '<article class="scope-version"><div class="section-head"><div><strong>Scope v'+pkg.version+' · '+h(pkg.title)+'</strong><p class="tiny muted">Frozen '+new Date(pkg.created_at).toLocaleString()+' · '+n+' components · '+asUsd(pkg.estimated_one_time_cents)+' one-time · '+asUsd(pkg.monthly_total_cents)+'/mo</p></div><span class="pill">'+h(accepted?'Client accepted':proposal?.status==='published'?(last==='changes_requested'?'Changes requested':'Awaiting client decision'):'Internal draft')+'</span></div>'+
   '<div class="scope-actions"><button type="button" class="btn alt small" data-package-copy="'+h(pkg.id)+'" data-type="proposal">Copy proposal</button><button type="button" class="btn alt small" data-package-copy="'+h(pkg.id)+'" data-type="build">Copy frozen AI build prompt</button><button type="button" class="btn alt small" data-package-copy="'+h(pkg.id)+'" data-type="plan">Copy delivery checklist</button>'+
   (accepted&&!superseded?'<button type="button" class="btn small" data-package-tasks="'+h(pkg.id)+'">'+(completedTasks?'Sync approved tasks':'Create approved tasks')+'</button>':'')+'</div>'+
   (accepted&&!superseded?'<details class="scope-invoice-drafts"><summary>Prepare approved billing drafts · '+asUsd(remainingCents)+' remaining</summary><div class="scope-invoice-content">'+
     '<p class="tiny muted">Internal invoice draft only. No Stripe invoice, message or payment is created. Review the accepted payment schedule before allocating milestone charges.</p>'+
     (invoicePreview?'<div class="scope-invoice-list">'+invoicePreview+'</div>':'')+
     (remainingCents>0?'<div class="scope-payment-reference"><strong>Accepted payment terms</strong><p>'+h(pkg.payment_terms||'No payment schedule specified. Enter an amount only after reviewing the client agreement.')+'</p>'+
      (suggestedButtons?'<p class="tiny muted">Select a suggested milestone to fill the editable draft. These percentages come from the accepted proposal; no invoice is generated until you save.</p><div class="action-area">'+suggestedButtons+'</div>':'<p class="tiny muted">No automatic amount suggested. Confirm the accepted schedule and previously prepared milestones before entering a charge.</p>')+'</div>'+
      '<form data-prepare-scope-invoice="'+h(pkg.id)+'"><label class="form-field">Billing milestone name<input name="milestone_label" required minlength="3" maxlength="120" placeholder="Deposit / Staging / Final handoff"></label>'+
       '<label class="form-field">Amount (USD)<input type="number" name="amount" required min="0.01" step="0.01" max="'+(remainingCents/100).toFixed(2)+'" placeholder="Enter agreed milestone amount"></label>'+
       '<label class="form-field">Planned due date (optional)<input type="date" name="due_date"></label>'+
       '<button class="btn alt small" type="submit">Save internal invoice draft</button></form>':'<p class="tiny muted">The accepted one-time total is fully allocated. Create no further draft charges for this version.</p>')+
     '</div></details>':'')+
   '<p class="tiny muted">'+(completedTasks?verifiedTasks+' / '+completedTasks+' mapped tasks marked done. ':'')+(superseded?'This version has been superseded; a new version requires review and acceptance. ':'')+'Publish the related draft on the Proposals tab. Client acceptance is recorded there; no client is contacted automatically by creating this package.</p></article>';
 }).join('');
 return '<section class="card scope-packages" id="scope-packages"><div class="section-head"><div><h3>Proposal → Build → Delivery</h3><p>One frozen scope version powers all three outputs. Editing checked items later does not silently change an existing proposal.</p></div></div>'+
 '<details class="scope-package-create"><summary>Prepare client proposal</summary><form id="scope-package-form"><p class="tiny muted">These details are saved privately to this project while you work. Nothing is sent to the client until you publish a completed proposal.</p><label class="form-field">Proposal name<input required maxlength="160" minlength="3" name="title" value="'+h(workingDraft?.title??(project.title+' — Proprietary Platform'))+'"></label><label class="form-field">Assumptions and exclusions<textarea name="assumptions" rows="11" maxlength="3500" aria-describedby="scope-assumptions-guidance" >'+h(workingDraft?.assumptions??DEFAULT_ASSUMPTIONS)+'</textarea><small class="tiny muted" id="scope-assumptions-guidance">Suggested starting terms. Edit for this project before preparing the proposal; obtain legal review where appropriate.</small></label><label class="form-field">Payment terms<textarea name="payment_terms" rows="8" maxlength="3500" aria-describedby="scope-payment-guidance" >'+h(workingDraft?.payment_terms??DEFAULT_PAYMENT_TERMS)+'</textarea><small class="tiny muted" id="scope-payment-guidance">Example milestone schedule—fully editable. No automatic invoice or charge is created.</small></label><label class="form-field">One-time discount ($)<input type="number" name="discount" min="0" max="9999999.99" step="0.01" value="'+h((Number(workingDraft?.discount_cents||0)/100).toFixed(2))+'"></label><div class="scope-proposal-actions"><button type="button" class="btn alt small" id="scope-save-working-draft">Save proposal details</button><button type="button" class="btn alt small" id="scope-preview-working-draft">Preview offer</button><span class="tiny muted" id="scope-draft-save-status" role="status">'+(workingDraft?'Saved previously · edit to update':'Standard starting terms · not yet saved')+'</span></div><div id="scope-working-preview" hidden></div><button type="submit" class="btn" '+(!ready?'disabled':'')+'>Freeze scope and create draft proposal</button><p class="tiny muted">'+(ready?'This creates an internal draft only. No email, account, invoice, or deployment is created.':'Select and price at least one component, then save the business description first.')+'</p></form></details>'+
 '<div class="scope-actions"><button class="btn alt small" type="button" data-scope-open-proposals>Open Proposals & Client Approval</button></div>'+ 
 '<h4 class="scope-versions-title">Version history</h4>'+(display||'<p class="tiny muted">No frozen scope versions yet. Finish the checklist and create an internal proposal draft.</p>')+
 '<p class="tiny muted">The frozen proposal is published separately under Proposals. A client acceptance is not a legal e-signature or permission to charge; deployment and provider expenses still require owner authorization.</p></section>';
}
export function scopePackageWire({root,rows,project,supabase,notify,reload,staff,userId}){
 if(!staff)return;
 const section=root.querySelector('#scope-packages');if(!section)return;
 const form=section.querySelector('#scope-package-form');
 const draftStatus=section.querySelector('#scope-draft-save-status');
 let lastSavedDraft=null,saveTimer=null,saveInFlight=null;
 activeProposalSaveCancel=()=>{if(saveTimer){clearTimeout(saveTimer);saveTimer=null;}};
 const values=()=>{
  const d=Object.fromEntries(new FormData(form));
  return {title:String(d.title||'').trim(),assumptions:String(d.assumptions||'').trim(),payment_terms:String(d.payment_terms||'').trim(),discount:String(d.discount??'').trim()};
 };
 const toCents=v=>{
  const raw=String(v??'').trim();
  if(!/^\d+(?:\.\d{1,2})?$/.test(raw))return null;
  const number=Number(raw);
  return Number.isFinite(number)&&number>=0&&number<=9999999.99?Math.round(number*100):null;
 };
 const validDraft=v=>v.title.length>=3&&v.title.length<=160&&
   v.assumptions.length<=3500&&v.payment_terms.length<=3500&&toCents(v.discount)!==null;
 const serial=v=>JSON.stringify(v);
 if(form){
  lastSavedDraft=(rows.ag_project_proposal_drafts||[]).some(d=>d.project_id===project.id)?serial(values()):null;
 }
 const updateDraftStatus=()=>{
  if(!form)return;
  const changed=lastSavedDraft!==serial(values());
  form.dataset.unsaved=changed?'true':'false';
  if(draftStatus)draftStatus.textContent=changed?'Unsaved changes — saving when you finish typing':'Proposal details saved for this project';
 };
 const saveDraft=async(force=false)=>{
  if(!form||!staff)return false;
  if(saveTimer){clearTimeout(saveTimer);saveTimer=null;}
  if(saveInFlight)await saveInFlight;
  const snapshot=values();
  if(!validDraft(snapshot)){
   if(draftStatus)draftStatus.textContent='Complete the proposal name and use a valid discount before saving.';
   return false;
  }
  if(!force&&serial(snapshot)===lastSavedDraft)return true;
  if(draftStatus)draftStatus.textContent='Saving proposal details…';
  const task=(async()=>{
   const {error}=await supabase.from('ag_project_proposal_drafts').upsert({
    project_id:project.id,title:snapshot.title,
    assumptions:snapshot.assumptions,payment_terms:snapshot.payment_terms,
    discount_cents:toCents(snapshot.discount),updated_by:userId
   },{onConflict:'project_id'});
   if(error){if(draftStatus)draftStatus.textContent='Save failed — '+error.message;return false;}
   lastSavedDraft=serial(snapshot);
   updateDraftStatus();
   return true;
  })();
  saveInFlight=task;
  try{return await task;}finally{if(saveInFlight===task)saveInFlight=null;}
 };
 if(form){
  form.addEventListener('input',()=>{
   updateDraftStatus();
   if(saveTimer)clearTimeout(saveTimer);
   saveTimer=setTimeout(()=>{void saveDraft();},1100);
   const preview=section.querySelector('#scope-working-preview');
   if(preview&&!preview.hidden)renderDraftPreview();
  });
  form.addEventListener('change',()=>{
   if(saveTimer)clearTimeout(saveTimer);
   saveTimer=setTimeout(()=>{void saveDraft();},250);
  });
  section.querySelector('#scope-save-working-draft')?.addEventListener('click',async()=>{
   const ok=await saveDraft(true);
   notify(ok?'Proposal details saved privately for this project.':'Proposal details were not saved; check the fields and retry.');
  });
 }
 const renderDraftPreview=()=>{
  const preview=section.querySelector('#scope-working-preview');
  if(!preview||!form)return;
  const d=values(),components=(rows.ag_project_components||[]).filter(c=>c.project_id===project.id);
  const pricing=rows.ag_component_pricing||[];
  const lines=components.map(c=>{
   const p=pricing.find(r=>r.component_id===c.id),qty=Number(p?.quote_quantity)||1;
   return {label:c.component_label,qty,setup:Number(p?.setup_fee_cents||0)*qty,monthly:Number(p?.monthly_fee_cents||0)*qty,missing:!p};
  });
  const one=lines.reduce((sum,l)=>sum+l.setup,0),monthly=lines.reduce((sum,l)=>sum+l.monthly,0);
  const discount=toCents(d.discount);
  preview.innerHTML='<div class="scope-preview-card"><h4>Internal proposal preview — not sent</h4>'+
   '<p><strong>'+escape(d.title||'Untitled proposal')+'</strong></p>'+
   '<p class="tiny muted">Project: '+escape(project.title)+' · '+lines.length+' selected component(s)</p>'+
   '<div class="scope-preview-items">'+lines.map(l=>'<div><span>'+escape(l.label)+(l.qty>1?' × '+l.qty:'')+'</span><span>'+asUsd(l.setup)+'</span><span>'+asUsd(l.monthly)+'/mo</span></div>').join('')+'</div>'+
   '<div class="scope-preview-totals"><strong>Setup subtotal: '+asUsd(one)+'</strong><span>Discount: '+(discount===null?'Invalid':asUsd(discount))+'</span><strong>Estimated one-time offer: '+(discount===null||discount>one?'Review discount':asUsd(one-discount))+'</strong><span>AI Gents recurring: '+asUsd(monthly)+'/mo</span></div>'+
   '<details><summary>Review assumptions and payment terms</summary><h5>Assumptions and exclusions</h5><p class="scope-preview-terms">'+escape(d.assumptions)+'</p><h5>Payment terms</h5><p class="scope-preview-terms">'+escape(d.payment_terms)+'</p></details>'+
   (lines.some(l=>l.missing)?'<p class="tiny muted">At least one selected component is missing saved pricing. Save component fees first.</p>':'')+
   '<p class="tiny muted">This is an internal preview from the current project screen, not an accepted contract, invoice, or published proposal.</p></div>';
 };
 section.querySelector('#scope-preview-working-draft')?.addEventListener('click',()=>{
  const preview=section.querySelector('#scope-working-preview');
  if(!preview)return;
  preview.hidden=!preview.hidden;
  if(!preview.hidden)renderDraftPreview();
 });

 section.querySelector('[data-scope-open-proposals]')?.addEventListener('click',()=>root.querySelector('[data-view="proposals"]')?.click());
 const packages=rows.ag_scope_packages||[];
 const toDollars=v=>{
  const raw=String(v??'').trim();
  if(!/^\d+(?:\.\d{1,2})?$/.test(raw))return null;
  const n=Number(raw);
  return Number.isFinite(n)&&n>=0&&n<=9999999.99?Math.round(n*100):null;
 };
 const snapshotQuote=()=>{
  const components=(rows.ag_project_components||[]).filter(c=>c.project_id===project.id);
  const prices=rows.ag_component_pricing||[];
  return components.map(c=>{
   const p=prices.find(item=>item.component_id===c.id);
   return {
    id:c.id,key:c.component_key,status:c.status,
    updated_at:p?.updated_at||null,
    setup_fee_cents:p?.setup_fee_cents??null,
    monthly_fee_cents:p?.monthly_fee_cents??null,
    third_party_monthly_cents:p?.third_party_monthly_cents??null,
    quote_quantity:p?.quote_quantity??null
   };
  }).sort((a,b)=>a.id.localeCompare(b.id));
 };
 if(form)form.onsubmit=async e=>{
  e.preventDefault();
  const v=Object.fromEntries(new FormData(form));
  if(!await saveDraft()){notify('Save proposal details first. No proposal was created.');return;}
  const discount=toDollars(v.discount);
  if(discount===null){notify('Enter a valid discount.');return;}
  if(root.querySelector('#component-live-estimate')?.dataset.pendingChanges==='true'){
   notify('Save or discard pending estimate changes before freezing the proposal.');
   root.querySelector('#component-live-estimate').open=true;
   return;
  }
  const current=snapshotQuote();
  if(!current.length||current.some(item=>!item.updated_at)){
   notify('Some components have no saved pricing. Save their fees before preparing a proposal.');
   return;
  }
  if(!confirm('Freeze current saved component prices and create a new internal proposal draft? The new version will not change automatically when you edit the checklist.'))return;
  const button=form.querySelector('[type=submit]');button.disabled=true;
  const {data,error}=await supabase.rpc('ag_prepare_scope_package',{p_project_id:project.id,p_title:String(v.title||'').trim(),p_assumptions:String(v.assumptions||'').trim(),p_payment_terms:String(v.payment_terms||'').trim(),p_discount_cents:discount,p_expected_quote:current});
  if(error||!data){
   const issue=error?.message||'Could not prepare scope version.';
   notify(issue+' No proposal was created. Refresh the project and review saved prices before retrying.');
   button.disabled=false;
   return;
  }
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
 section.querySelectorAll('[data-billing-suggestion]').forEach(button=>button.onclick=()=>{
  const form=section.querySelector('[data-prepare-scope-invoice="'+button.dataset.billingSuggestion+'"]');
  if(!form)return;
  const cents=Number(button.dataset.milestoneCents);
  if(!Number.isSafeInteger(cents)||cents<=0)return;
  const amount=form.querySelector('[name="amount"]');
  const label=form.querySelector('[name="milestone_label"]');
  if(!amount||!label||Number(amount.max)*100<cents)return;
  amount.value=(cents/100).toFixed(2);
  label.value=button.dataset.milestoneName;
  amount.dispatchEvent(new Event('input',{bubbles:true}));
  notify('Suggested milestone filled. Review the accepted payment terms, amount, and due date before saving.');
 });
 section.querySelectorAll('[data-prepare-scope-invoice]').forEach(form=>form.onsubmit=async event=>{
  event.preventDefault();
  const id=form.dataset.prepareScopeInvoice;
  const pkg=packages.find(x=>x.id===id);
  if(!pkg)return;
  const values=Object.fromEntries(new FormData(form));
  const amountString=String(values.amount||'').trim();
  if(!/^\d+(?:\.\d{1,2})?$/.test(amountString)){notify('Enter a valid USD amount with no more than two decimals.');return;}
  const amount=Math.round(Number(amountString)*100);
  if(!Number.isSafeInteger(amount)||amount<=0){notify('Enter a positive milestone amount.');return;}
  const label=String(values.milestone_label||'').trim();
  if(label.length<3||label.length>120){notify('Enter a milestone description of 3–120 characters.');return;}
  if(!confirm('Prepare an internal draft for '+label+' at '+asUsd(amount)+' against accepted scope v'+pkg.version+'? Nothing will be sent or charged.'))return;
  const button=form.querySelector('[type=submit]');button.disabled=true;
  const {data,error}=await supabase.rpc('ag_prepare_scope_invoice_draft',{p_package_id:pkg.id,p_milestone_label:label,p_amount_cents:amount,p_due_date:values.due_date||null});
  if(error||!data){notify(error?.message||'Unable to prepare billing draft.');button.disabled=false;return;}
  notify('Internal billing draft saved. Review it under Billing before any payment setup.');await reload();
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
