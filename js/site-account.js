import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.80.0';
const links=document.querySelectorAll('.nav-account');
if(links.length){
 const client=createClient('https://apcvfezfmegqqjuonrgl.supabase.co','sb_publishable_zV6w0DBZzfe4oX2OCSYZmg_dp1OvBn0',{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
 const update=async()=>{
  const {data,error}=await client.auth.getUser();
  const signed=!!data?.user&&!error;
  links.forEach(a=>{a.textContent=signed?'My Account':'Account / Sign in';a.href=signed?'/office?view=profile':'/office';a.setAttribute('aria-label',signed?'Open your AI Gents account profile':'Sign in to your AI Gents account');});
 };
 update();
 client.auth.onAuthStateChange((_event,session)=>{const signed=!!session?.user;links.forEach(a=>{a.textContent=signed?'My Account':'Account / Sign in';a.href=signed?'/office?view=profile':'/office';a.setAttribute('aria-label',signed?'Open your AI Gents account profile':'Sign in to your AI Gents account');});});
}
