// Client conversation triage using existing Office records. No claims of unread status:
 // A reply candidate means the newest project message came from another participant,
 // not necessarily that the owner or a teammate has seen it.
export function clientFollowupPage({rows,escape,staff,userId,teamRole,projectName}) {
 const h=escape,projects=rows.ag_projects||[],messages=rows.ag_messages||[],tasks=rows.ag_tasks||[],members=rows.ag_team_members||[],assignments=rows.ag_team_assignments||[],clientUsers=rows.ag_client_users||[];
 const writable=id=>staff||assignments.some(a=>a.project_id===id&&a.user_id===userId&&a.access_level==='write');
 const active=projects.filter(p=>p.status!=='completed');
 const interactions=active.map(p=>{
  const thread=messages.filter(m=>m.project_id===p.id&&!m.internal_only).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  const latest=thread[0],fromClient=!!latest&&clientUsers.some(u=>u.user_id===latest.sender_id&&u.client_id===p.client_id);
  const fromAnother=!!latest&&latest.sender_id!==userId;
  const pending=tasks.filter(t=>t.project_id===p.id&&!['done','completed'].includes(t.status));
  const assigned=assignments.filter(a=>a.project_id===p.id&&members.some(m=>m.user_id===a.user_id&&m.active));
  return {p,latest,fromClient,fromAnother,pending,assigned};
 });
 const candidates=interactions.filter(x=>x.latest&&x.fromAnother).sort((a,b)=>new Date(b.latest.created_at)-new Date(a.latest.created_at));
 const tasksDue=interactions.flatMap(x=>x.pending.filter(t=>t.due_date).map(t=>({p:x.p,t}))).sort((a,b)=>a.t.due_date.localeCompare(b.t.due_date));
 const today=new Date().toISOString().slice(0,10);
 const noAssignment=staff?interactions.filter(x=>!x.assigned.length):[];
 return '<section class="card" style="margin-top:20px">'+
 '<div class="section-head"><div><h3>Client interaction queue</h3><p>Messages that may need follow-up, upcoming work and coverage gaps. Nothing is silently marked read.</p></div><button type="button" class="btn alt small" data-view="messages">All conversations</button></div>'+
 '<div class="grid" style="margin:12px 0 20px">'+
 '<div class="card"><p class="eyebrow">Potential replies</p><div class="stat">'+candidates.length+'</div></div>'+
 '<div class="card"><p class="eyebrow">Open assigned work</p><div class="stat">'+interactions.reduce((n,x)=>n+x.pending.length,0)+'</div></div>'+
 (staff?'<div class="card"><p class="eyebrow">Projects without a team assignee</p><div class="stat">'+noAssignment.length+'</div></div>':'')+
 '</div>'+
 '<h4 style="margin:18px 0 10px">Recent conversations</h4>'+
 (candidates.length?candidates.slice(0,6).map(x=>'<div class="item"><div><strong>'+h(x.p.title)+'</strong><small>'+h(x.fromClient?'Latest message from a client':'Latest message from another participant')+' · '+h(new Date(x.latest.created_at).toLocaleString())+'</small><p class="tiny">'+h(String(x.latest.body||'').slice(0,190))+'</p></div><div class="action-area"><span class="pill">'+h(writable(x.p.id)?'Can respond':'Read only')+'</span><button type="button" class="btn alt small" data-followup-project="'+h(x.p.id)+'">Open</button></div></div>').join(''):'<p class="tiny muted">No recent messages from other participants. This does not confirm all conversations have been reviewed.</p>')+
 '<h4 style="margin:20px 0 10px">Upcoming and overdue tasks</h4>'+
 (tasksDue.length?tasksDue.slice(0,6).map(x=>'<div class="item"><div><strong>'+h(x.t.title)+'</strong><small>'+h(x.p.title)+' · '+(x.t.due_date<today?'Overdue':'Due')+' '+h(x.t.due_date)+'</small></div><button type="button" class="btn alt small" data-followup-tasks>View tasks</button></div>').join(''):'<p class="tiny muted">No dated open tasks have been recorded.</p>')+
 (staff?'<h4 style="margin:20px 0 10px">Delegation coverage</h4>'+(noAssignment.length?noAssignment.slice(0,6).map(x=>'<div class="item"><div><strong>'+h(x.p.title)+'</strong><small>No active employee or contractor is assigned yet.</small></div><button type="button" class="btn alt small" data-followup-team>Assign team</button></div>').join(''):'<p class="tiny muted">All active projects have at least one active team assignment.</p>'):'')+
 '<p class="tiny muted" style="margin-top:18px">Potential replies are based on the latest message sender, not a read receipt or guaranteed outstanding request. Tasks and coverage are drawn from current Office project records.</p>'+
 '</section>';
}
export function clientFollowupWire({root,onProject,onTasks,onTeam,onMessages}){
 root.querySelectorAll('[data-followup-project]').forEach(b=>b.onclick=()=>onProject(b.dataset.followupProject));
 root.querySelectorAll('[data-followup-tasks]').forEach(b=>b.onclick=onTasks);
 root.querySelectorAll('[data-followup-team]').forEach(b=>b.onclick=onTeam);
 const all=root.querySelector('.card [data-view="messages"]');if(all)all.onclick=onMessages;
}
