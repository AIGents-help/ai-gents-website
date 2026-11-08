// Owner-controlled delegation for AI Gents Office.
// Users receive scoped assignments, never automatic broad ag_staff privileges.
import {createClient} from "npm:@supabase/supabase-js@2.80.0";
const url=Deno.env.get("SUPABASE_URL")||"",anon=Deno.env.get("SUPABASE_ANON_KEY")||"",service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const origins=new Set(["https://aigents.help","https://www.aigents.help"]);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const emailFormat=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function result(code:number,value:object,origin:string){return new Response(JSON.stringify(value),{status:code,headers:{"Content-Type":"application/json","Cache-Control":"no-store","Access-Control-Allow-Origin":origin,"Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Allow-Methods":"POST,OPTIONS","Vary":"Origin"}});}
Deno.serve(async req=>{
 const origin=req.headers.get("origin")||"";
 if(!origins.has(origin))return new Response("Forbidden",{status:403});
 if(req.method==="OPTIONS")return result(200,{},origin);
 if(req.method!=="POST")return result(405,{error:"Method not allowed"},origin);
 if(!url||!anon||!service)return result(503,{error:"Account service unavailable"},origin);
 const bearer=req.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
 if(!bearer)return result(401,{error:"Sign in required"},origin);
 const auth=createClient(url,anon,{auth:{persistSession:false}});
 const {data:identity,error:authError}=await auth.auth.getUser(bearer);
 if(authError||!identity.user)return result(401,{error:"Invalid session"},origin);
 const admin=createClient(url,service,{auth:{persistSession:false}});
 const {data:operator,error:operatorError}=await admin.from("ag_staff").select("role").eq("user_id",identity.user.id).maybeSingle();
 if(operatorError||operator?.role!=="owner")return result(403,{error:"Only the Office owner may manage team roles"},origin);
 let body:Record<string,unknown>;try{body=await req.json()}catch{return result(400,{error:"Invalid request"},origin)}
 const action=String(body.action||"");
 try{
  if(action==="invite_team"){
   const email=String(body.email||"").trim().toLowerCase(),role=String(body.role||""),project=String(body.project_id||""),access=String(body.access_level||"");
   if(!emailFormat.test(email)||email.length>254||!["employee","contractor"].includes(role)||!uuid.test(project)||!["read","write"].includes(access))return result(400,{error:"Provide valid email, role, project and access level"},origin);
   const {data:existingProject}=await admin.from("ag_projects").select("id").eq("id",project).maybeSingle();
   if(!existingProject)return result(404,{error:"Project does not exist"},origin);
   let found:null|{id:string;email?:string;email_confirmed_at?:string}=null;
   for(let page=1;page<=10;page++){
    const {data:users,error}=await admin.auth.admin.listUsers({page,perPage:100});
    if(error)return result(503,{error:"Unable to check existing accounts"},origin);
    found=(users.users||[]).find(u=>u.email?.toLowerCase()===email)||null;
    if(found||users.users.length<100)break;
   }
   let user=found;
   if(user){
    if(!user.email_confirmed_at)return result(409,{error:"Existing account must verify its email before team access is assigned"},origin);
   }else{
    const {data:invited,error}=await admin.auth.admin.inviteUserByEmail(email,{redirectTo:"https://aigents.help/office"});
    if(error||!invited.user)return result(409,{error:"Invitation could not be delivered. Check the account email settings."},origin);
    user=invited.user;
   }
   const {data:privileged}=await admin.from("ag_staff").select("role").eq("user_id",user.id).maybeSingle();
   if(privileged)return result(409,{error:"This account already has an internal staff role. Manage privileged staff separately."},origin);
   const {error:memberError}=await admin.from("ag_team_members").upsert({user_id:user.id,email,role,active:true,invited_by:identity.user.id},{onConflict:"user_id"});
   if(memberError)return result(500,{error:"Could not save team membership"},origin);
   const {error:assignError}=await admin.from("ag_team_assignments").upsert({user_id:user.id,project_id:project,access_level:access,assigned_by:identity.user.id},{onConflict:"user_id,project_id"});
   if(assignError)return result(500,{error:"Membership recorded but project assignment failed"},origin);
   return result(200,{status:found?"assigned_existing":"invited",message:found?"Existing verified user assigned":"Invitation sent; project access activates on verified login"},origin);
  }
  if(action==="set_team_access"){
   const id=String(body.user_id||""),project=String(body.project_id||""),access=String(body.access_level||"");
   if(!uuid.test(id)||!uuid.test(project)||!["read","write","remove"].includes(access))return result(400,{error:"Invalid assignment"},origin);
   const {data:member}=await admin.from("ag_team_members").select("user_id").eq("user_id",id).maybeSingle();
   const {data:pr}=await admin.from("ag_projects").select("id").eq("id",project).maybeSingle();
   if(!member||!pr)return result(404,{error:"Member or project not found"},origin);
   const op=access==="remove"?await admin.from("ag_team_assignments").delete().eq("user_id",id).eq("project_id",project):await admin.from("ag_team_assignments").upsert({user_id:id,project_id:project,access_level:access,assigned_by:identity.user.id},{onConflict:"user_id,project_id"});
   if(op.error)return result(500,{error:"Could not update assignment"},origin);
   return result(200,{status:"updated"},origin);
  }
  if(action==="set_team_active"){
   const id=String(body.user_id||"");if(!uuid.test(id)||typeof body.active!=="boolean")return result(400,{error:"Invalid team account"},origin);
   const {data,error}=await admin.from("ag_team_members").update({active:body.active}).eq("user_id",id).select("user_id").maybeSingle();
   if(error||!data)return result(404,{error:"Member not found or update failed"},origin);
   return result(200,{status:body.active?"active":"disabled"},origin);
  }
  if(action==="set_client_access"){
   const client=String(body.client_id||""),id=String(body.user_id||""),access=String(body.access_level||"");
   if(!uuid.test(client)||!uuid.test(id)||!["read","write"].includes(access))return result(400,{error:"Invalid client permission"},origin);
   const {data:linked}=await admin.from("ag_client_users").select("user_id").eq("client_id",client).eq("user_id",id).maybeSingle();
   if(!linked)return result(404,{error:"Client membership not found"},origin);
   const {error}=await admin.from("ag_client_member_access").upsert({client_id:client,user_id:id,access_level:access,updated_by:identity.user.id},{onConflict:"user_id,client_id"});
   if(error)return result(500,{error:"Could not save client permission"},origin);
   return result(200,{status:"updated"},origin);
  }
  return result(400,{error:"Unsupported action"},origin);
 }catch{return result(500,{error:"Account management failed"},origin)}
});
