// Client access and delivery operations. Database RLS is authoritative.
export function clientAccessPage({rows,escape,pretty,owner}) {
 const h=escape, clients=rows.ag_clients||[], projects=rows.ag_projects||[], invites=rows.ag_client_invitations||[], permissions=rows.ag_client_member_access||[];
 const clientName=id=>clients.find(c=>c.id===id)?.company||'Client';
 const stamp=s=>s?new Date(s).toLocaleDateString():'—';
 return '<div class="section-head"><div><h2>Client relationships</h2><p>One organization record, one secure client workspace.</p></div><button class="btn" data-action="new-client">+ New client</button></div>'+
 '<div class="card" style="margin-bottom:20px"><div class="section-head"><div><h3>Client organizations</h3><p class="tiny">Create projects after the client has been registered.</p></div></div>'+
 (clients.length?clients.map(c=>{
  const linked=projects.filter(p=>p.client_id===c.id).sort((a,b)=>String(a.title||'').localeCompare(String(b.title||'')));
  return '<section class="office-client-projects"><div class="item"><div><strong>'+h(c.company)+'</strong><small>'+h(c.contact_name||'No primary contact')+' · '+h(c.contact_email||'No email')+'</small></div><span class="pill">'+h(c.status||'active')+'</span></div>'+
    '<div class="office-client-project-links"><p class="tiny muted">'+linked.length+' connected project'+(linked.length===1?'':'s')+'</p>'+
    (linked.length?linked.map(p=>'<button type="button" class="office-client-project-link" data-project="'+h(p.id)+'"><span><strong>'+h(p.title)+'</strong><small>'+h(pretty(p.status||'discovery'))+' · '+h(String(p.progress??0))+'% complete</small></span><span aria-hidden="true">Open project →</span></button>').join(''):
      '<p class="tiny muted">No project connected to this client yet. Create a project and select this organization.</p>')+
    '</div></section>';
 }).join(''):'<p class="muted">No client organizations yet.</p>')+'</div>'+
 '<div class="card"><div class="section-head"><div><h3>Client portal access</h3><p class="tiny">Add client access by verified email. The account is assigned only after email verification.</p></div><button class="btn alt" data-access="invite">+ Add client access</button></div>'+
 (invites.length?invites.map(i=>'<div class="item"><div><strong>'+h(i.email)+'</strong><small>'+h(clientName(i.client_id))+' · Created '+stamp(i.created_at)+'</small></div><div class="action-area"><span class="pill">'+(i.accepted_by?'Active':Date.parse(i.expires_at)<Date.now()?'Expired':'Pending verification')+'</span>'+'<button type="button" class="btn alt small" data-access="revoke" data-invite="'+h(i.id)+'">'+(i.accepted_by?'Remove access':'Revoke')+'</button>'+(owner&&i.accepted_by?'<select aria-label="Client access level" data-client-access-user="'+h(i.accepted_by)+'" data-client-access-client="'+h(i.client_id)+'"><option value="read" '+(permissions.some(p=>p.user_id===i.accepted_by&&p.client_id===i.client_id&&p.access_level==='read')?'selected':'')+'>Read only</option><option value="write" '+(!permissions.some(p=>p.user_id===i.accepted_by&&p.client_id===i.client_id&&p.access_level==='read')?'selected':'')+'>Read & respond</option></select>':'')+'</div></div>').join(''):'<p class="muted">No client access invitations have been recorded.</p>')+
 '<p class="tiny muted" style="margin-top:15px">The invitation email is sent through Supabase. If email delivery is unavailable, the pending record is preserved and the secure invitation console can be used.</p>'+
 '<a class="btn alt small" target="_blank" rel="noopener noreferrer" href="https://supabase.com/dashboard/project/apcvfezfmegqqjuonrgl/auth/users">Open secure invitation console ↗</a></div>';
}
export function clientAccessWire({root,supabase,rows,userId,escape,reload,notify,owner}) {
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
   const {data:record,error}=await supabase.from('ag_client_invitations').insert({client_id:v.client_id,email:String(v.email).trim().toLowerCase(),created_by:userId}).select('id,accepted_by').single();
   if(error){notify(error.message);b.disabled=false;return;}
   el.remove();
   if(record.accepted_by){notify('Verified client account linked successfully.');await reload();return;}
   const delivery=await supabase.functions.invoke('ag-invite-client',{body:{invitation_id:record.id}});
   if(delivery.error||delivery.data?.error)notify('Access record created, but the invitation email could not be delivered. Check Supabase email settings.');
   else if(delivery.data?.status==='active')notify('Verified client account linked successfully.');
   else notify('Client invitation email sent. Access activates after verification.');
   await reload();
  };
 }
 root.querySelectorAll('[data-client-access-user]').forEach(field=>field.onchange=async()=>{
  if(!owner)return;
  field.disabled=true;
  const {data,error}=await supabase.functions.invoke('ag-manage-access',{body:{action:'set_client_access',user_id:field.dataset.clientAccessUser,client_id:field.dataset.clientAccessClient,access_level:field.value}});
  if(error||data?.error){notify(data?.error||'Unable to change client permission.');field.disabled=false;}else{notify('Client permission updated.');await reload();}
 });
 root.querySelectorAll('[data-access]').forEach(b=>b.onclick=async()=>{
  if(b.dataset.access==='invite'){dialog();return;}
  if(b.dataset.access==='revoke'){
   if(!confirm('Remove this client portal access? If active, the client will immediately lose access to this organization.'))return;
   const {data:removed,error}=await supabase.rpc('ag_revoke_client_access',{p_invitation_id:b.dataset.invite});
   if(error)notify(error.message);else{notify(removed?'Client access revoked and recorded.':'Invitation no longer exists.');await reload();}
  }
 });
}
