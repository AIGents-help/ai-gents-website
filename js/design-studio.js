// Design Studio module. All authorization is enforced by Supabase RLS.
export function studioPage({rows,staff,userId,escape,projectName,clientName}) {
 const items=rows.ag_review_items||[], versions=rows.ag_review_versions||[], comments=rows.ag_review_comments||[], decisions=rows.ag_review_decisions||[], approvers=rows.ag_client_approvers||[], projects=rows.ag_projects||[];
 const h=escape, badge=s=>'<span class="pill">'+h(s.replaceAll('_',' '))+'</span>';
 const cards=items.map(item=>{
  const vs=versions.filter(v=>v.review_id===item.id).sort((a,b)=>b.version_number-a.version_number);
  return '<section class="card studio-card"><div class="section-head"><div><div class="eyebrow">'+h(projectName(item.project_id))+'</div><h3>'+h(item.title)+'</h3><p>'+h(item.description||'Visual concepts and approval history')+'</p></div>'+badge(item.status)+'</div>'+
  (vs.length?'<div class="studio-grid">'+vs.map(v=>{
   const url=v.preview_url||'', safeLink=/^https:\/\//i.test(url)&&!/[\u0000-\u001f]/.test(url);
   const image=safeLink&&v.preview_type==='image';
   const vdec=decisions.filter(d=>d.version_id===v.id);
   const own=vdec.find(d=>d.actor_id===userId);
   const canApprove=approvers.some(a=>a.user_id===userId&&projects.some(p=>p.id===item.project_id&&p.client_id===a.client_id));
   return '<article class="studio-version"><div class="studio-preview">'+(image?'<img src="'+h(url)+'" alt="'+h(v.label)+'" loading="lazy">':safeLink?'<div class="studio-visual-icon">↗<small>'+h(v.preview_type.toUpperCase())+' PREVIEW</small></div>':'<div class="studio-visual-icon">◈<small>Preview pending</small></div>')+'</div>'+
   '<div class="studio-version-body"><div class="section-head"><div><strong>'+h(v.label)+'</strong><p class="tiny">Version '+v.version_number+' · '+h(v.status)+'</p></div>'+badge(v.status)+'</div><p class="tiny">'+h(v.notes||'')+'</p>'+
   (safeLink?'<a class="btn alt small" target="_blank" rel="noopener noreferrer" href="'+h(url)+'">Open visual sample ↗</a>':'')+
   '<div class="studio-decisions"><strong>Recorded decisions</strong>'+(vdec.length?vdec.map(d=>'<p class="tiny">'+h(d.decision.replaceAll('_',' '))+' · '+new Date(d.created_at).toLocaleString()+(d.note?' · '+h(d.note):'')+'</p>').join(''):'<p class="tiny">Awaiting client review</p>')+'</div>'+
   (v.status==='published'&&item.status==='published'?'<form class="studio-feedback" data-version="'+h(v.id)+'"><label class="form-field">Feedback<textarea name="note" maxlength="6000" placeholder="Describe the change or decision…"></textarea></label><div class="action-area"><button class="btn alt small" name="action" value="comment">Send feedback</button>'+(canApprove?'<button class="btn alt small" name="action" value="changes_requested">Request changes</button><button class="btn small" name="action" value="approved">Approve version</button>':'')+'</div>'+(own?'<p class="tiny">Your decision: '+h(own.decision.replaceAll('_',' '))+'</p>':'')+'</form>':'')+
   '<div class="studio-comments"><strong>Discussion</strong>'+(comments.filter(c=>c.version_id===v.id).map(c=>'<p class="tiny">'+h(c.body)+' <span class="muted">· '+new Date(c.created_at).toLocaleDateString()+'</span></p>').join('')||'<p class="tiny">No feedback yet.</p>')+'</div></div></article>';
  }).join('')+'</div>':'<p class="muted">No versions have been added yet.</p>')+
  (staff?'<div class="studio-add-version"><button class="btn alt small" data-studio-action="new-version" data-review="'+h(item.id)+'">+ Add version</button></div>':'')+
  '</section>';
 }).join('');
 const projectOptions=projects.map(p=>'<option value="'+h(p.id)+'">'+h(clientName(p.client_id)+' / '+p.title)+'</option>').join('');
 return '<div class="section-head"><div><h2>Design Studio</h2><p>Compare concepts, discuss revisions, and approve a precise version.</p></div>'+(staff?'<button class="btn" data-studio-action="new-review">+ New design review</button>':'')+'</div>'+
 (staff?'<p class="tiny muted">Only published reviews and published versions are shown to clients. Assign final approvers from the client organization separately.</p>':'<p class="tiny muted">All reviewers can comment. Final approval is reserved for designated approvers.</p>')+
 '<div class="studio-stack">'+(cards||'<section class="card">'+(staff?'No design reviews yet. Create a review and add a visual version.':'Your visual samples will appear here when they are ready for review.')+'</section>')+'</div>'+
 '<template id="studio-project-options">'+projectOptions+'</template>';
}
export function studioWire({root,supabase,rows,staff,userId,escape,reload,notify}) {
 const h=escape;
 function modal(title,fields,onSubmit) {
  const el=document.createElement('div');el.className='dialog';
  el.innerHTML='<div class="dialog-card" role="dialog" aria-modal="true"><h2>'+h(title)+'</h2><p id="studio-form-error" class="error" hidden></p><form id="studio-form">'+fields+'<div class="dialog-buttons"><button type="button" class="btn alt" id="studio-cancel">Cancel</button><button class="btn" type="submit">Save</button></div></form></div>';
  document.body.appendChild(el);el.querySelector('#studio-cancel').onclick=()=>el.remove();
  el.addEventListener('click',e=>{if(e.target===el)el.remove();});
  el.querySelector('form').onsubmit=async e=>{e.preventDefault();const button=e.target.querySelector('[type=submit]');button.disabled=true;
   const result=await onSubmit(Object.fromEntries(new FormData(e.target)));
   if(result){el.remove();await reload();}else{button.disabled=false;const er=el.querySelector('#studio-form-error');er.hidden=false;er.textContent='Unable to save. Check your permissions and fields.';}
  };
 }
 root.querySelectorAll('[data-studio-action]').forEach(b=>b.onclick=()=>{
  if(!staff)return;
  const action=b.dataset.studioAction;
  if(action==='new-review'){
   const opts=(root.querySelector('#studio-project-options')?.innerHTML||'');
   modal('New design review','<label class="form-field">Project<select name="project_id" required><option value="">Choose project</option>'+opts+'</select></label><label class="form-field">Review title<input name="title" required maxlength="150"></label><label class="form-field">Description<textarea name="description"></textarea></label><label class="form-field">Visibility<select name="status"><option value="draft">Internal draft</option><option value="published">Publish to client</option></select></label>',async v=>{
    const {error}=await supabase.from('ag_review_items').insert({project_id:v.project_id,title:v.title,description:v.description||null,status:v.status,created_by:userId});if(error){notify(error.message);return false;}return true;});
  }
  if(action==='new-version'){
   const reviewId=b.dataset.review,versions=(rows.ag_review_versions||[]).filter(v=>v.review_id===reviewId);
   const next=1+versions.reduce((max,v)=>Math.max(max,v.version_number),0);
   modal('Add visual version','<label class="form-field">Version number<input name="number" type="number" min="1" required value="'+next+'"></label><label class="form-field">Concept label<input name="label" required maxlength="150" placeholder="Concept A, homepage, revised logo…"></label><label class="form-field">Preview type<select name="preview_type"><option value="image">Image</option><option value="link">Website link</option><option value="pdf">PDF link</option><option value="video">Video link</option></select></label><label class="form-field">Secure HTTPS preview URL<input name="preview_url" type="url" required placeholder="https://…"></label><label class="form-field">Notes<textarea name="notes"></textarea></label><label class="form-field">Visibility<select name="status"><option value="draft">Internal draft</option><option value="published">Publish to client</option></select></label>',async v=>{
    const {error}=await supabase.from('ag_review_versions').insert({review_id:reviewId,version_number:Number(v.number),label:v.label,preview_type:v.preview_type,preview_url:v.preview_url,notes:v.notes||null,status:v.status,published_at:v.status==='published'?new Date().toISOString():null,created_by:userId});if(error){notify(error.message);return false;}return true;});
  }
 });
 root.querySelectorAll('form.studio-feedback').forEach(form=>{
  form.addEventListener('click',e=>{const b=e.target.closest('button[name=action]');if(b)form.dataset.chosenAction=b.value;});
  form.onsubmit=async e=>{e.preventDefault();const act=e.submitter?.value||form.dataset.chosenAction||'comment',text=String(new FormData(form).get('note')||'').trim(),versionId=form.dataset.version;
   if(!text&&act!=='approved'){notify('Please enter your feedback.');return;}
   if(!confirm(act==='approved'?'Formally approve this exact version?':'Submit this feedback?'))return;
   let result;
   if(act==='comment')result=await supabase.from('ag_review_comments').insert({version_id:versionId,author_id:userId,body:text});
   else result=await supabase.from('ag_review_decisions').upsert({version_id:versionId,actor_id:userId,decision:act,note:text||null,created_at:new Date().toISOString()},{onConflict:'version_id,actor_id'});
   if(result.error)notify(result.error.message);else{notify(act==='approved'?'Version approved.':'Feedback recorded.');await reload();}
  };
 });
}
