// Owner-controlled, scoped team access. Service endpoint authorizes all mutations.
export function teamPage({rows,escape,owner}){
 const h=escape,people=rows.ag_team_members||[],assignments=rows.ag_team_assignments||[],projects=rows.ag_projects||[];
 if(!owner)return '<section class="card"><h2>Access restricted</h2><p>Only the Office owner can grant or revoke roles.</p></section>';
 const opts=projects.map(p=>'<option value="'+h(p.id)+'">'+h(p.title)+'</option>').join('');
 return '<div class="section-head"><div><h2>Team & Access</h2><p>Delegate client work without granting access to every business or project.</p></div></div>'+
 '<section class="card" style="margin-bottom:18px"><h3>Invite an employee or contractor</h3><p class="tiny muted">An email invitation is sent only when you submit this form. The account receives access only to the selected project.</p>'+
 '<form id="team-invite-form"><div class="two"><label class="form-field">Email<input type="email" name="email" autocomplete="off" maxlength="254" required placeholder="person@company.com"></label><label class="form-field">Role<select name="role"><option value="employee">Employee</option><option value="contractor">Contractor</option></select></label><label class="form-field">Project<select name="project_id" required><option value="">Choose project</option>'+opts+'</select></label><label class="form-field">Access<select name="access_level"><option value="read">Read only</option><option value="write">Read & respond</option></select></label></div><button class="btn" type="submit">Send invitation / assign access</button></form></section>'+
 '<section class="card"><div class="section-head"><div><h3>Team members</h3><p class="tiny muted">Each project is independently assigned. Disabling a member immediately blocks their project access.</p></div></div>'+
 (people.length?people.map(m=>{
 const granted=assignments.filter(a=>a.user_id===m.user_id);
 return '<article class="team-member"><div class="section-head"><div><strong>'+h(m.email)+'</strong><p class="tiny">'+h(m.role)+' · '+(m.active?'Active':'Disabled')+'</p></div><button class="btn alt small" type="button" data-team-toggle="'+h(m.user_id)+'" data-active="'+String(!!m.active)+'">'+(m.active?'Disable access':'Restore access')+'</button></div>'+
 (granted.length?granted.map(a=>'<div class="item"><div><strong>'+h(projects.find(p=>p.id===a.project_id)?.title||'Project')+'</strong><small>Existing assignment</small></div><select aria-label="Project permission" data-team-project="'+h(a.project_id)+'" data-team-user="'+h(m.user_id)+'"><option value="read" '+(a.access_level==='read'?'selected':'')+'>Read only</option><option value="write" '+(a.access_level==='write'?'selected':'')+'>Read & respond</option><option value="remove">Remove assignment</option></select></div>').join(''):'<p class="tiny muted">No projects assigned.</p>')+
 '<form class="team-add-project" data-team-add="'+h(m.user_id)+'"><label class="form-field">Grant another project<select name="project_id" required><option value="">Select project</option>'+projects.filter(p=>!granted.some(a=>a.project_id===p.id)).map(p=>'<option value="'+h(p.id)+'">'+h(p.title)+'</option>').join('')+'</select></label><label class="form-field">Access<select name="access_level"><option value="read">Read only</option><option value="write">Read & respond</option></select></label><button class="btn alt small" type="submit">Grant access</button></form></article>';
 }).join(''):'<p class="muted">No employees or contractors assigned yet.</p>')+'</section>'+
 '<p class="tiny muted" style="margin-top:15px">Customers are managed separately under Clients. Owner and privileged internal administrator roles are not created by this tool. Read & respond permits project conversation and review feedback, not billing, account management, or production deployments.</p>';
}
export function teamWire({root,supabase,reload,notify,owner}){
 if(!owner)return;
 const endpoint=async data=>{
  const {data:result,error}=await supabase.functions.invoke('ag-manage-access',{body:data});
  if(error||result?.error)throw new Error(result?.error||'Account-management request failed');
  return result;
 };
 const form=root.querySelector('#team-invite-form');
 if(form)form.onsubmit=async e=>{
  e.preventDefault();const btn=form.querySelector('[type=submit]'),v=Object.fromEntries(new FormData(form));
  if(!confirm('Invite or assign '+v.email+' to this single project with '+v.access_level+' access?'))return;
  btn.disabled=true;
  try{const r=await endpoint({action:'invite_team',...v});notify(r.message||'Team access saved.');await reload();}
  catch(error){notify(error.message);btn.disabled=false;}
 };
 root.querySelectorAll('[data-team-toggle]').forEach(b=>b.onclick=async()=>{
  const active=b.dataset.active!=='true';
  if(!confirm(active?'Restore project access for this team member?':'Disable all project access for this team member?'))return;
  b.disabled=true;try{await endpoint({action:'set_team_active',user_id:b.dataset.teamToggle,active});notify(active?'Team access restored.':'Team access disabled.');await reload();}
  catch(error){notify(error.message);b.disabled=false;}
 });
 root.querySelectorAll('[data-team-project]').forEach(s=>s.onchange=async()=>{
  const newLevel=s.value;
  if(newLevel==='remove'&&!confirm('Remove this project assignment?')){await reload();return;}
  s.disabled=true;try{await endpoint({action:'set_team_access',user_id:s.dataset.teamUser,project_id:s.dataset.teamProject,access_level:newLevel});notify('Project permissions updated.');await reload();}
  catch(error){notify(error.message);s.disabled=false;}
 });
 root.querySelectorAll('form[data-team-add]').forEach(f=>f.onsubmit=async e=>{
  e.preventDefault();const v=Object.fromEntries(new FormData(f)),btn=f.querySelector('[type=submit]');if(!v.project_id)return;
  btn.disabled=true;try{await endpoint({action:'set_team_access',user_id:f.dataset.teamAdd,project_id:v.project_id,access_level:v.access_level});notify('Additional project assigned.');await reload();}
  catch(error){notify(error.message);btn.disabled=false;}
 });
}
