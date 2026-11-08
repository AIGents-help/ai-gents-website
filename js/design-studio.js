// Design Studio module. All authorization is enforced by Supabase RLS.
export function studioPage({rows,staff,userId,escape,projectName,clientName}) {
 const items=rows.ag_review_items||[], versions=rows.ag_review_versions||[], comments=rows.ag_review_comments||[], decisions=rows.ag_review_decisions||[], approvers=rows.ag_client_approvers||[], projects=rows.ag_projects||[];
 const h=escape, badge=s=>'<span class="pill">'+h(s.replaceAll('_',' '))+'</span>';
 const cards=items.map(item=>{
  const vs=versions.filter(v=>v.review_id===item.id).sort((a,b)=>b.version_number-a.version_number);
  return '<section class="card studio-card"><div class="section-head"><div><div class="eyebrow">'+h(projectName(item.project_id))+'</div><h3>'+h(item.title)+'</h3><p>'+h(item.description||'Visual concepts and approval history')+'</p></div>'+badge(item.status)+'</div>'+
  (vs.length?'<div class="studio-grid">'+vs.map(v=>{
   const url=v.preview_url||'', safeLink=/^https:\/\//i.test(url)&&!/[\u0000-\u001f]/.test(url);
   const image=safeLink&&v.preview_type==='image';const stored=!!v.storage_path;const storedImage=stored&&v.preview_type==='image';const pinComments=comments.filter(c=>c.version_id===v.id&&c.position_x!=null&&c.position_y!=null);
   const vdec=decisions.filter(d=>d.version_id===v.id);
   const own=vdec.filter(d=>d.actor_id===userId).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))[0];
   const canApprove=approvers.some(a=>a.user_id===userId&&projects.some(p=>p.id===item.project_id&&p.client_id===a.client_id));
   return '<article class="studio-version"><div class="studio-preview '+(storedImage||image?'studio-annotatable':'')+'" data-annotation-version="'+h(v.id)+'">'+(storedImage?'<img data-private-preview="'+h(v.storage_path)+'" alt="'+h(v.label)+'" loading="lazy">':image?'<img src="'+h(url)+'" alt="'+h(v.label)+'" loading="lazy">':stored?'<div class="studio-visual-icon">🔒<small>PRIVATE '+h(v.preview_type.toUpperCase())+'</small></div>':safeLink?'<div class="studio-visual-icon">↗<small>'+h(v.preview_type.toUpperCase())+' PREVIEW</small></div>':'<div class="studio-visual-icon">◈<small>Preview pending</small></div>')+pinComments.map((c,i)=>'<button class="studio-pin" type="button" title="'+h(c.body)+'" style="left:'+Number(c.position_x)+'%;top:'+Number(c.position_y)+'%" data-comment-pin="'+h(c.id)+'">'+(i+1)+'</button>').join('')+'</div>'+
   '<div class="studio-version-body"><div class="section-head"><div><strong>'+h(v.label)+'</strong><p class="tiny">Version '+v.version_number+' · '+h(v.status)+'</p></div>'+badge(v.status)+'</div><p class="tiny">'+h(v.notes||'')+'</p>'+
   (stored?'<button class="btn alt small" data-open-private="'+h(v.storage_path)+'">Open secured sample ↗</button>':safeLink?'<a class="btn alt small" target="_blank" rel="noopener noreferrer" href="'+h(url)+'">Open visual sample ↗</a>':'')+(staff?'<label class="btn alt small studio-upload">Upload image or PDF<input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" data-upload-version="'+h(v.id)+'" hidden></label>':'')+(staff&&v.status==='draft'?'<button class="btn alt small" style="margin-left:8px" data-studio-action="publish-version" data-version-id="'+h(v.id)+'">Publish version</button>':'')+
   '<div class="studio-decisions"><strong>Recorded decisions</strong>'+(vdec.length?vdec.map(d=>'<p class="tiny">'+h(d.decision.replaceAll('_',' '))+' · '+new Date(d.created_at).toLocaleString()+(d.note?' · '+h(d.note):'')+'</p>').join(''):'<p class="tiny">Awaiting client review</p>')+'</div>'+
   (v.status==='published'&&item.status==='published'?'<form class="studio-feedback" data-version="'+h(v.id)+'"><label class="form-field">Feedback<textarea name="note" maxlength="6000" placeholder="Describe the change or decision…"></textarea></label><input type="hidden" name="position_x"><input type="hidden" name="position_y"><p class="tiny studio-location" hidden></p><div class="action-area"><button class="btn alt small" name="action" value="comment">Send feedback</button>'+(canApprove?'<button class="btn alt small" name="action" value="changes_requested">Request changes</button><button class="btn small" name="action" value="approved">Approve version</button>':'')+'</div>'+(own?'<p class="tiny">Your decision: '+h(own.decision.replaceAll('_',' '))+'</p>':'')+'</form>':'')+
   '<div class="studio-comments"><strong>Discussion</strong><p class="tiny muted">Click an image to mark a requested change.</p>'+(comments.filter(c=>c.version_id===v.id).map(c=>'<p class="tiny">'+h(c.body)+' <span class="muted">· '+new Date(c.created_at).toLocaleDateString()+'</span></p>').join('')||'<p class="tiny">No feedback yet.</p>')+'</div></div></article>';
  }).join('')+'</div>':'<p class="muted">No versions have been added yet.</p>')+
  (staff?'<div class="studio-add-version"><button class="btn alt small" data-studio-action="new-version" data-review="'+h(item.id)+'">+ Add version</button> '+(item.status==='draft'?'<button class="btn alt small" data-studio-action="publish-review" data-review="'+h(item.id)+'">Publish review</button>':'')+'</div>':'')+
  '</section>';
 }).join('');
 const projectOptions=projects.map(p=>'<option value="'+h(p.id)+'">'+h(clientName(p.client_id)+' / '+p.title)+'</option>').join('');
 return '<div class="section-head"><div><h2>Design Studio</h2><p>Compare concepts, discuss revisions, and approve a precise version.</p></div>'+(staff?'<button class="btn" data-studio-action="new-review">+ New design review</button>':'')+'</div>'+
 (staff?'<p class="tiny muted">Only published reviews and published versions are shown to clients. Assign final approvers from the client organization separately.</p>':'<p class="tiny muted">All reviewers can comment. Final approval is reserved for designated approvers.</p>')+
 (staff?'<div class="card" style="margin-bottom:20px"><div class="section-head"><div><h3>Authorized client approvers</h3><p class="tiny">Choose a client and an existing portal member. Only listed approvers can formally approve.</p></div><button class="btn alt small" data-studio-action="new-approver">Assign approver</button></div>'+(approvers.length?approvers.map(a=>'<div class="item"><div><strong>'+h(clientName(a.client_id))+'</strong><small>User: '+h(a.user_id)+'</small></div><button class="btn alt small" data-studio-action="remove-approver" data-client="'+h(a.client_id)+'" data-user="'+h(a.user_id)+'">Remove</button></div>').join(''):'<p class="tiny muted">No approvers assigned.</p>')+'</div>':'')+
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
  if(action==='publish-review'||action==='publish-version'){
   if(!confirm('Publish this design content to authorized client portal users?'))return;
   const table=action==='publish-review'?'ag_review_items':'ag_review_versions';
   const id=action==='publish-review'?b.dataset.review:b.dataset.versionId;
   const fields=action==='publish-review'?{status:'published'}:{status:'published',published_at:new Date().toISOString()};
   supabase.from(table).update(fields).eq('id',id).then(({error})=>{if(error)notify(error.message);else reload();});
   return;
  }
  if(action==='remove-approver'){
   if(!confirm('Revoke final approval rights for this client member?'))return;
   supabase.from('ag_client_approvers').delete().eq('client_id',b.dataset.client).eq('user_id',b.dataset.user).then(({error})=>{if(error)notify(error.message);else reload();});
   return;
  }
  if(action==='new-approver'){
   const clients=rows.ag_clients||[],members=rows.ag_client_users||[],existing=rows.ag_client_approvers||[];
   const choices=members.filter(m=>!existing.some(a=>a.client_id===m.client_id&&a.user_id===m.user_id));
   if(!choices.length){notify('Add an authenticated user to a client organization before assigning approval authority.');return;}
   const options=choices.map(m=>'<option value="'+h(m.client_id+'|'+m.user_id)+'">'+h((clients.find(c=>c.id===m.client_id)?.company||'Client')+' — '+m.user_id)+'</option>').join('');
   modal('Assign final approver','<label class="form-field">Existing client member<select name="membership" required>'+options+'</select></label>',async v=>{
    const [client_id,user_id]=String(v.membership||'').split('|');
    if(!client_id||!user_id)return false;
    const {error}=await supabase.from('ag_client_approvers').insert({client_id,user_id});
    if(error){notify(error.message);return false;}return true;
   });
   return;
  }
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
 const bucket=supabase.storage.from('ag-design-previews');
 root.querySelectorAll('img[data-private-preview]').forEach(async image=>{const {data,error}=await bucket.createSignedUrl(image.dataset.privatePreview,120);if(error){notify('Preview access denied: '+error.message);return;}image.src=data.signedUrl;});
 root.querySelectorAll('[data-open-private]').forEach(button=>button.onclick=async()=>{const {data,error}=await bucket.createSignedUrl(button.dataset.openPrivate,120);if(error){notify(error.message);return;}const link=document.createElement('a');link.href=data.signedUrl;link.target='_blank';link.rel='noopener noreferrer';document.body.appendChild(link);link.click();link.remove();});
 root.querySelectorAll('[data-upload-version]').forEach(field=>field.onchange=async()=>{if(!staff)return;const file=field.files?.[0];if(!file)return;const types={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','application/pdf':'pdf'};const ext=types[file.type];if(!ext||file.size>15*1024*1024){notify('Allowed: PNG, JPG, WebP or PDF, up to 15 MB.');return;}const id=field.dataset.uploadVersion;if(!/^[0-9a-f-]{36}$/.test(id))return;field.disabled=true;const path=id+'/'+crypto.randomUUID()+'.'+ext;const {error}=await bucket.upload(path,file,{contentType:file.type,upsert:false,cacheControl:'120'});if(error){field.disabled=false;notify('Upload failed: '+error.message);return;}const {error:saveError}=await supabase.from('ag_review_versions').update({storage_path:path,preview_type:file.type==='application/pdf'?'pdf':'image'}).eq('id',id);if(saveError){notify('Uploaded, but attachment failed: '+saveError.message);field.disabled=false;return;}notify('Private sample uploaded.');await reload();});
 root.querySelectorAll('.studio-annotatable').forEach(box=>box.onclick=e=>{if(e.target.closest('.studio-pin'))return;const form=root.querySelector('form.studio-feedback[data-version="'+box.dataset.annotationVersion+'"]');if(!form)return;const img=box.querySelector('img');if(!img||!img.complete||!img.naturalWidth)return;const rect=img.getBoundingClientRect(),x=Math.round(1000*(e.clientX-rect.left)/rect.width)/10,y=Math.round(1000*(e.clientY-rect.top)/rect.height)/10;if(x<0||x>100||y<0||y>100)return;form.elements.position_x.value=String(x);form.elements.position_y.value=String(y);const hint=form.querySelector('.studio-location');hint.hidden=false;hint.textContent='Annotation at '+x+'% across, '+y+'% down.';form.querySelector('textarea')?.focus();});
 root.querySelectorAll('[data-comment-pin]').forEach(pin=>pin.onclick=e=>{e.stopPropagation();notify(pin.title);});
 root.querySelectorAll('form.studio-feedback').forEach(form=>{
  form.addEventListener('click',e=>{const b=e.target.closest('button[name=action]');if(b)form.dataset.chosenAction=b.value;});
  form.onsubmit=async e=>{e.preventDefault();const act=e.submitter?.value||form.dataset.chosenAction||'comment',text=String(new FormData(form).get('note')||'').trim(),versionId=form.dataset.version;
   if(!text&&act!=='approved'){notify('Please enter your feedback.');return;}
   if(!confirm(act==='approved'?'Formally approve this exact version?':'Submit this feedback?'))return;
   let result;
   if(act==='comment'){const fd=new FormData(form),px=String(fd.get('position_x')||''),py=String(fd.get('position_y')||'');result=await supabase.from('ag_review_comments').insert({version_id:versionId,author_id:userId,body:text,position_x:px?Number(px):null,position_y:py?Number(py):null});}
   else result=await supabase.from('ag_review_decisions').insert({version_id:versionId,actor_id:userId,decision:act,note:text||null});
   if(result.error)notify(result.error.message);else{notify(act==='approved'?'Version approved.':'Feedback recorded.');await reload();}
  };
 });
}
