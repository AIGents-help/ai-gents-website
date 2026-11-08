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
  const allocations=(rows.ag_scope_invoice_allocations||[]).filter(a=>a.package_id===pkg.id);
  const matchingInvoices=(rows.ag_invoices||[]).filter(i=>allocations.some(a=>a.invoice_id===i.id));
  const usedCents=matchingInvoices.filter(i=>i.status!=='void').reduce((n,i)=>n+Number(i.amount_cents||0),0);
  const remainingCents=Math.max(0,Number(pkg.estimated_one_time_cents||0)-usedCents);
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
     (remainingCents>0?'<form data-prepare-scope-invoice="'+h(pkg.id)+'"><label class="form-field">Billing milestone name<input name="milestone_label" required minlength="3" maxlength="120" placeholder="Deposit / Staging / Final handoff"></label>'+
       '<label class="form-field">Amount (USD)<input type="number" name="amount" required min="0.01" step="0.01" max="'+(remainingCents/100).toFixed(2)+'" value="'+(remainingCents/100).toFixed(2)+'"></label>'+
       '<label class="form-field">Planned due date (optional)<input type="date" name="due_date"></label>'+
       '<button class="btn alt small" type="submit">Save internal invoice draft</button></form>':'<p class="tiny muted">The accepted one-time total is fully allocated. Create no further draft charges for this version.</p>')+
     '</div></details>':'')+
   '<p class="tiny muted">'+(completedTasks?verifiedTasks+' / '+completedTasks+' mapped tasks marked done. ':'')+(superseded?'This version has been superseded; a new version requires review and acceptance. ':'')+'Publish the related draft on the Proposals tab. Client acceptance is recorded there; no client is contacted automatically by creating this package.</p></article>';
 }).join('');
 return '<section class="card scope-packages" id="scope-packages"><div class="section-head"><div><h3>Proposal → Build → Delivery</h3><p>One frozen scope version powers all three outputs. Editing checked items later does not silently change an existing proposal.</p></div></div>'+
 '<details class="scope-package-create"><summary>Create a new scope and proposal draft</summary><form id="scope-package-form"><label class="form-field">Proposal name<input required maxlength="160" minlength="3" name="title" value="'+h(project.title+' — Proprietary Platform')+'"></label><label class="form-field">Assumptions and exclusions<textarea name="assumptions" rows="11" maxlength="3500" aria-describedby="scope-assumptions-guidance">'+h(DEFAULT_ASSUMPTIONS)+'</textarea><small class="tiny muted" id="scope-assumptions-guidance">Suggested starting terms. Edit for this project before preparing the proposal; obtain legal review where appropriate.</small></label><label class="form-field">Payment terms<textarea name="payment_terms" rows="8" maxlength="3500" aria-describedby="scope-payment-guidance">'+h(DEFAULT_PAYMENT_TERMS)+'</textarea><small class="tiny muted" id="scope-payment-guidance">Example milestone schedule—fully editable. No automatic invoice or charge is created.</small></label><label class="form-field">One-time discount ($)<input type="number" name="discount" min="0" max="9999999.99" step="0.01" value="0"></label><button type="submit" class="btn" '+(!ready?'disabled':'')+'>Freeze scope and create draft proposal</button><p class="tiny muted">'+(ready?'This creates an internal draft only. No email, account, invoice, or deployment is created.':'Select and price at least one component, then save the business description first.')+'</p></form></details>'+
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
 const toDollars=v=>{
  const raw=String(v??'').trim();
  if(!/^\\d+(?:\\.\\d{1,2})?$/.test(raw))return null;
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
 section.querySelectorAll('[data-prepare-scope-invoice]').forEach(form=>form.onsubmit=async event=>{
  event.preventDefault();
  const id=form.dataset.prepareScopeInvoice;
  const pkg=packages.find(x=>x.id===id);
  if(!pkg)return;
  const values=Object.fromEntries(new FormData(form));
  const amountString=String(values.amount||'').trim();
  if(!/^\\d+(?:\\.\\d{1,2})?$/.test(amountString)){notify('Enter a valid USD amount with no more than two decimals.');return;}
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
