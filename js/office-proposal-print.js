// Printable proposal derived only from an authorized Office proposal record.
// Uses native browser Print → Save as PDF; no third-party document service.
export function openProposalPrint({proposal,project,client,packageSnapshot}){
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const usd=cents=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(cents||0)/100);
 const label=packageSnapshot?'Scope version '+packageSnapshot.version:'Proposal';
 const safeTitle=esc(proposal.title);
 const rows=packageSnapshot?.items||[];
 const itemized=rows.length?'<table><thead><tr><th>Included component</th><th>Qty</th><th class="num">Implementation</th><th class="num">Monthly service</th></tr></thead><tbody>'+
 rows.map(item=>'<tr><td><strong>'+esc(item.label)+'</strong><small>'+esc(item.category||'')+(item.notes?' · '+esc(item.notes):'')+'</small></td><td>'+esc(item.quantity)+'</td><td class="num">'+usd(Number(item.setup_cents||0)*Number(item.quantity||1))+'</td><td class="num">'+usd(Number(item.monthly_cents||0)*Number(item.quantity||1))+'</td></tr>').join('')+
 '</tbody></table>':'<pre>'+esc(proposal.scope)+'</pre>';
 const financial=packageSnapshot?'<section class="money"><div><span>Implementation subtotal</span><b>'+usd(packageSnapshot.setup_total_cents)+'</b></div>'+
 '<div><span>Discount</span><b>−'+usd(packageSnapshot.discount_cents)+'</b></div>'+
 '<div class="total"><span>One-time implementation total</span><b>'+usd(packageSnapshot.estimated_one_time_cents)+'</b></div>'+
 '<div><span>AI Gents ongoing services / month</span><b>'+usd(packageSnapshot.monthly_total_cents)+'</b></div>'+
 '<div><span>Estimated third-party services / month (known)</span><b>'+usd(packageSnapshot.external_monthly_known_cents)+'</b></div>'+
 '<p>'+esc(packageSnapshot.external_costs_unknown)+' external cost(s) still require confirmation. Taxes, payment processing fees and provider subscriptions are not included unless explicitly noted.</p></section>':
 '<section class="money"><div class="total"><span>Proposal amount</span><b>'+ (proposal.amount_cents==null?'To be confirmed':usd(proposal.amount_cents))+'</b></div></section>';
 const business=packageSnapshot?'<section><h2>Client objectives</h2><p>'+esc(packageSnapshot.business_description)+'</p>'+
 (packageSnapshot.design_direction?'<h3>Design direction</h3><p>'+esc(packageSnapshot.design_direction)+'</p>':'')+
 (packageSnapshot.audience_roles?'<h3>Users and access</h3><p>'+esc(packageSnapshot.audience_roles)+'</p>':'')+
 (packageSnapshot.additional_requirements?'<h3>Additional requirements</h3><p>'+esc(packageSnapshot.additional_requirements)+'</p>':'')+'</section>':'';
 const terms=packageSnapshot?'<section class="terms"><h2>Terms, assumptions and exclusions</h2>'+
 '<h3>Assumptions and exclusions</h3><p>'+esc(packageSnapshot.assumptions||'To be agreed in the formal services agreement.')+'</p>'+
 '<h3>Payment terms</h3><p>'+esc(packageSnapshot.payment_terms||'To be agreed before work commences.')+'</p></section>':'';
 const date=proposal.created_at?new Date(proposal.created_at).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}):new Date().toLocaleDateString('en-US');
 const doc='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
 '<title>'+safeTitle+' | AI Gents proposal</title><style>'+
 '@page{size:letter;margin:.65in}*{box-sizing:border-box}body{color:#202024;font-family:Arial,Helvetica,sans-serif;max-width:900px;margin:0 auto;line-height:1.55;padding:34px}header{padding-bottom:28px;border-bottom:3px solid #c8a96e;margin-bottom:26px}.brand{font:700 20px Georgia,serif;letter-spacing:.12em;color:#242424}.brand b{color:#b28d4d}.tag{font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#666;margin-top:4px}h1{font:500 35px Georgia,serif;line-height:1.2;margin:24px 0 14px}h2{font:500 22px Georgia,serif;border-bottom:1px solid #ddd;padding-bottom:8px;margin:28px 0 16px}h3{font-size:12px;text-transform:uppercase;letter-spacing:.08em;margin:20px 0 5px}p,pre{white-space:pre-wrap;overflow-wrap:anywhere}.meta{display:flex;justify-content:space-between;gap:25px;color:#666;font-size:12px}table{border-collapse:collapse;width:100%;font-size:12px}th{background:#f4f1ea;text-align:left;font-size:11px;letter-spacing:.04em;padding:11px 9px;border-bottom:1px solid #ddd}td{vertical-align:top;border-bottom:1px solid #eee;padding:11px 9px}td small{display:block;color:#666;margin-top:5px;line-height:1.4}.num{text-align:right;white-space:nowrap}section{break-inside:avoid-page}.money{border-top:2px solid #b28d4d;margin-top:30px;padding-top:12px}.money>div{display:flex;justify-content:space-between;gap:24px;padding:7px 0}.money .total{font-size:17px;font-weight:bold;border-top:1px solid #ddd;margin-top:10px;padding:14px 0}.money p,.foot{font-size:11px;color:#686868}.terms{margin-top:28px}footer{border-top:1px solid #ddd;font-size:11px;margin-top:42px;padding-top:14px;color:#666}.toolbar{display:flex;gap:12px;margin-bottom:22px;padding:14px;background:#f7f4ed;border-radius:8px}.toolbar button{border:0;padding:10px 18px;border-radius:5px;background:#1b1a18;color:#fff;cursor:pointer}.toolbar span{font-size:12px;color:#444;margin:auto 0}@media print{body{max-width:none;padding:0}.toolbar{display:none}section{break-inside:auto}h2,h3{break-after:avoid}}'+
 '</style></head><body><div class="toolbar"><button onclick="window.print()">Print / Save as PDF</button><span>Review content before distributing. Client approval is recorded separately in The Office.</span></div>'+
 '<header><div class="brand">AI <b>GENTS</b></div><div class="tag">Proprietary Platforms · Business Systems</div><h1>'+safeTitle+'</h1>'+
 '<div class="meta"><div>Prepared for: <strong>'+esc(client?.company||project?.title||'Client')+'</strong><br>Project: '+esc(project?.title||'')+'</div><div>'+esc(label)+'<br>'+esc(date)+'</div></div></header>'+
 business+'<section><h2>Proposed scope of work</h2>'+itemized+'</section>'+financial+terms+
 '<footer>AI Gents · aigents.help<br>This is a proposal for review, not an invoice or a digital signature. Any scope change requires a separately reviewed version. Third-party accounts, subscriptions, charges and production releases require approval.</footer></body></html>';
 const popup=window.open('','_blank');
 if(!popup)return false;
 popup.opener=null;
 popup.document.open();popup.document.write(doc);popup.document.close();popup.focus();
 return true;
}
