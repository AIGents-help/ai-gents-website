const HEADER="AI GENTS | PROJECT PROGRESS REPORT";
export function standardProgressPrompt(name){
 return HEADER+"\n\nReview all available context of this project. Do not modify files or take actions. Output ONLY this factual report, ready to paste into AI Gents — The Office. Never invent verification, deployments, metrics or completion percentages. Mark unknown facts clearly.\n\nPROJECT: "+name+"\nREPORT DATE: [date if known]\nAI PLATFORM: [ChatGPT / Claude / Codex / Other]\n\n1. PROJECT OBJECTIVE — purpose and expected outcome\n2. COMPLETED WORK — only delivered or verified features, fixes and artifacts\n3. CURRENT STATUS — phase, what works, deployment verification\n4. REMAINING WORK — prioritized outstanding work\n5. ISSUES & BLOCKERS — technical/business dependencies\n6. NEXT RECOMMENDED ACTIONS — three concrete priorities\n7. OWNER DECISIONS REQUIRED — approvals, credentials, spending or decisions\n8. TECHNICAL REFERENCES — repository, branch, commit/PR, deployment, database, if known\n9. OVERALL PROGRESS — justified estimate or Unable to estimate; phase; On Track/At Risk/Blocked/Complete\n\nDistinguish verified facts from proposed or assumed work. Do not imply a successful deployment proves full functional correctness. Keep the original report concise, specific and complete.";
}
export function progressPage({rows,escape,staff,projectName}) {
 const h=escape,projects=rows.ag_projects||[],links=rows.ag_project_integrations||[],reports=rows.ag_project_progress_reports||[];
 if(!staff)return '<section class="card"><p>Project development reports are internal.</p></section>';
 const options=projects.map(p=>'<option value="'+h(p.id)+'">'+h(p.title)+'</option>').join('');
 return '<div class="section-head"><div><h2>Project Progress Updates</h2><p>One consistent report, using GitHub / Vercel technical facts and a pasted AI summary.</p></div></div>'+
 (!projects.length?'<section class="card">Add an Office project first. No sample projects will be created.</section>':
 '<section class="card" style="margin-bottom:18px"><label class="form-field">Project<select id="progress-project-select">'+options+'</select></label><p class="tiny muted">Technical status is read-only. Linking a repository does not create or modify it.</p></section>'+
 '<div class="two"><section class="card"><div class="section-head"><h3>Technical activity</h3><button class="btn alt small" id="progress-refresh" type="button">Refresh</button></div><div id="progress-tech" aria-live="polite"><p class="muted">Select a project to fetch verified source activity.</p></div><form id="progress-link-form"><label class="form-field">GitHub repository <input name="github_repo" placeholder="organization/repository" maxlength="201"></label><label class="form-field">Vercel project ID <input name="vercel_project_id" placeholder="prj_…" maxlength="120"></label><label class="form-field">Vercel team ID (optional) <input name="vercel_team_id" placeholder="team_…" maxlength="120"></label><button class="btn alt small" type="submit">Save existing links</button></form></section>'+
 '<section class="card"><h3>AI progress summary</h3><p class="tiny muted">Copy into the AI building the project, then paste its answer below. Reports stay intact and timestamped.</p><div class="action-area" style="margin:14px 0"><button class="btn alt small" id="progress-copy-prompt" type="button">Copy standard prompt</button></div><form id="progress-submit-form"><label class="form-field">AI platform<select name="platform"><option>ChatGPT</option><option>Claude</option><option>Codex</option><option>Other</option></select></label><label class="form-field">Progress report<textarea name="report_text" rows="11" minlength="40" maxlength="30000" required placeholder="Paste the completed AI progress report here…"></textarea></label><button class="btn" type="submit">Save progress update</button></form></section></div>'+
 '<section class="card" style="margin-top:18px"><div class="section-head"><h3>Progress history</h3><p class="tiny muted">Original submissions · Most recent first</p></div><div id="progress-history"></div></section>')+
 '<p class="tiny muted">GitHub commits and Vercel deployments show technical activity, not verified business completion. No automatic percentage is inferred.</p>';
}
export function progressWire({root,supabase,rows,staff,userId,reload,notify,escape}){
 if(!staff)return;
 const h=escape,projects=rows.ag_projects||[],links=rows.ag_project_integrations||[],reports=rows.ag_project_progress_reports||[];
 const select=root.querySelector('#progress-project-select');
 if(!select)return;
 const linkForm=root.querySelector('#progress-link-form'),reportForm=root.querySelector('#progress-submit-form'),history=root.querySelector('#progress-history'),tech=root.querySelector('#progress-tech'),refresh=root.querySelector('#progress-refresh');
 const selected=()=>projects.find(p=>p.id===select.value);
 function drawHistory(){
  const matches=reports.filter(r=>r.project_id===select.value).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  history.innerHTML=matches.length?matches.map((r,i)=>'<details '+(i===0?'open':'')+' class="progress-report"><summary><strong>'+h(r.platform)+'</strong> · '+new Date(r.created_at).toLocaleString()+'</summary><pre class="progress-report-content">'+h(r.report_text)+'</pre></details>').join(''):'<p class="muted">No AI update submitted for this project yet.</p>';
 }
 function drawLinks(){
  const record=links.find(l=>l.project_id===select.value);
  linkForm.elements.github_repo.value=record?.github_repo||'';
  linkForm.elements.vercel_project_id.value=record?.vercel_project_id||'';
  linkForm.elements.vercel_team_id.value=record?.vercel_team_id||'';
 }
 const external=(url,label)=>typeof url==='string'&&/^https:\/\/[\w.-]+(?:[/:?#][^\s]*)?$/i.test(url)?'<a href="'+h(url)+'" target="_blank" rel="noopener noreferrer">'+h(label)+'</a>':h(label);
 const provider=(name,obj)=>{
  if(!obj||obj.state==='unlinked')return '<div class="progress-provider"><strong>'+h(name)+'</strong><p class="tiny muted">No project link saved.</p></div>';
  if(obj.state!=='connected')return '<div class="progress-provider"><strong>'+h(name)+'</strong><p class="tiny muted">'+h(obj.state==='credentials_required'?'Read-only provider token is not configured.':obj.reason||'Not accessible')+'</p></div>';
  if(name==='GitHub')return '<div class="progress-provider"><strong>'+h(name)+'</strong><p class="tiny">'+external(obj.html_url,obj.repo)+' · '+h(obj.default_branch||'')+'</p><p class="eyebrow">Recent commits</p>'+((obj.latest_commits||[]).length?(obj.latest_commits||[]).map(c=>'<p class="tiny">'+external(c.url,c.sha)+' — '+h(c.message)+' <span class="muted">'+h(c.date?new Date(c.date).toLocaleDateString():'')+'</span></p>').join(''):'<p class="tiny muted">No accessible commits.</p>')+'<p class="eyebrow">Open pull requests</p>'+((obj.open_prs||[]).length?(obj.open_prs||[]).map(p=>'<p class="tiny">'+external(p.url,'#'+p.number+' '+p.title)+'</p>').join(''):'<p class="tiny muted">None returned.</p>')+'</div>';
  return '<div class="progress-provider"><strong>Vercel deployments</strong>'+((obj.deployments||[]).length?(obj.deployments||[]).map(d=>'<p class="tiny"><strong>'+h(d.state)+'</strong> · '+h(d.target||'deployment')+' · '+(d.url?external('https://'+d.url,d.url):'')+' · '+h(d.commit?d.commit.slice(0,10):'')+'</p>').join(''):'<p class="tiny muted">No deployments returned.</p>')+'</div>';
 };
 async function refreshSources(){
  refresh.disabled=true;tech.innerHTML='<p class="muted">Reading existing GitHub / Vercel activity…</p>';
  const id=select.value;
  const {data,error}=await supabase.functions.invoke('ag-project-source-status',{body:{project_id:id}});
  if(select.value!==id){refresh.disabled=false;return;}
  tech.innerHTML=error?'<p class="tiny muted">Source check unavailable. Verify the connection or permissions.</p>':provider('GitHub',data.github)+provider('Vercel',data.vercel)+'<p class="tiny muted">Checked '+h(data.fetched_at?new Date(data.fetched_at).toLocaleString():'now')+'. Source facts do not determine percent complete.</p>';
  refresh.disabled=false;
 }
 select.onchange=()=>{drawLinks();drawHistory();refreshSources();};
 refresh.onclick=refreshSources;
 linkForm.onsubmit=async e=>{
  e.preventDefault();
  const v=Object.fromEntries(new FormData(linkForm));
  const github=String(v.github_repo||'').trim(),vercel=String(v.vercel_project_id||'').trim(),team=String(v.vercel_team_id||'').trim();
  if(github&&!/^[A-Za-z0-9_.-]{1,100}\/[A-Za-z0-9_.-]{1,100}$/.test(github)){notify('Use an existing GitHub owner/repository.');return;}
  if(vercel&&!/^prj_[A-Za-z0-9]+$/.test(vercel)){notify('Enter a valid Vercel project ID.');return;}
  if(team&&!/^team_[A-Za-z0-9]+$/.test(team)){notify('Enter a valid Vercel team ID.');return;}
  const btn=linkForm.querySelector('[type=submit]');btn.disabled=true;
  const {error}=await supabase.from('ag_project_integrations').upsert({project_id:select.value,github_repo:github||null,vercel_project_id:vercel||null,vercel_team_id:team||null,updated_by:userId,updated_at:new Date().toISOString()},{onConflict:'project_id'});
  if(error){notify(error.message);btn.disabled=false;return;}
  notify('Project source links saved; no repositories or deployments created.');await reload();
 };
 root.querySelector('#progress-copy-prompt').onclick=async()=>{
  try{await navigator.clipboard.writeText(standardProgressPrompt(selected()?.title||'Project'));notify('Standard project progress prompt copied.');}
  catch{notify('Copy was blocked by the browser. Select and copy the report prompt manually.');}
 };
 reportForm.onsubmit=async e=>{
  e.preventDefault();const v=Object.fromEntries(new FormData(reportForm));const text=String(v.report_text||'').trim();
  if(text.length<40||text.length>30000){notify('Report must be 40–30,000 characters.');return;}
  const btn=reportForm.querySelector('[type=submit]');btn.disabled=true;
  const {error}=await supabase.from('ag_project_progress_reports').insert({project_id:select.value,platform:v.platform,report_text:text,submitted_by:userId,source:'ai_paste'});
  if(error){notify(error.message);btn.disabled=false;return;}notify('Progress report saved to project history.');await reload();
 };
 drawLinks();drawHistory();refreshSources();
}
