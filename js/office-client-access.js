// Client access and delivery operations. Database RLS is authoritative.
export function clientAccessPage({rows,escape,pretty}) {
 const h=escape, clients=rows.ag_clients||[], invites=rows.ag_client_invitations||[];
 const clientName=id=>clients.find(c=>c.id===id)?.company||'Client';
 const stamp=s=>s?new Date(s).toLocaleDateString():'—';
 return '<div class="section-head"><div><h2>Client relationships</h2><p>One organization record, one secure client workspace.</p></div><button class="btn" data-action="new-client">+ New client</button></div>'+
 '<div class="card" style="margin-bottom:20px"><div class="section-head"><div><h3>Client organizations</h3><p class="tiny">Create projects after the client has been registered.</p></div></div>'+
 (clients.length?clients.map(c=>'<div class="item"><div><strong>'+h(c.company)+'</strong><small>'+h(c.contact_name||'No primary contact')+' · '+h(c.contact_email||'No email')+'</small></div><span class="pill">'+h(c.status||'active')+'</span></div>').join(''):'<p class="muted">No client organizations yet.</p>')+'</div>'+
 '<div class="card"><div class="section-head"><div><h3>Client portal access</h3><p class="tiny">Add client access by verified email. The account is assigned only after email verification.</p></div><button class="btn alt" data-access="invite">+ Add client access</button></div>'+
 (invites.length?invites.map(i=>'<div class="item"><div><strong>'+h(i.email)+'</strong><small>'+h(clientName(i.client_id))+' · Created '+stamp(i.created_at)+'</small></div><div class="action-area"><span class="pill">'+(i.accepted_by?'Active':Date.parse(i.expires_at)<Date.now()?'Expired':'Pending verification')+'</span>'+(i.accepted_by?'':'<button type="button" class="btn alt small" data-access="revoke" data-invite="'+h(i.id)+'">Revoke</button>')+'</div></div>').join(''):'<p class="muted">No client access invitations have been recorded.</p>')+
 '<p class="tiny muted" style="margin-top:15px">Adding an access record does not send an email automatically. Until invitation delivery is connected, use the authenticated invitation process in the AI Gents Supabase dashboard. Never share passwords.</p>'+
 '<a class="btn alt small" target="_blank" rel="noopener noreferrer" href="https://supabase.com/dashboard/project/apcvfezfmegqqjuonrgl/auth/users">Open secure invitation console ↗</a></div>';
}
export function clientAccessWire({root,supabase,rows,userId,escape,reload,notify}) {
 const h=escape,clients=rows.ag_clients||[];
 function dialog(){
  if(!clients.length){notify('Create the client organization before granting access.');return;}
  const options=clients.map(c=>'<option value="'+h(c.id)+'">'+h(c.company)+'</option>').join('');
  const el=document.createElement('div');el.className='dialog';
  el.innerHTML='<div class="dialog-card" role="dialog" aria-modal="true"><h2>Grant client portal access</h2><p>Enter the contact’s verified email address. Only the selected organization will be accessible.</p><form id="client-access-form"><label class="form-field">Organization<select name="client_id" required><option value="">Select client</option>'+options+'</select></label><label class="form-field">Client email<input type="email" name="email" maxlength="254" required autocomplete="off" placeholder="client@company.com"></label><div class="dialog-buttons"><button type="button" class="btn alt" id="access-cancel">Cancel</button><button type="submit" class="btn">Add access</button></div></form></div>';
  document.body.appendChild(el);el.querySelector('#access-cancel').onclick=()=>el.remove();
  el.addEventListener('click',e=>{if(e.target===el)el.remove();});
  el.querySelector('form').onsubmit=async e=>{
   e.preventDefault();const form=e.target,b=form.querySelector('[type=submit]'),v=Object.fromEntries(new FormData(form));
   b.disabled=true;
   const {error}=await supabase.from('ag_client_invitations').insert({client_id:v.client_id,email:String(v.email).trim().toLowerCase(),created_by:userId});
   if(error){notify(error.message);b.disabled=false;return;}
   el.remove();notify('Access recorded. Send the Supabase invitation if the account does not already exist.');await reload();
  };
 }
 root.querySelectorAll('[data-access]').forEach(b=>b.onclick=async()=>{
  if(b.dataset.access==='invite'){dialog();return;}
  if(b.dataset.access==='revoke'){
   if(!confirm('Revoke this pending invitation?'))return;
   const {error}=await supabase.from('ag_client_invitations').delete().eq('id',b.dataset.invite).is('accepted_by',null);
   if(error)notify(error.message);else{notify('Pending invitation revoked.');await reload();}
  }
 });
}
