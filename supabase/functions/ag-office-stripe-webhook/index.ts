// Stripe event receiver for the existing AI Gents account. Test-mode only until audited live launch.
// Requires AG_STRIPE_TEST_WEBHOOK_SECRET; rejects unsigned, stale, foreign-account and live events.
import { createClient } from "npm:@supabase/supabase-js@2.80.0";
const ACCOUNT="acct_1T7vi0JgQWDNmZYh";
const KEY=Deno.env.get("AG_STRIPE_TEST_WEBHOOK_SECRET")||"";
const URL=Deno.env.get("SUPABASE_URL")||"";
const SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const events:Record<string,string>={
 "invoice.finalized":"open",
 "invoice.paid":"paid",
 "invoice.voided":"void",
 "invoice.marked_uncollectible":"uncollectible",
 "invoice.payment_failed":"open"
};
const answer=(status:number,value:string)=>new Response(value,{status,headers:{"Cache-Control":"no-store","Content-Type":"text/plain"}});
async function verified(payload:string,header:string){
 const fields=header.split(",").map(s=>s.trim());
 const timestamp=fields.find(x=>x.startsWith("t="))?.slice(2);
 const signatures=fields.filter(x=>x.startsWith("v1=")).map(x=>x.slice(3));
 if(!timestamp||!/^\d+$/.test(timestamp)||!signatures.length)return false;
 if(Math.abs(Date.now()/1000-Number(timestamp))>300)return false;
 const raw=new TextEncoder().encode(timestamp+"."+payload);
 const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(KEY),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const mac=new Uint8Array(await crypto.subtle.sign("HMAC",key,raw));
 const hex=[...mac].map(x=>x.toString(16).padStart(2,"0")).join("");
 // Avoid early comparison exit for equal-size values.
 return signatures.some(v=>{if(v.length!==hex.length||!/^[0-9a-f]{64}$/i.test(v))return false;let difference=0;for(let i=0;i<hex.length;i++)difference|=hex.charCodeAt(i)^v.toLowerCase().charCodeAt(i);return difference===0;});
}
Deno.serve(async(req)=>{
 if(req.method!=="POST")return answer(405,"Method not allowed");
 if(!KEY.startsWith("whsec_")||!URL||!SERVICE)return answer(503,"Webhook configuration incomplete");
 const payload=await req.text();
 if(payload.length>512000)return answer(413,"Payload too large");
 const signature=req.headers.get("stripe-signature")||"";
 if(!await verified(payload,signature))return answer(400,"Invalid Stripe signature");
 let event:Record<string,any>;
 try{event=JSON.parse(payload);}catch{return answer(400,"Invalid JSON");}
 if(typeof event.id!=="string"||!event.id.startsWith("evt_")||event.livemode!==false)return answer(400,"Invalid event mode");
 if(event.account&&event.account!==ACCOUNT)return answer(400,"Unexpected account");
 const status=events[event.type];
 if(!status)return answer(200,"Ignored event");
 const invoice=event.data?.object;
 if(!invoice||invoice.object!=="invoice"||typeof invoice.id!=="string"||!invoice.id.startsWith("in_"))
  return answer(400,"Invalid invoice event");
 const admin=createClient(URL,SERVICE,{auth:{persistSession:false}});
 const {data:existing}=await admin.from("ag_stripe_event_receipts").select("event_id").eq("event_id",event.id).maybeSingle();
 if(existing)return answer(200,"Already processed");
 const {data:local,error:lookupError}=await admin.from("ag_invoices")
  .select("id,status,external_stripe_invoice_id").eq("external_stripe_invoice_id",invoice.id)
  .eq("stripe_account_id",ACCOUNT).eq("stripe_livemode",false).maybeSingle();
 if(lookupError)return answer(500,"Invoice lookup unavailable");
 if(!local)return answer(200,"Not an Office invoice");
 // Never downgrade a paid invoice on out-of-order webhook delivery.
 const next=local.status==="paid"?"paid":status;
 const update:Record<string,unknown>={status:next,stripe_synced_at:new Date().toISOString()};
 if(typeof invoice.number==="string")update.invoice_number=invoice.number;
 if(typeof invoice.hosted_invoice_url==="string" && invoice.hosted_invoice_url.startsWith("https://"))update.hosted_invoice_url=invoice.hosted_invoice_url;
 const {error:updateError}=await admin.from("ag_invoices").update(update).eq("id",local.id);
 if(updateError)return answer(500,"Invoice reconciliation failed");
 const {error:receiptError}=await admin.from("ag_stripe_event_receipts")
 .insert({event_id:event.id,stripe_account_id:ACCOUNT,livemode:false,event_type:event.type,stripe_invoice_id:invoice.id});
 if(receiptError){
  if(receiptError.code==="23505")return answer(200,"Already processed");
  return answer(500,"Event receipt not stored");
 }
 return answer(200,"Recorded");
});
