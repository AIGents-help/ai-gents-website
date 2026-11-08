// AI Gents Office Stripe test-only draft preparation.
// This Edge Function is intentionally fail-closed until an AI Gents TEST restricted key is installed.
// Never send, finalize, collect, or create live invoices here.
import { createClient } from "npm:@supabase/supabase-js@2.80.0";
const PROJECT="acct_1T7vi0JgQWDNmZYh";
const ORIGINS=new Set(["https://aigents.help","https://www.aigents.help"]);
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const url=Deno.env.get("SUPABASE_URL")||"";
const anon=Deno.env.get("SUPABASE_ANON_KEY")||"";
const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const stripeKey=Deno.env.get("AG_STRIPE_TEST_RESTRICTED_KEY")||"";
const enabled=Deno.env.get("AG_STRIPE_TEST_ENABLED")==="true";
function respond(status:number,value:unknown,origin:string){
 return new Response(JSON.stringify(value),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store","Vary":"Origin","Access-Control-Allow-Origin":origin,"Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Allow-Methods":"POST,OPTIONS"}});
}
async function stripe(method:string,path:string,parameters?:URLSearchParams,idempotency?:string){
 const response=await fetch("https://api.stripe.com/v1/"+path,{
  method,headers:{"Authorization":"Bearer "+stripeKey,"Stripe-Version":"2026-09-30.endive",...(parameters?{"Content-Type":"application/x-www-form-urlencoded"}:{}),...(idempotency?{"Idempotency-Key":idempotency}:{})},
  body:parameters?.toString()
 });
 const json=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error("Stripe request rejected: "+String(json?.error?.type||response.status));
 return json;
}
const form=(input:Record<string,string|number|null|undefined>)=>{
 const p=new URLSearchParams();for(const [k,v] of Object.entries(input)){if(v!=null)p.set(k,String(v));}return p;
};
Deno.serve(async(req)=>{
 const origin=req.headers.get("origin")||"";
 if(!ORIGINS.has(origin))return new Response("Origin not allowed",{status:403});
 if(req.method==="OPTIONS")return respond(200,{},origin);
 if(req.method!=="POST")return respond(405,{error:"Method not allowed"},origin);
 const token=req.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
 if(!token)return respond(401,{error:"Sign in required"},origin);
 const userClient=createClient(url,anon,{auth:{persistSession:false}});
 const {data:identity,error:identityError}=await userClient.auth.getUser(token);
 if(identityError||!identity.user)return respond(401,{error:"Invalid session"},origin);
 if(!service)return respond(503,{error:"Billing gateway unavailable"},origin);
 const admin=createClient(url,service,{auth:{persistSession:false}});
 const {data:role,error:roleError}=await admin.from("ag_staff").select("role").eq("user_id",identity.user.id).maybeSingle();
 if(roleError||!role||!["owner","admin"].includes(role.role))return respond(403,{error:"Billing administrator access required"},origin);
 let input:Record<string,unknown>;
 try{input=await req.json();}catch{return respond(400,{error:"Invalid JSON"},origin);}
 if(input.action==="status")return respond(200,{test_ready:enabled&&stripeKey.startsWith("rk_test_"),live_ready:false,account:PROJECT,mode:"test_only"},origin);
 if(input.action!=="prepare_test_draft")return respond(400,{error:"Unsupported operation"},origin);
 if(!enabled||!stripeKey.startsWith("rk_test_"))return respond(503,{error:"Test billing is not configured"},origin);
 const id=typeof input.invoice_id==="string"?input.invoice_id:"";
 if(!UUID.test(id))return respond(400,{error:"Invalid invoice reference"},origin);
 const {data:invoice,error:invoiceError}=await admin.from("ag_invoices").select("id,client_id,project_id,amount_cents,currency,status,due_date,description,external_stripe_invoice_id").eq("id",id).maybeSingle();
 if(invoiceError||!invoice)return respond(404,{error:"Invoice not found"},origin);
 if(invoice.external_stripe_invoice_id)return respond(409,{error:"Invoice is already linked to Stripe"},origin);
 if(invoice.status!=="draft"||invoice.currency!=="usd"||!Number.isSafeInteger(Number(invoice.amount_cents))||Number(invoice.amount_cents)<=0)
  return respond(422,{error:"Only positive USD drafts may be prepared"},origin);
 const {data:client,error:clientError}=await admin.from("ag_clients").select("id,company,contact_email").eq("id",invoice.client_id).single();
 if(clientError||!client||!client.contact_email||!/^\S+@\S+\.\S+$/.test(client.contact_email))return respond(422,{error:"Client needs a valid contact email"},origin);
 try{
  const account=await stripe("GET","account");
  if(account.id!==PROJECT)return respond(409,{error:"Stripe account identity mismatch"},origin);
  let {data:link,error:linkError}=await admin.from("ag_stripe_customer_links").select("stripe_customer_id").eq("client_id",client.id).eq("stripe_account_id",PROJECT).eq("livemode",false).maybeSingle();
  if(linkError)throw new Error("Customer mapping lookup failed");
  let customer=link?.stripe_customer_id;
  if(!customer){
   const created=await stripe("POST","customers",form({name:client.company,email:client.contact_email,"metadata[office_client_id]":client.id}),"ag-office-test-customer-"+client.id);
   customer=created.id;
   const {error:mappingError}=await admin.from("ag_stripe_customer_links").upsert({client_id:client.id,stripe_account_id:PROJECT,livemode:false,stripe_customer_id:customer},{onConflict:"client_id,stripe_account_id,livemode"});
   if(mappingError)throw new Error("Customer mapping save failed");
  }
  const draft=await stripe("POST","invoices",form({customer,collection_method:"send_invoice",auto_advance:"false",currency:"usd","metadata[office_invoice_id]":invoice.id,"metadata[office_client_id]":client.id,"description":invoice.description||"AI Gents professional services"}),"ag-office-test-invoice-"+invoice.id);
  await stripe("POST","invoiceitems",form({customer,invoice:draft.id,amount:Number(invoice.amount_cents),currency:"usd",description:invoice.description||"AI Gents professional services"}),"ag-office-test-item-"+invoice.id);
  const {error:saveError}=await admin.from("ag_invoices").update({external_stripe_invoice_id:draft.id,stripe_account_id:PROJECT,stripe_livemode:false,stripe_synced_at:new Date().toISOString()}).eq("id",id).is("external_stripe_invoice_id",null);
  if(saveError)throw new Error("Stripe draft created, but local invoice linking needs reconciliation");
  return respond(200,{status:"test_draft_created",stripe_invoice_id:draft.id,livemode:false},origin);
 }catch(err){return respond(502,{error:String(err instanceof Error?err.message:"Stripe preparation failed")},origin);}
});
