import {buildCommandCenterPrompt} from '/js/office-build-prompt.js';
import {pricingFor,asUsd,quoteTotals,quoteText} from '/js/office-component-pricing.js';
// AI Gents project scope: standard component catalog + custom scope.
// A checked component means "requested/in scope"; delivery status is tracked separately.
// Nothing here provisions a service, account, repository, deployment, or subscription.
// Keep accordion choices for each project while The Office refreshes after a save.
// Only users clicking a summary change this state: selections must not collapse panels.
const openPanels=new Map();
export const CATALOG=[
 {group:'Experience',items:[
  ['website','Public website / landing pages'],['branding','Brand identity & design system'],['responsive','Mobile-responsive design'],['content','Content & page management'],['forms','Lead capture & digital forms'],['portal','Customer / member portal'],['login','User login & profiles'],['roles','User roles and permissions'],['accessibility','Accessibility review'],['seo','Search optimization & indexing'],['analytics','Visitor analytics & conversion tracking']]},
 {group:'Operations',items:[
  ['admin','Admin control dashboard'],['crm','CRM & contact management'],['pipeline','Sales / lead pipeline'],['workflow','Workflow & approvals'],['tasks','Tasks & project management'],['documents','Documents & file storage'],['scheduling','Calendar / bookings'],['notifications','Notifications & activity alerts'],['reporting','Reports & KPI dashboards'],['automation','Business process automation'],['ai_assistant','AI assistant / guided workflows'],['integrations','External system integrations']]},
 {group:'Commerce',items:[
  ['stripe','Stripe payment processing'],['invoices','Invoices / billing'],['subscriptions','Recurring memberships / subscriptions'],['checkout','Checkout / customer payments'],['catalog','Products / services catalog'],['tax','Tax / financial compliance review']]},
 {group:'Infrastructure',items:[
  ['supabase','Supabase database / authentication'],['github','GitHub repository / version control'],['vercel','Vercel deployment / hosting'],['domain','Domain and DNS configuration'],['storage','Private storage and backups'],['security','Security / permissions / audit'],['monitoring','Error monitoring / uptime'],['handoff','Admin training and handoff']]},
 {group:'Marketing',items:[
  ['resend','Resend transactional email'],['kit','Kit email campaigns'],['smartlead','Smartlead outreach campaigns'],['newsletter','Newsletter / subscriber management'],['email_templates','Branded email templates'],['reviews','Reviews / testimonials'],['social','Social / publishing integrations'],['consent','Consent / unsubscribe / deliverability controls']]}
];
export function componentsPage({rows,project,escape,staff,teamRole,userId}){
 const h=escape,prices=rows.ag_component_pricing||[],items=(rows.ag_project_components||[]).filter(x=>x.project_id===project.id).map(x=>({...x,...(prices.find(p=>p.component_id===x.id)||{})})),
 assignments=rows.ag_team_assignments||[],brief=(rows.ag_project_build_briefs||[]).find(x=>x.project_id===project.id)||{};
 const canUpdate=staff||!!teamRole&&assignments.some(a=>a.project_id===project.id&&a.user_id===userId&&a.access_level==='write');
 const counts={selected:items.length,done:items.filter(x=>x.status==='completed').length,blocked:items.filter(x=>x.status==='blocked').length};
 const statusLabel={planned:'Not started',in_progress:'In progress',blocked:'Blocked',completed:'Completed'};
 const totals=quoteTotals(items);
 const renderItem=(key,label,group,existing)=>{
  const checked=!!existing;
  const input=staff?'<input type="checkbox" data-scope-key="'+h(key)+'" data-scope-label="'+h(label)+'" data-scope-group="'+h(group)+'" '+(checked?'checked':'')+' aria-label="Include '+h(label)+'">':'<span class="pill">'+(checked?'Included':'Not selected')+'</span>';
  const status=checked?'<select class="small-status" data-component-status="'+h(existing.id)+'" aria-label="Delivery status of '+h(label)+'" '+(!canUpdate?'disabled':'')+'>'+Object.entries(statusLabel).map(([value,text])=>'<option value="'+value+'" '+(existing.status===value?'selected':'')+'>'+text+'</option>').join('')+'</select>':'<span class="tiny muted">Not in scope</span>';
  const defaultFees=pricingFor(key);
  const price=checked?(staff?'<details class="component-fees" data-accordion-key="fee:'+h(existing.id)+'"><summary>Fees · '+asUsd(existing.setup_fee_cents||0)+' setup / '+asUsd(existing.monthly_fee_cents||0)+' monthly</summary>'+priceInputs(existing,h)+'</details>':''):(staff?'<span class="tiny muted component-estimate">Estimate: '+asUsd(defaultFees.setup_fee_cents)+'</span>':'');
  const note=checked&&staff?'<details class="component-notes"><summary>Notes</summary><textarea rows="2" maxlength="3000" aria-label="Notes for '+h(label)+'" data-component-notes="'+h(existing.id)+'" placeholder="Requirements, dependencies or acceptance criteria">'+h(existing.notes||'')+'</textarea><button type="button" class="btn alt small" data-component-save-note="'+h(existing.id)+'">Save note</button></details>':checked&&existing.notes?'<p class="tiny muted">'+h(existing.notes)+'</p>':'';
  return '<div class="component-line '+(checked?'is-scoped':'')+'"><div class="component-main"><label class="component-label">'+input+'<span>'+h(label)+'</span></label>'+status+'</div>'+price+note+'</div>';
 };
 const priceInputs=(record,esc)=>'<div class="component-pricing" data-component-pricing="'+esc(record.id)+'">'+
 '<label>Setup fee ($)<input type="number" min="0" max="9999999.99" step="0.01" data-price-setup value="'+(Number(record.setup_fee_cents||0)/100).toFixed(2)+'"></label>'+
 '<label>Monthly fee ($)<input type="number" min="0" max="9999999.99" step="0.01" data-price-monthly value="'+(Number(record.monthly_fee_cents||0)/100).toFixed(2)+'"></label>'+
 '<label>External / mo. ($)<input type="number" min="0" max="9999999.99" step="0.01" data-price-external placeholder="TBD" value="'+(record.third_party_monthly_cents==null?'':(Number(record.third_party_monthly_cents)/100).toFixed(2))+'"></label>'+
 '<label>Qty<input type="number" min="1" max="1000" step="1" data-price-quantity value="'+(Number(record.quote_quantity)||1)+'"></label>'+
 '<button type="button" class="btn alt small" data-save-component-price="'+esc(record.id)+'">Save fees</button></div>';
 const sections=CATALOG.map(g=>{const count=g.items.filter(([key])=>items.some(x=>x.item_type==='standard'&&x.component_key===key)).length;return '<details class="component-group component-category" data-accordion-key="category:'+h(g.group)+'"><summary class="component-category-heading"><span>'+h(g.group)+'</span><span class="pill">'+count+' selected / '+g.items.length+'</span></summary><div class="component-group-body">'+g.items.map(([key,label])=>renderItem(key,label,g.group,items.find(x=>x.component_key===key&&x.item_type==='standard'))).join('')+'</div></details>';}).join('');
 const custom=items.filter(x=>x.item_type==='custom');
 return '<section class="card component-checklist" id="project-component-scope">'+
 '<div class="section-head"><div><h3>Project components & scope</h3><p>Choose requested standard components, add custom requirements, then track actual completion separately.</p></div></div>'+
 '<div class="grid component-summary"><div class="card"><p class="eyebrow">In scope</p><div class="stat">'+counts.selected+'</div></div><div class="card"><p class="eyebrow">Completed</p><div class="stat">'+counts.done+' / '+counts.selected+'</div></div><div class="card"><p class="eyebrow">Blocked</p><div class="stat">'+counts.blocked+'</div></div></div>'+
 '<p class="tiny muted">A checked box means the client wants this component or it is included in the agreed scope. It does <strong>not</strong> mean the service is connected, purchased, deployed or working. Only mark Completed after verifying delivery.</p>'+
'<div class="component-groups">'+sections+'</div>'+
 '<details class="component-group component-category" data-accordion-key="category:Custom"><summary class="component-category-heading"><span>Custom components</span><span class="pill">'+custom.length+' selected</span></summary><div class="component-group-body">'+
 (custom.length?custom.map(x=>'<div class="component-line is-scoped"><div class="component-main"><strong>'+h(x.component_label)+'</strong><div class="action-area"><select class="small-status" data-component-status="'+h(x.id)+'" aria-label="Custom component status" '+(!canUpdate?'disabled':'')+'>'+Object.entries(statusLabel).map(([value,label])=>'<option value="'+value+'" '+(x.status===value?'selected':'')+'>'+label+'</option>').join('')+'</select>'+(staff?'<button type="button" class="btn alt small" data-remove-component="'+h(x.id)+'">Remove</button>':'')+'</div></div>'+(staff?'<details class="component-fees" data-accordion-key="fee:'+h(x.id)+'"><summary>Fees · '+asUsd(x.setup_fee_cents||0)+' setup / '+asUsd(x.monthly_fee_cents||0)+' monthly</summary>'+priceInputs(x,h)+'</details><details class="component-notes"><summary>Notes</summary><textarea rows="2" maxlength="3000" data-component-notes="'+h(x.id)+'">'+h(x.notes||'')+'</textarea><button type="button" class="btn alt small" data-component-save-note="'+h(x.id)+'">Save note</button></details>':x.notes?'<p class="tiny muted">'+h(x.notes)+'</p>':'')+'</div>').join(''):'<p class="tiny muted">No custom components selected.</p>')+
 (staff?'<form id="custom-component-form" class="custom-component-form"><label class="form-field">Add a unique requirement<input name="label" required maxlength="150" minlength="2" placeholder="Describe the custom feature or integration"></label><button class="btn alt small" type="submit">+ Add custom</button></form>':'')+'</div></details>'+
 (staff?'<section class="component-quote component-quote-footer" aria-label="Staff-only live estimate" id="component-live-estimate"><div class="section-head"><div><h3>Internal Estimate — Selected Components</h3><p class="tiny muted">Staff only · Draft, not a sent invoice. Values reflect the current selection and fee edits.</p></div><button type="button" class="btn alt small" id="component-copy-quote" '+(!items.length?'disabled':'')+'>Copy itemized estimate</button></div>'+
 '<div class="component-quote-lines" id="component-estimate-lines"></div>'+
 '<div class="component-quote-values"><div><span>One-time implementation</span><strong id="estimate-setup-total">'+asUsd(totals.once)+'</strong></div><div><span>AI Gents / month</span><strong id="estimate-monthly-total">'+asUsd(totals.monthly)+'</strong></div><div><span>Third-party / month (known)</span><strong id="estimate-external-total">'+asUsd(totals.external)+'</strong></div><div><span>Provider costs TBD</span><strong id="estimate-external-unknown">'+totals.unknownExternal+' item(s)</strong></div></div>'+
 '<p class="component-estimate-year">Estimated first-year AI Gents fees: <strong id="estimate-year-total">'+asUsd(totals.once+totals.monthly*12)+'</strong></p>'+
 '<p class="tiny muted" id="component-estimate-state" role="status">Figures update as components are selected and fees are edited. Save fees to persist changes before copying or sending a proposal.</p>'+
 '<p class="tiny muted">Third-party plans and processing fees are separate. Confirm scope overlap, taxes, and final pricing before issuing an approved client proposal or invoice.</p></section>':'')+
 (staff?'<details class="component-build-generator" data-accordion-key="generator" id="command-center-generator"><summary><span>Generate Client Command Center Build Prompt</span><span class="pill">'+items.length+' selected</span></summary><div class="component-generator-body"><p class="tiny muted">Combine the selected components with the business and design direction into a development prompt. This does not create or deploy software.</p><form id="component-build-brief">'+
'<label class="form-field">What does the business do?<textarea name="business_description" rows="3" required maxlength="5000" placeholder="Industry, services, customers, and business operations">'+h(brief.business_description||'')+'</textarea></label>'+
'<label class="form-field">Design aesthetics<textarea name="design_direction" rows="2" maxlength="3000" placeholder="Colors, style, fonts, references, tone">'+h(brief.design_direction||'')+'</textarea></label>'+
'<label class="form-field">Who needs access?<textarea name="audience_roles" rows="2" maxlength="2000" placeholder="Owner, staff, customers, contractors, etc.">'+h(brief.audience_roles||'')+'</textarea></label>'+
'<label class="form-field">Additional requirements<textarea name="additional_requirements" rows="2" maxlength="4000" placeholder="Existing systems, compliance, special workflows or exclusions">'+h(brief.additional_requirements||'')+'</textarea></label>'+
'<div class="action-area"><button class="btn alt small" type="submit">Save brief</button><button class="btn small" type="button" id="component-generate-prompt" '+(!items.length?'disabled':'')+'>Generate build prompt</button><button class="btn alt small" type="button" id="component-copy-prompt" hidden>Copy prompt</button></div></form><label class="form-field" id="component-prompt-output-wrap" hidden>Generated development prompt<textarea id="component-prompt-output" rows="13" readonly></textarea></label></div></details>':'')+
 '<p class="tiny muted">Only AI Gents internal staff can change the agreed scope. Assigned employees and contractors with Write access can update delivery statuses but cannot add or remove components.</p></section>';
}
export function componentsWire({root,supabase,rows,project,staff,teamRole,userId,reload,notify}){
 const scope=root.querySelector('#project-component-scope');if(!scope)return;
 const projectPanels=openPanels.get(project.id)||new Map();
 if(!openPanels.has(project.id))openPanels.set(project.id,projectPanels);
 // Browser-native details: only an explicit user toggle changes the desired state.
 // Restore before attaching listeners to avoid treating restoration as a user action.
 const accordions=scope.querySelectorAll('details[data-accordion-key]');
 accordions.forEach(panel=>{
  const key=panel.dataset.accordionKey;
  if(projectPanels.has(key))panel.open=projectPanels.get(key);
 });
 accordions.forEach(panel=>panel.addEventListener('toggle',()=>{
  // Ignore delayed toggle events from a panel that has already been detached.
  if(panel.isConnected)projectPanels.set(panel.dataset.accordionKey,panel.open);
 }));
 const refreshWithoutJump=async()=>{
  // Snapshot immediately: a fast checkbox click can precede the async
  // details.toggle event, but the user's current open/closed state is definitive.
  accordions.forEach(panel=>projectPanels.set(panel.dataset.accordionKey,panel.open));
  const top=window.scrollY;
  await reload();
  window.scrollTo({top,left:0,behavior:'auto'});
 };
 const write=staff||!!teamRole&&(rows.ag_team_assignments||[]).some(a=>a.user_id===userId&&a.project_id===project.id&&a.access_level==='write');
 const save=async(prompt,op,element)=>{
  if(element)element.disabled=true;
  const {error}=await op;
  if(error){notify(error.message);if(element)element.disabled=false;return;}
  notify(prompt);await refreshWithoutJump();
 };
 const buildForm=scope.querySelector('#component-build-brief');
 if(buildForm){
  const getBrief=()=>Object.fromEntries(new FormData(buildForm));
  buildForm.onsubmit=async e=>{
   e.preventDefault();
   const button=buildForm.querySelector('[type=submit]');
   await save('Business brief saved.',supabase.from('ag_project_build_briefs').upsert({project_id:project.id,...getBrief(),updated_by:userId,updated_at:new Date().toISOString()},{onConflict:'project_id'}),button);
  };
  scope.querySelector('#component-generate-prompt').onclick=async()=>{
   const brief=getBrief();
   if(!String(brief.business_description||'').trim()){notify('Describe the business first.');buildForm.elements.business_description.focus();return;}
   const selected=(rows.ag_project_components||[]).filter(x=>x.project_id===project.id);
   if(!selected.length){notify('Select at least one component first.');return;}
   const output=scope.querySelector('#component-prompt-output');
   output.value=buildCommandCenterPrompt({project,items:selected,brief});
   scope.querySelector('#component-prompt-output-wrap').hidden=false;
   scope.querySelector('#component-copy-prompt').hidden=false;
   const {error}=await supabase.from('ag_project_build_briefs').upsert({project_id:project.id,...brief,updated_by:userId,updated_at:new Date().toISOString()},{onConflict:'project_id'});
   notify(error?'Build prompt generated, but the business brief could not be saved: '+error.message:'Build prompt generated and business brief saved. Review before using in your development AI.');
  };
  scope.querySelector('#component-copy-prompt').onclick=async()=>{
   const output=scope.querySelector('#component-prompt-output');
   try{await navigator.clipboard.writeText(output.value);notify('Build prompt copied.');}
   catch{output.focus();output.select();notify('Select and copy the prompt manually.');}
  };
 }
 const centsFrom=value=>{
  if(value===''||value==null)return null;
  const n=Number(value);
  if(!Number.isFinite(n)||n<0||n>9999999.99||!/^\d+(?:\.\d{1,2})?$/.test(String(value)))throw new Error('Use a valid nonnegative USD amount with at most two decimal places.');
  return Math.round(n*100);
 };
 scope.querySelectorAll('[data-save-component-price]').forEach(b=>b.onclick=async()=>{
  if(!staff)return;
  const fields=scope.querySelector('[data-component-pricing="'+b.dataset.saveComponentPrice+'"]');
  if(!fields)return;
  try{
   const setup_fee_cents=centsFrom(fields.querySelector('[data-price-setup]').value);
   const monthly_fee_cents=centsFrom(fields.querySelector('[data-price-monthly]').value);
   const third_party_monthly_cents=centsFrom(fields.querySelector('[data-price-external]').value);
   const quantity=Number(fields.querySelector('[data-price-quantity]').value);
   if(setup_fee_cents===null||monthly_fee_cents===null||!Number.isSafeInteger(quantity)||quantity<1||quantity>1000)throw new Error('Setup, monthly fee and quantity are required.');
   await save('Draft pricing saved; nothing was invoiced or sent.',supabase.from('ag_component_pricing').upsert({component_id:b.dataset.saveComponentPrice,setup_fee_cents,monthly_fee_cents,third_party_monthly_cents,quote_quantity:quantity,updated_by:userId,updated_at:new Date().toISOString()},{onConflict:'component_id'}),b);
  }catch(err){notify(err.message||'Invalid amount');}
 });

 // An internal estimate preview, not a Stripe invoice. Only privileged staff
 // receive pricing rows and may view this section.
 const estimate=scope.querySelector('#component-live-estimate');
 const getPreviewItems=()=>{
  const saved=(rows.ag_project_components||[]).filter(i=>i.project_id===project.id)
   .map(i=>({...i,...((rows.ag_component_pricing||[]).find(p=>p.component_id===i.id)||{})}));
  const checks=[...scope.querySelectorAll('[data-scope-key]')];
  const preview=[];
  for(const check of checks){
   if(!check.checked)continue;
   const found=saved.find(i=>i.component_key===check.dataset.scopeKey);
   preview.push(found||{id:null,component_key:check.dataset.scopeKey,component_label:check.dataset.scopeLabel,category:check.dataset.scopeGroup,quote_quantity:1,third_party_monthly_cents:null,...pricingFor(check.dataset.scopeKey)});
  }
  preview.push(...saved.filter(i=>i.item_type==='custom'));
  for(const item of preview){
   if(!item.id)continue;
   const editor=[...scope.querySelectorAll('[data-component-pricing]')].find(el=>el.dataset.componentPricing===item.id);
   if(!editor)continue;
   const amount=key=>{
    const raw=editor.querySelector(key)?.value?.trim();
    if(!raw||!/^\d+(?:\.\d{1,2})?$/.test(raw))return null;
    const n=Math.round(Number(raw)*100);
    return Number.isSafeInteger(n)&&n>=0&&n<=999999999?n:null;
   };
   const a=amount('[data-price-setup]'),b=amount('[data-price-monthly]'),c=amount('[data-price-external]');
   const qty=Number(editor.querySelector('[data-price-quantity]')?.value);
   if(a!==null)item.setup_fee_cents=a;
   if(b!==null)item.monthly_fee_cents=b;
   item.third_party_monthly_cents=c;
   if(Number.isSafeInteger(qty)&&qty>=1&&qty<=1000)item.quote_quantity=qty;
  }
  return preview;
 };
 let lastPreviewItems=[];
 const renderEstimate=()=>{
  if(!estimate)return;
  lastPreviewItems=getPreviewItems();
  const totals=quoteTotals(lastPreviewItems);
  const lines=scope.querySelector('#component-estimate-lines');
  const formatter=amount=>asUsd(amount);
  lines.innerHTML=lastPreviewItems.length?'<div class="component-estimate-header"><span>Selected component</span><span>One-time</span><span>Monthly</span></div>'+
   lastPreviewItems.map(item=>{
    const qty=Number(item.quote_quantity)||1;
    return '<div class="component-estimate-row"><span>'+h(item.component_label)+(qty>1?' <small>× '+qty+'</small>':'')+'</span><strong>'+formatter(Number(item.setup_fee_cents||0)*qty)+'</strong><strong>'+formatter(Number(item.monthly_fee_cents||0)*qty)+'</strong></div>';
   }).join(''):'<p class="tiny muted">No components selected yet. Check items above to build an estimate.</p>';
  scope.querySelector('#estimate-setup-total').textContent=formatter(totals.once);
  scope.querySelector('#estimate-monthly-total').textContent=formatter(totals.monthly);
  scope.querySelector('#estimate-external-total').textContent=formatter(totals.external);
  scope.querySelector('#estimate-external-unknown').textContent=totals.unknownExternal+' item(s)';
  scope.querySelector('#estimate-year-total').textContent=formatter(totals.once+totals.monthly*12);
  const dirty=[...scope.querySelectorAll('[data-component-pricing]')].some(editor=>{
   const initial=savedQuotePrice.find(p=>p.component_id===editor.dataset.componentPricing);
   const values=[editor.querySelector('[data-price-setup]')?.value,editor.querySelector('[data-price-monthly]')?.value,editor.querySelector('[data-price-external]')?.value,editor.querySelector('[data-price-quantity]')?.value];
   const baseline=[(Number(initial?.setup_fee_cents||0)/100).toFixed(2),(Number(initial?.monthly_fee_cents||0)/100).toFixed(2),initial?.third_party_monthly_cents==null?'':(Number(initial.third_party_monthly_cents)/100).toFixed(2),String(initial?.quote_quantity||1)];
   return values.some((v,i)=>v!==baseline[i]);
  });
  const copy=scope.querySelector('#component-copy-quote');
  if(copy)copy.disabled=!lastPreviewItems.length||dirty;
  const msg=scope.querySelector('#component-estimate-state');
  if(msg)msg.textContent=dirty?'Preview includes unsaved changes. Click Save fees on the edited components before copying.':'Estimate reflects selected components and saved pricing. No invoice or payment has been generated.';
 };
 const savedQuotePrice=rows.ag_component_pricing||[];
 if(estimate){
  scope.addEventListener('input',event=>{if(event.target.closest('[data-component-pricing]'))renderEstimate();});
  scope.addEventListener('change',event=>{if(event.target.matches('[data-scope-key]')||event.target.closest('[data-component-pricing]'))renderEstimate();});
  renderEstimate();
 }
 const copy=scope.querySelector('#component-copy-quote');
 if(copy)copy.onclick=async()=>{
  try{renderEstimate();if(copy.disabled)return;await navigator.clipboard.writeText(quoteText(project,lastPreviewItems));notify('Internal draft estimate copied. Review before sending to clients.');}
  catch{notify('Clipboard blocked by your browser.');}
 };
 scope.querySelectorAll('[data-scope-key]').forEach(c=>c.onchange=async()=>{
  if(!staff){c.checked=!c.checked;return;}
  const key=c.dataset.scopeKey;
  const existing=(rows.ag_project_components||[]).find(x=>x.project_id===project.id&&x.component_key===key);
  if(c.checked){
   c.disabled=true;
   const created=await supabase.from('ag_project_components').insert({project_id:project.id,component_key:key,component_label:c.dataset.scopeLabel,category:c.dataset.scopeGroup,item_type:'standard',status:'planned',created_by:userId,updated_by:userId}).select('id').single();
   if(created.error||!created.data){notify(created.error?.message||'Unable to add the component.');c.disabled=false;return;}
   const price=await supabase.from('ag_component_pricing').insert({component_id:created.data.id,...pricingFor(key),updated_by:userId});
   if(price.error)notify('Component added, but suggested pricing could not be saved. Enter its fees manually.');
   else notify('Component added with editable suggested pricing.');
   await refreshWithoutJump();
  }else{
   if(existing?.status==='completed'&&!confirm('This component is marked completed. Remove it from the agreed project scope?')){c.checked=true;return;}
   if(!existing){await refreshWithoutJump();return;}
   await save('Component removed from scope.',supabase.from('ag_project_components').delete().eq('id',existing.id),c);
  }
 });
 scope.querySelectorAll('[data-component-status]').forEach(s=>s.onchange=async()=>{
  if(!write)return;
  if(s.value==='completed'&&!confirm('Confirm this component has actually been delivered and verified?')){await refreshWithoutJump();return;}
  await save('Delivery status updated.',supabase.from('ag_project_components').update({status:s.value,updated_by:userId}).eq('id',s.dataset.componentStatus),s);
 });
 scope.querySelectorAll('[data-component-save-note]').forEach(b=>b.onclick=async()=>{
  if(!staff)return;
  const note=scope.querySelector('[data-component-notes="'+b.dataset.componentSaveNote+'"]');
  await save('Requirements note saved.',supabase.from('ag_project_components').update({notes:note.value,updated_by:userId}).eq('id',b.dataset.componentSaveNote),b);
 });
 scope.querySelectorAll('[data-remove-component]').forEach(b=>b.onclick=async()=>{
  if(!staff)return;
  const entry=(rows.ag_project_components||[]).find(x=>x.id===b.dataset.removeComponent);
  if(!confirm('Remove custom component '+(entry?.component_label||'')+' from scope?'))return;
  await save('Custom component removed.',supabase.from('ag_project_components').delete().eq('id',b.dataset.removeComponent),b);
 });
 const form=scope.querySelector('#custom-component-form');
 if(form)form.onsubmit=async e=>{
  e.preventDefault();const label=String(new FormData(form).get('label')||'').trim();
  if(label.length<2||label.length>150){notify('Enter a custom component name of 2–150 characters.');return;}
  const key='custom_'+crypto.randomUUID().replaceAll('-','');
  await save('Custom component added.',supabase.from('ag_project_components').insert({project_id:project.id,component_key:key,component_label:label,category:'Custom',item_type:'custom',created_by:userId,updated_by:userId}),form.querySelector('[type=submit]'));
 };
}
