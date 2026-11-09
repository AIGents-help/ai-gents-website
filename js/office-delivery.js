import {openProposalPrint} from '/js/office-proposal-print.js';
// Proposals and client deliverables; Supabase RLS enforces project membership.
export function proposalPage({rows,staff,userId,escape,projectName,clientName}) {
 const h=escape,proposals=rows.ag_proposals||[],decisions=rows.ag_proposal_decisions||[],projects=rows.ag_projects||[],approvers=rows.ag_client_approvers||[];
 const money=(n,c)=>n==null?'Pricing to be confirmed':new Intl.NumberFormat('en-US',{style:'currency',currency:c||'usd'}).format(Number(n)/100);
 const scopePackages=rows.ag_scope_packages||[],members=rows.ag_client_users||[],access=rows.ag_client_member_access||[];
 const hasApprover=clientId=>approvers.some(a=>a.client_id===clientId&&members.some(m=>m.client_id===clientId&&m.user_id===a.user_id)&&!access.some(x=>x.client_id===clientId&&x.user_id===a.user_id&&x.access_level==='read'));
 const statuses=proposals.map(p=>{
  const project=projects.find(j=>j.id===p.project_id);
  const packageRecord=scopePackages.find(pkg=>pkg.proposal_id===p.id);
  const superseded=!!packageRecord&&scopePackages.some(pkg=>pkg.project_id===packageRecord.project_id&&pkg.version>packageRecord.version);
  const decision=decisions.filter(d=>d.proposal_id===p.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))[0];
  const canApprove=approvers.some(a=>a.user_id===userId&&a.client_id===project?.client_id)&&!access.some(a=>a.user_id===userId&&a.client_id===project?.client_id&&a.access_level==='read');
  const linked=(rows.ag_scope_delivery_tasks||[]).filter(link=>link.package_id===packageRecord?.id).length;
  let action='Awaiting staff review',detail='Review the proposal status.',order=3;
  if(superseded){action='Superseded version';detail='Use the latest scope version for any new agreement.';order=5;}
  else if(p.status==='draft'){
   action=staff?(hasApprover(project?.client_id)?'Ready for publication':'Assign client approver'):'Internal draft';
   detail=staff?(hasApprover(project?.client_id)?'Review the fixed terms and publish when ready.':'Grant verified client access and approver rights before publishing.'):'Not published for client review.';
   order=staff?0:4;
  }else if(decision?.decision==='changes_requested'){
   action='Changes requested';detail=staff?'Review the comments and prepare a revised proposal version.':'Your request was recorded. AI Gents must prepare a revised proposal.';order=staff?0:3;
  }else if(decision?.decision==='accepted'){
   action='Accepted';
   detail=staff?(packageRecord?(linked?'Delivery tasks exist; review work and evidence.':'Generate tasks from the approved scope in the project workspace.'):'Acceptance recorded; coordinate project delivery.'):'Acceptance recorded. AI Gents will coordinate delivery.';
   order=staff&&packageRecord&&!linked?1:3;
  }else if(p.status==='published'){
   action=!staff&&canApprove?'Your review required':'Awaiting client decision';
   detail=!staff&&canApprove?'Review the complete proposal, then accept or request changes.':staff?'Published to the client portal; awaiting an authorized decision.':'An authorized approver must respond.';
   order=!staff&&canApprove?0:staff?2:3;
  }
  return {p,action,detail,order};
 }).sort((a,b)=>a.order-b.order||new Date(b.p.created_at||0)-new Date(a.p.created_at||0));
 const myActions=statuses.filter(x=>x.order===0).length;
 const actionHeader='<section class="card proposal-action-overview"><div class="section-head"><div><h3>'+(staff?'Proposal actions':'Your proposal reviews')+'</h3><p>'+(staff?'Next actions based on recorded proposal and client decisions.':'Review published offers and monitor your recorded decisions.')+'</p></div><span class="pill">'+myActions+' item'+(myActions===1?'':'s')+' requiring action</span></div></section>';
 const blocks=statuses.map(({p,action,detail})=>{
  const project=projects.find(pr=>pr.id===p.project_id);
  const ds=decisions.filter(d=>d.proposal_id===p.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  const scopeVersion=scopePackages.find(pkg=>pkg.proposal_id===p.id);
  const superseded=!!scopeVersion&&scopePackages.some(pkg=>pkg.project_id===scopeVersion.project_id&&pkg.version>scopeVersion.version);
  const hasDecision=ds.length>0;
  const publishReady=hasApprover(project?.client_id);
  const canApprove=!((rows.ag_client_member_access||[]).some(a=>a.user_id===userId&&a.client_id===project?.client_id&&a.access_level==='read'))&&approvers.some(a=>a.user_id===userId&&project?.client_id===a.client_id);
  return '<section class="card" data-proposal-card="'+h(p.id)+'" style="margin-bottom:16px"><div class="section-head"><div><p class="eyebrow">'+h(projectName(p.project_id))+'</p><h3>'+h(p.title)+'</h3><p>'+h(money(p.amount_cents,p.currency))+'</p></div><span class="pill">'+h(p.status)+'</span></div><div class="office-proposal-scope">'+h(p.scope)+'</div>'+
   '<div class="action-area" style="margin:12px 0"><button type="button" class="btn alt small" data-print-proposal="'+h(p.id)+'">Review / Print / Save PDF</button>'+(superseded?'<span class="pill">Superseded by a newer scope version</span>':'')+'</div>'+
   '<div class="proposal-next-action"><strong>Next step: '+h(action)+'</strong><p class="tiny muted">'+h(detail)+'</p>'+(staff&&project?'<button type="button" class="btn alt small" data-open-proposal-project="'+h(project.id)+'">Open project</button>':'')+'</div>'+
   '<div class="office-approval-history"><strong>Client decisions</strong>'+ (ds.length?ds.map(d=>'<p class="tiny">'+h(d.decision.replaceAll('_',' '))+' · '+new Date(d.created_at).toLocaleString()+(d.typed_name?' · Acknowledged by '+h(d.typed_name):'')+(d.note?' · '+h(d.note):'')+'</p>').join(''):'<p class="tiny muted">Awaiting review.</p>')+'</div>'+
   (staff&&p.status==='draft'?(publishReady?'<button class="btn alt small" data-publish-proposal="'+h(p.id)+'">Publish to client</button>':'<div class="proposal-publish-warning"><p class="tiny">Client approver required before publication. Add a verified client with Read & respond access and authorize proposal approval.</p><button type="button" class="btn alt small" data-proposal-manage-access>1. Manage client access</button><button type="button" class="btn alt small" data-proposal-assign-approver>2. Assign approver</button></div>'):'')+
   (!staff&&canApprove&&!hasDecision&&!superseded&&p.status==='published'?'<form data-proposal-decision="'+h(p.id)+'"><p class="tiny muted">Review the complete proposal and its scope before recording a decision. Acceptance is recorded with your account, name and timestamp; it is not an external legal e-signature.</p><label class="form-field">Your full name (required for acceptance)<input name="typed_name" maxlength="150" autocomplete="name" placeholder="Enter your name"></label><label class="form-field">Comments (required for revisions)<textarea name="note" maxlength="6000"></textarea></label><label class="proposal-acknowledge"><input type="checkbox" name="scope_acknowledged" value="yes"> I have reviewed the published scope, price, exclusions and payment terms and agree to these exact terms.</label><div class="action-area"><button class="btn alt small" name="decision" value="changes_requested">Request changes</button><button class="btn small" name="decision" value="accepted">Accept proposal</button></div></form>':'')+
  '</section>';
 }).join('');
 const options=projects.map(p=>'<option value="'+h(p.id)+'">'+h(clientName(p.client_id)+' / '+p.title)+'</option>').join('');
 return '<div class="section-head"><div><h2>Proposals & Scope</h2><p>Publish the work being offered and record a decision against its exact terms.</p></div>'+(staff?'<button class="btn" data-new-proposal>+ New proposal</button>':'')+'</div>'+
 '<p class="tiny muted">Proposal acceptance records client intent. Legal contracting and e-signatures are separate, and billing is not triggered by acceptance.</p>'+
 actionHeader+(blocks||'<section class="card"><p class="muted">No proposals to review yet.</p></section>')+'<template id="proposal-project-options">'+options+'</template>';
}
export function deliverablesPage({rows,staff,escape,projectName,clientName}) {
 const h=escape,docs=rows.ag_documents||[],projects=rows.ag_projects||[];
 return '<div class="section-head"><div><h2>Client Deliverables</h2><p>Secure project files and documents with explicit client visibility.</p></div>'+(staff?'<button class="btn" data-new-deliverable>+ Upload deliverable</button>':'')+'</div>'+
 '<section class="card">'+(docs.length?docs.map(d=>'<div class="item"><div><strong>'+h(d.title)+'</strong><small>'+h(projectName(d.project_id))+' · '+(d.visible_to_client?'Shared with client':'Internal')+'</small></div><div class="action-area"><button class="btn alt small" data-download-deliverable="'+h(d.storage_path)+'">Open file</button>'+(staff?'<button class="btn alt small" data-toggle-deliverable="'+h(d.id)+'" data-visible="'+String(!!d.visible_to_client)+'">'+(d.visible_to_client?'Make internal':'Share with client')+'</button>':'')+'</div></div>').join(''):'<div class="empty">No deliverables yet. Files uploaded here stay internal until explicitly shared.</div>')+'</section>'+
 '<template id="deliverable-project-options">'+projects.map(p=>'<option value="'+h(p.id)+'">'+h(clientName(p.client_id)+' / '+p.title)+'</option>').join('')+'</template>';
}
export function proposalWire({root,supabase,rows,staff,userId,escape,reload,notify,openProject}){
 root.querySelectorAll('[data-open-proposal-project]').forEach(b=>b.onclick=()=>openProject?.(b.dataset.openProposalProject));
 root.querySelectorAll('[data-proposal-manage-access]').forEach(button=>button.onclick=()=>root.querySelector('[data-view="clients"]')?.click());
 root.querySelectorAll('[data-proposal-assign-approver]').forEach(button=>button.onclick=()=>root.querySelector('[data-view="studio"]')?.click());
 root.querySelectorAll('[data-print-proposal]').forEach(button=>button.onclick=()=>{
  const proposal=(rows.ag_proposals||[]).find(x=>x.id===button.dataset.printProposal);
  if(!proposal)return;
  const project=(rows.ag_projects||[]).find(x=>x.id===proposal.project_id);
  const client=(rows.ag_clients||[]).find(x=>x.id===project?.client_id);
  const packageSnapshot=staff?(rows.ag_scope_packages||[]).find(x=>x.proposal_id===proposal.id):null;
  if(!openProposalPrint({proposal,project,client,packageSnapshot}))notify('Enable popups for The Office to print or save the proposal.');
 });
 const h=escape;
 const modal=(title,body,onSave)=>{
  const overlay=document.createElement('div');overlay.className='dialog';
  overlay.innerHTML='<div class="dialog-card" role="dialog" aria-modal="true"><h2>'+h(title)+'</h2><form id="proposal-modal-form">'+body+'<div class="dialog-buttons"><button class="btn alt" id="proposal-cancel" type="button">Cancel</button><button class="btn" type="submit">Save</button></div></form></div>';
  document.body.appendChild(overlay);overlay.querySelector('#proposal-cancel').onclick=()=>overlay.remove();
  overlay.onclick=e=>{if(e.target===overlay)overlay.remove();};
  overlay.querySelector('form').onsubmit=async e=>{e.preventDefault();const b=e.target.querySelector('button[type=submit]');b.disabled=true;const ok=await onSave(Object.fromEntries(new FormData(e.target)));if(ok){overlay.remove();await reload();}else b.disabled=false;};
 };
 root.querySelector('[data-new-proposal]')?.addEventListener('click',()=>{
  if(!staff)return;
  const options=root.querySelector('#proposal-project-options')?.innerHTML||'';
  if(!options){notify('Create a project before drafting a proposal.');return;}
  modal('New proposal','<label class="form-field">Project<select name="project_id" required><option value="">Choose project</option>'+options+'</select></label><label class="form-field">Proposal title<input name="title" required maxlength="180"></label><label class="form-field">Scope of work<textarea name="scope" required minlength="10" maxlength="20000"></textarea></label><label class="form-field">Price in dollars (optional)<input type="number" name="amount" min="0" step="0.01" placeholder="2500.00"></label>',async v=>{
   const amount=v.amount===''?null:Math.round(Number(v.amount)*100);
   if(amount!=null&&(!Number.isSafeInteger(amount)||amount<0)){notify('Enter a valid price.');return false;}
   const {error}=await supabase.from('ag_proposals').insert({project_id:v.project_id,title:v.title.trim(),scope:v.scope.trim(),amount_cents:amount,status:'draft',created_by:userId});
   if(error){notify(error.message);return false;}notify('Proposal saved as internal draft.');return true;
  });
 });
 root.querySelectorAll('[data-publish-proposal]').forEach(b=>b.onclick=async()=>{
  if(!staff||!confirm('Publish these fixed proposal terms to the client? Changes require a new proposal.'))return;
  const {data,error}=await supabase.from('ag_proposals').update({status:'published',published_at:new Date().toISOString()}).eq('id',b.dataset.publishProposal).eq('status','draft').select('id').single();
  if(error||!data)notify(error?.message||'Proposal was not published.');else{notify('Proposal published for authorized client review.');await reload();}
 });
 root.querySelectorAll('[data-proposal-decision]').forEach(form=>{
  form.onsubmit=async e=>{
   e.preventDefault();
   const fd=new FormData(form),decision=e.submitter?.value,note=String(fd.get('note')||'').trim();
   const typed_name=String(fd.get('typed_name')||'').trim(),scope_acknowledged=fd.get('scope_acknowledged')==='yes';
   if(!['accepted','changes_requested'].includes(decision))return;
   if(decision==='accepted'&&(typed_name.length<2||typed_name.length>150||!scope_acknowledged)){notify('Enter your name and check the scope acknowledgment before accepting.');return;}
   if(decision==='changes_requested'&&note.length<5){notify('Describe the changes requested (at least five characters).');return;}
   if(!confirm(decision==='accepted'?'Record your acceptance of these exact proposal terms?':'Submit your request for changes?'))return;
   const {error}=await supabase.from('ag_proposal_decisions').insert({proposal_id:form.dataset.proposalDecision,actor_id:userId,decision,note:note||null,typed_name:decision==='accepted'?typed_name:null,scope_acknowledged:decision==='accepted'&&scope_acknowledged});
   if(error)notify(error.message);else{notify('Your proposal decision was recorded.');await reload();}
  };
 });
}
export function deliverablesWire({root,supabase,staff,userId,escape,reload,notify}){
 const bucket=supabase.storage.from('ag-client-deliverables');
 root.querySelectorAll('[data-download-deliverable]').forEach(b=>b.onclick=async()=>{
  const {data,error}=await bucket.createSignedUrl(b.dataset.downloadDeliverable,90);
  if(error){notify(error.message);return;}
  const link=document.createElement('a');link.href=data.signedUrl;link.target='_blank';link.rel='noopener noreferrer';document.body.appendChild(link);link.click();link.remove();
 });
 root.querySelectorAll('[data-toggle-deliverable]').forEach(b=>b.onclick=async()=>{
  if(!staff)return;
  const visible=b.dataset.visible!=='true';
  if(visible&&!confirm('Share this document with everyone authorized for the client project?'))return;
  const {data,error}=await supabase.from('ag_documents').update({visible_to_client:visible}).eq('id',b.dataset.toggleDeliverable).select('id').single();
  if(error||!data){notify(error?.message||'Document visibility was not changed.');return;}notify(visible?'Document shared with client.':'Document made internal.');await reload();
 });
 root.querySelector('[data-new-deliverable]')?.addEventListener('click',()=>{
  if(!staff)return;
  const options=root.querySelector('#deliverable-project-options')?.innerHTML||'';
  if(!options){notify('Create a project before uploading deliverables.');return;}
  const el=document.createElement('div');el.className='dialog';
  el.innerHTML='<div class="dialog-card" role="dialog" aria-modal="true"><h2>Upload client deliverable</h2><p>The file starts internal. Share it after checking the result.</p><form id="deliverable-form"><label class="form-field">Project<select name="project_id" required><option value="">Choose project</option>'+options+'</select></label><label class="form-field">File label<input name="title" maxlength="180" required></label><label class="form-field">File (PDF, PNG, JPG, WebP, TXT or CSV; maximum 20 MB)<input type="file" name="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.csv" required></label><div class="dialog-buttons"><button class="btn alt" type="button" id="deliverable-cancel">Cancel</button><button class="btn" type="submit">Upload privately</button></div></form></div>';
  document.body.appendChild(el);el.querySelector('#deliverable-cancel').onclick=()=>el.remove();
  el.onclick=e=>{if(e.target===el)el.remove();};
  el.querySelector('form').onsubmit=async e=>{
   e.preventDefault();const form=e.target,fd=new FormData(form),file=fd.get('file'),project=String(fd.get('project_id')||''),title=String(fd.get('title')||'').trim();
   const mime={'application/pdf':'pdf','image/png':'png','image/jpeg':'jpg','image/webp':'webp','text/plain':'txt','text/csv':'csv'};
   if(!(file instanceof File)||!mime[file.type]||file.size>20*1024*1024||file.size===0){notify('Unsupported or oversized file.');return;}
   const button=form.querySelector('[type=submit]');button.disabled=true;const path=project+'/'+crypto.randomUUID()+'.'+mime[file.type];
   const up=await bucket.upload(path,file,{contentType:file.type,upsert:false});
   if(up.error){notify('Upload failed: '+up.error.message);button.disabled=false;return;}
   const result=await supabase.from('ag_documents').insert({project_id:project,title,storage_path:path,visible_to_client:false,uploaded_by:userId});
   if(result.error){notify('File stored, but the document record failed. Contact the administrator: '+result.error.message);button.disabled=false;return;}
   el.remove();notify('Document uploaded privately. Share it when ready.');await reload();
  };
 });
}
