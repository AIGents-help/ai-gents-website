// In-app notification center and invoice preparation. Stripe is deliberately not connected.
export function notificationPage({rows,escape,projectName}) {
 const h=escape,alerts=rows.ag_notifications||[];
 const unread=alerts.filter(n=>!n.read_at).length;
 return '<div class="section-head"><div><h2>Notifications</h2><p>Project messages, design decisions, proposals and shared files.</p></div><span class="pill">'+unread+' unread</span></div>'+
 '<p class="tiny muted">These notifications appear inside The Office. External email delivery is not enabled yet.</p>'+ '<div class="action-area" style="margin:14px 0"><button class="btn alt small" type="button" data-filter-alerts="all" aria-pressed="true">All activity</button><button class="btn alt small" type="button" data-filter-alerts="unread" aria-pressed="false">Unread only</button>'+(unread?'<button class="btn alt small" type="button" data-read-all-alerts>Mark all read</button>':'')+'</div>'+
 '<section class="card">'+(alerts.length?alerts.map(n=>
 '<div class="item" data-alert-row data-unread="'+(!n.read_at?'true':'false')+'"><div><div class="eyebrow">'+h(n.category)+'</div><strong>'+h(n.title)+'</strong><small>'+h(n.detail||'')+' · '+h(projectName(n.project_id))+' · '+new Date(n.created_at).toLocaleString()+'</small></div>'+
 '<div class="action-area">'+(n.project_id?'<button class="btn alt small" type="button" data-open-alert-project="'+h(n.project_id)+'">Open project</button>':'')+(n.read_at?'<span class="pill">Read</span>':'<button class="btn alt small" data-notification-read="'+h(n.id)+'">Mark read</button>')+'</div></div>'
 ).join(''):'<div class="empty">No notifications yet. Activity will appear when projects have client updates.</div>')+'</section>';
}
export function notificationWire({root,supabase,reload,notify,navigateProject,rows}){
 root.querySelectorAll('[data-filter-alerts]').forEach(btn=>btn.onclick=()=>{const unreadOnly=btn.dataset.filterAlerts==='unread';root.querySelectorAll('[data-filter-alerts]').forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));root.querySelectorAll('[data-alert-row]').forEach(row=>{row.hidden=unreadOnly&&row.dataset.unread!=='true';});});
 root.querySelectorAll('[data-open-alert-project]').forEach(b=>b.onclick=()=>navigateProject(b.dataset.openAlertProject));
 root.querySelector('[data-read-all-alerts]')?.addEventListener('click',async e=>{const ids=(rows.ag_notifications||[]).filter(a=>!a.read_at).map(a=>a.id);if(!ids.length)return;e.currentTarget.disabled=true;const {error}=await supabase.from('ag_notifications').update({read_at:new Date().toISOString()}).in('id',ids).is('read_at',null);if(error){notify(error.message);e.currentTarget.disabled=false;}else await reload();});
 root.querySelectorAll('[data-notification-read]').forEach(b=>b.onclick=async()=>{
  b.disabled=true;
  const {data,error}=await supabase.from('ag_notifications').update({read_at:new Date().toISOString()}).eq('id',b.dataset.notificationRead).is('read_at',null).select('id').maybeSingle();
  if(error)notify(error.message);else if(data)await reload();else notify('Notification already acknowledged.');
  b.disabled=false;
 });
}
export function billingPage({rows,staff,escape,clientName,projectName}) {
 const h=escape, invoices=rows.ag_invoices||[],clients=rows.ag_clients||[],projects=rows.ag_projects||[],preparations=rows.ag_stripe_invoice_preparations||[],allocations=rows.ag_scope_invoice_allocations||[],scopes=rows.ag_scope_packages||[];
 const amount=(cents,currency='usd')=>new Intl.NumberFormat('en-US',{style:'currency',currency}).format(Number(cents||0)/100);
 const options=clients.map(c=>'<option value="'+h(c.id)+'">'+h(c.company)+'</option>').join('');
 const pOptions=projects.map(p=>'<option value="'+h(p.id)+'" data-client-id="'+h(p.client_id)+'">'+h(p.title)+'</option>').join('');
 return '<div class="section-head"><div><h2>Billing</h2><p>Prepare invoice details and review verified payment records.</p></div>'+(staff?'<button class="btn" data-new-invoice>+ Prepare invoice</button>':'')+'</div>'+
 '<div class="notice"><strong>AI Gents Stripe account verified.</strong> Account acct_1T7vi0JgQWDNmZYh is verified through ChatGPT. Website billing credentials and webhooks still require secure configuration. No invoice can be sent or charged here. <span id="stripe-gateway-status">Checking test gateway…</span></div>'+
 '<section class="card">'+(invoices.length?invoices.map(i=>
 '<div class="item"><div><strong>'+h(i.invoice_number||'Billing draft')+' · '+h(clientName(i.client_id))+'</strong><small>'+h(projectName(i.project_id))+' · '+h(i.status)+' · Due '+h(i.due_date||'not scheduled')+'</small>'+(allocations.some(a=>a.invoice_id===i.id)?'<small>Accepted scope v'+h(scopes.find(p=>p.id===allocations.find(a=>a.invoice_id===i.id)?.package_id)?.version||'?')+' · '+h(allocations.find(a=>a.invoice_id===i.id)?.milestone_label||'Milestone')+' · Internal draft only</small>':'')+'</div><div class="action-area"><strong>'+h(amount(i.amount_cents,i.currency))+'</strong>'+
 (staff&&i.status==='draft'&&!i.external_stripe_invoice_id&&!preparations.some(p=>p.invoice_id===i.id)?'<button class="btn alt small" type="button" data-stripe-test-draft="'+h(i.id)+'" hidden>Prepare TEST Stripe draft</button>':'')+(i.external_stripe_invoice_id&&i.stripe_livemode===false?'<span class="pill">Stripe test draft</span>':'')+(preparations.some(p=>p.invoice_id===i.id&&p.state==='needs_reconciliation')?'<span class="pill">Reconciliation needed</span>':'')+(preparations.some(p=>p.invoice_id===i.id&&p.state==='started')?'<span class="pill">Preparation pending</span>':'')+(i.status!=='draft'&&typeof i.hosted_invoice_url==='string'&&/^https:\/\//.test(i.hosted_invoice_url)?'<a class="btn alt small" target="_blank" rel="noopener noreferrer" href="'+h(i.hosted_invoice_url)+'">Stripe invoice ↗</a>':'')+'</div></div>'
 ).join(''):'<div class="empty">No billing records yet. You can prepare a draft without sending it.</div>')+'</section>'+
 '<template id="billing-client-options">'+options+'</template><template id="billing-project-options">'+pOptions+'</template>';
}
export function billingWire({root,supabase,staff,reload,notify}){
 if(staff){(async()=>{const info=root.querySelector('#stripe-gateway-status');const {data,error}=await supabase.functions.invoke('ag-office-stripe-test',{body:{action:'status'}});if(!info||!info.isConnected)return;const ready=!error&&data?.test_ready===true;info.textContent=ready?'Test draft gateway ready. Live billing remains disabled.':'Test draft gateway not yet configured.';root.querySelectorAll('[data-stripe-test-draft]').forEach(button=>{button.hidden=!ready;button.onclick=async()=>{if(!confirm('Create a TEST-only Stripe draft for this internal invoice? No email or charge will be sent.'))return;button.disabled=true;const result=await supabase.functions.invoke('ag-office-stripe-test',{body:{action:'prepare_test_draft',invoice_id:button.dataset.stripeTestDraft}});if(result.error||result.data?.error){notify(result.data?.error||'Test draft preparation failed.');button.disabled=false;}else{notify('Stripe test draft prepared. No customer email or charge was sent.');await reload();}};});})();}

 root.querySelector('[data-new-invoice]')?.addEventListener('click',()=>{
  if(!staff)return;
  const clients=root.querySelector('#billing-client-options')?.innerHTML||'';
  if(!clients){notify('Add a client before creating a billing draft.');return;}
  const projects=root.querySelector('#billing-project-options')?.innerHTML||'';
  const el=document.createElement('div');el.className='dialog';
  el.innerHTML='<div class="dialog-card" role="dialog" aria-modal="true"><h2>Prepare billing draft</h2><p>Internal draft only. No Stripe invoice is sent and no payment is collected.</p><form id="billing-draft-form"><label class="form-field">Client<select name="client_id" required><option value="">Select client</option>'+clients+'</select></label><label class="form-field">Project (optional)<select name="project_id"><option value="">No linked project</option>'+projects+'</select></label><label class="form-field">Internal reference<input name="invoice_number" maxlength="100" placeholder="AG-001"></label><label class="form-field">Amount (USD)<input name="amount" type="number" min="0" max="999999999" step="0.01" required></label><label class="form-field">Planned due date<input name="due_date" type="date"></label><div class="dialog-buttons"><button class="btn alt" id="billing-cancel" type="button">Cancel</button><button class="btn" type="submit">Save draft</button></div></form></div>';
  document.body.appendChild(el);
  el.querySelector('#billing-cancel').onclick=()=>el.remove();
  el.addEventListener('click',e=>{if(e.target===el)el.remove();});
  const f=el.querySelector('form'),client=f.elements.client_id,project=f.elements.project_id;
  function filterProjects(){for(const option of project.options){option.hidden=!!option.value&&option.dataset.clientId!==client.value;}if(project.selectedOptions[0]?.hidden)project.value='';}
  client.onchange=filterProjects;filterProjects();
  f.onsubmit=async e=>{
   e.preventDefault();const values=Object.fromEntries(new FormData(f)),amount=Math.round(Number(values.amount)*100);
   if(!Number.isSafeInteger(amount)||amount<0){notify('Enter a valid invoice amount.');return;}
   if(values.project_id&&project.selectedOptions[0]?.dataset.clientId!==values.client_id){notify('Project must belong to the selected client.');return;}
   const button=f.querySelector('[type=submit]');button.disabled=true;
   const {error}=await supabase.from('ag_invoices').insert({client_id:values.client_id,project_id:values.project_id||null,invoice_number:values.invoice_number?.trim()||null,amount_cents:amount,currency:'usd',status:'draft',due_date:values.due_date||null});
   if(error){notify(error.message);button.disabled=false;return;}
   el.remove();notify('Internal billing draft saved. No invoice was sent or charged.');await reload();
  };
 });
}
