// Delivery acceptance evidence for tasks created from an approved scope version.
// Tasks may not be marked Done until staff have verified supporting evidence.
export function deliveryEvidencePanel({task,rows,staff,canWrite,escape}){
 const h=escape;
 const map=(rows.ag_scope_delivery_tasks||[]).find(x=>x.task_id===task.id);
 if(!map)return '';
 const evidence=(rows.ag_task_verifications||[]).find(x=>x.task_id===task.id);
 const state=evidence?.review_status||'not_submitted';
 const statusLabel={not_submitted:'Evidence required',submitted:'Awaiting staff verification',verified:'Verified',rejected:'Evidence rejected'};
 const canSubmit=canWrite&&(!evidence||state==='rejected'&&(staff||evidence.submitted_by===task.currentUserId));
 return '<details class="task-evidence"><summary><span>Delivery verification</span> <span class="pill">'+h(statusLabel[state])+'</span></summary><div class="task-evidence-body">'+
 '<p class="tiny muted">This task belongs to frozen scope v'+h((rows.ag_scope_packages||[]).find(p=>p.id===map.package_id)?.version||'?')+'. Verify acceptance criteria and attach a credible reference before completion.</p>'+
 (evidence?'<div class="task-evidence-record"><strong>Evidence reference</strong><p>'+h(evidence.evidence_reference)+'</p>'+(evidence.notes?'<p class="tiny muted">'+h(evidence.notes)+'</p>':'')+'</div>':'')+
 (canSubmit?'<form data-submit-delivery-evidence="'+h(task.id)+'" class="task-evidence-form"><label class="form-field">Evidence reference (test report, deployment, document path or review record)<input name="evidence_reference" minlength="10" maxlength="2048" required placeholder="Example: staging test report and deployment reference" value="'+h(evidence?.evidence_reference||'')+'"></label><label class="form-field">Verification notes<textarea name="notes" rows="2" maxlength="6000" placeholder="What was tested, which roles and expected result?">'+h(evidence?.notes||'')+'</textarea></label><button class="btn alt small" type="submit">'+(evidence?'Resubmit evidence':'Submit evidence')+'</button></form>':'')+
 (staff&&evidence&&state==='submitted'?'<div class="action-area"><button type="button" class="btn small" data-review-evidence="'+h(task.id)+'" data-decision="verified">Verify delivery evidence</button><button type="button" class="btn alt small" data-review-evidence="'+h(task.id)+'" data-decision="rejected">Request correction</button></div>':'')+
 (state==='verified'?'<p class="tiny muted">Verified by authorized staff. Task can now be marked Done after actual delivery is confirmed.</p>':'')+
 '</div></details>';
}
export function deliveryEvidenceWire({root,rows,staff,userId,supabase,reload,notify}){
 root.querySelectorAll('[data-submit-delivery-evidence]').forEach(form=>form.onsubmit=async event=>{
  event.preventDefault();
  const task=(rows.ag_tasks||[]).find(t=>t.id===form.dataset.submitDeliveryEvidence);if(!task)return;
  const fd=new FormData(form);
  const ref=String(fd.get('evidence_reference')||'').trim(),notes=String(fd.get('notes')||'').trim();
  if(ref.length<10||ref.length>2048){notify('Enter a meaningful evidence reference of 10–2048 characters.');return;}
  const button=form.querySelector('[type=submit]');button.disabled=true;
  const existing=(rows.ag_task_verifications||[]).find(e=>e.task_id===task.id);
  const op=existing
   ?supabase.from('ag_task_verifications').update({evidence_reference:ref,notes,review_status:'submitted'}).eq('task_id',task.id).select('task_id').single()
   :supabase.from('ag_task_verifications').insert({task_id:task.id,project_id:task.project_id,evidence_reference:ref,notes,submitted_by:userId}).select('task_id').single();
  const {data,error}=await op;
  if(error||!data){notify(error?.message||'Evidence could not be submitted.');button.disabled=false;return;}
  notify('Evidence submitted for staff review.');await reload();
 });
 root.querySelectorAll('[data-review-evidence]').forEach(button=>button.onclick=async()=>{
  if(!staff)return;
  const decision=button.dataset.decision,id=button.dataset.reviewEvidence;
  if(!['verified','rejected'].includes(decision))return;
  if(!confirm(decision==='verified'?'Confirm the evidence and expected functionality were actually reviewed?':'Reject this evidence and request corrected verification?'))return;
  button.disabled=true;
  const {data,error}=await supabase.from('ag_task_verifications').update({review_status:decision}).eq('task_id',id).eq('review_status','submitted').select('task_id').single();
  if(error||!data){notify(error?.message||'Evidence review could not be recorded.');button.disabled=false;return;}
  notify('Delivery evidence '+decision+'.');await reload();
 });
}
