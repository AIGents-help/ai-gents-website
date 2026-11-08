// Read-only technical status for a staff-owned Office project.
// No repo/hosting mutations, and no integration tokens in the browser.
import { createClient } from "npm:@supabase/supabase-js@2.80.0";
const allowed=new Set(["https://aigents.help","https://www.aigents.help"]);
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const supaUrl=Deno.env.get("SUPABASE_URL")||"";
const anon=Deno.env.get("SUPABASE_ANON_KEY")||"";
const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const ghToken=Deno.env.get("AG_GITHUB_READ_TOKEN")||"";
const vercelToken=Deno.env.get("AG_VERCEL_READ_TOKEN")||"";
const reply=(code:number,value:unknown,origin:string)=>new Response(JSON.stringify(value),{status:code,headers:{"Content-Type":"application/json","Cache-Control":"no-store","Access-Control-Allow-Origin":origin,"Vary":"Origin","Access-Control-Allow-Headers":"apikey,authorization,content-type,x-client-info","Access-Control-Allow-Methods":"POST,OPTIONS"}});
async function request(url:string,headers:Record<string,string>){
 const ctrl=new AbortController(),deadline=setTimeout(()=>ctrl.abort(),8000);
 try{const response=await fetch(url,{headers,signal:ctrl.signal});if(!response.ok)return {error:response.status===404?"Not found or access restricted":"Provider returned "+response.status};return {value:await response.json()};}
 catch{return {error:"Provider unavailable"};}finally{clearTimeout(deadline);}
}
Deno.serve(async req=>{
 const origin=req.headers.get("origin")||"";
 if(!allowed.has(origin))return new Response("Forbidden",{status:403});
 if(req.method==="OPTIONS")return reply(200,{},origin);
 if(req.method!=="POST")return reply(405,{error:"Method not allowed"},origin);
 const token=req.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
 if(!token||!service)return reply(401,{error:"Authentication required"},origin);
 const userClient=createClient(supaUrl,anon,{auth:{persistSession:false}});
 const {data:identity,error:identityError}=await userClient.auth.getUser(token);
 if(identityError||!identity.user)return reply(401,{error:"Invalid session"},origin);
 const admin=createClient(supaUrl,service,{auth:{persistSession:false}});
 const {data:staff}=await admin.from("ag_staff").select("role").eq("user_id",identity.user.id).maybeSingle();
 if(!staff)return reply(403,{error:"Staff access required"},origin);
 let body:Record<string,unknown>;try{body=await req.json();}catch{return reply(400,{error:"Invalid request"},origin);}
 const id=typeof body.project_id==="string"?body.project_id:"";
 if(!UUID.test(id))return reply(400,{error:"Invalid project"},origin);
 const {data:project}=await admin.from("ag_projects").select("id").eq("id",id).maybeSingle();
 if(!project)return reply(404,{error:"Unknown project"},origin);
 const {data:links,error:linkError}=await admin.from("ag_project_integrations").select("github_repo,vercel_project_id,vercel_team_id").eq("project_id",id).maybeSingle();
 if(linkError)return reply(500,{error:"Unable to load project integrations"},origin);
 if(!links)return reply(200,{github:{state:"unlinked"},vercel:{state:"unlinked"},fetched_at:new Date().toISOString()},origin);
 const out:Record<string,unknown>={fetched_at:new Date().toISOString()};
 if(links.github_repo && /^[\w.-]{1,100}\/[\w.-]{1,100}$/.test(links.github_repo)){
  const base="https://api.github.com/repos/"+links.github_repo;
  const headers:Record<string,string>={"Accept":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28",...(ghToken?{"Authorization":"Bearer "+ghToken}:{})};
  const [metadata,commits,prs]=await Promise.all([
   request(base,headers),request(base+"/commits?per_page=5",headers),request(base+"/pulls?state=open&per_page=5",headers)
  ]);
  out.github=metadata.value?{state:"connected",repo:links.github_repo,default_branch:metadata.value.default_branch,html_url:metadata.value.html_url,latest_commits:Array.isArray(commits.value)?commits.value.map((c:any)=>({sha:String(c.sha||"").slice(0,12),message:String(c.commit?.message||"").split("\n")[0].slice(0,300),date:c.commit?.committer?.date||null,url:c.html_url})):[],open_prs:Array.isArray(prs.value)?prs.value.map((p:any)=>({number:p.number,title:String(p.title||"").slice(0,200),url:p.html_url})):[],warnings:[commits.error,prs.error].filter(Boolean)}:{state:"unavailable",repo:links.github_repo,reason:metadata.error||"Not accessible"};
 }else out.github={state:"unlinked"};
 if(links.vercel_project_id && /^prj_[A-Za-z0-9]+$/.test(links.vercel_project_id)){
  if(!vercelToken)out.vercel={state:"credentials_required",project_id:links.vercel_project_id};
  else{
   const team=links.vercel_team_id&&/^team_[A-Za-z0-9]+$/.test(links.vercel_team_id)?links.vercel_team_id:"";
   const result=await request("https://api.vercel.com/v6/deployments?projectId="+encodeURIComponent(links.vercel_project_id)+"&limit=5"+(team?"&teamId="+encodeURIComponent(team):""),{"Authorization":"Bearer "+vercelToken});
   out.vercel=result.value?{state:"connected",project_id:links.vercel_project_id,deployments:(result.value.deployments||[]).map((d:any)=>({state:d.state||d.readyState||"UNKNOWN",target:d.target||null,commit:d.meta?.githubCommitSha||null,url:d.url||null,created:d.created||null}))}:{state:"unavailable",project_id:links.vercel_project_id,reason:result.error};
  }
 }else out.vercel={state:"unlinked"};
 return reply(200,out,origin);
});
