// Internal AI Gents starting estimates, USD. Not provider pricing, an industry price list,
// a binding quote, or a claim that the work can be delivered at this price in every case.
// Benchmark against current agency website / custom CRM market ranges, then adjust per scope.
// Each selection snapshots defaults into the existing project record for independent editing.
export const BASE_PRICING={
 website:[4500,0],branding:[1800,0],responsive:[650,0],content:[1400,0],
 forms:[650,0],portal:[6500,0],login:[2200,0],roles:[1800,0],
 accessibility:[1100,0],seo:[1200,200],analytics:[650,0],
 admin:[5500,0],crm:[6500,0],pipeline:[1800,0],workflow:[3000,0],
 tasks:[1800,0],documents:[2200,0],scheduling:[2500,0],
 notifications:[1600,0],reporting:[3000,0],automation:[2500,0],
 ai_assistant:[4500,0],integrations:[1800,0],
 stripe:[1200,0],invoices:[1400,0],subscriptions:[1800,0],
 checkout:[1400,0],catalog:[1800,0],tax:[500,0],
 supabase:[1800,0],github:[450,0],vercel:[500,0],domain:[250,0],
 storage:[1100,0],security:[1700,0],monitoring:[550,150],handoff:[650,0],
 resend:[650,0],kit:[800,0],smartlead:[1100,0],
 newsletter:[900,200],email_templates:[500,0],reviews:[500,0],
 social:[850,0],consent:[750,0]
};
export const pricingFor=key=>{
 const p=BASE_PRICING[key]||[0,0];return {setup_fee_cents:p[0]*100,monthly_fee_cents:p[1]*100};
};
// Non-editable reference for staff quoting. Adjusted project amounts stay in
// ag_component_pricing; changing a quote never mutates these catalog defaults.
// Benchmarks are AI Gents suggested starting figures, NOT certified industry tariffs.
export const referenceFor=item=>item.item_type==='custom'?null:
  Object.prototype.hasOwnProperty.call(BASE_PRICING,item.component_key)?pricingFor(item.component_key):null;
export function benchmarkTotals(items){
 return items.reduce((totals,item)=>{
  const ref=referenceFor(item);
  if(!ref){totals.unbenchmarked+=1;return totals;}
  const quantity=Number(item.quote_quantity)||1;
  totals.once+=ref.setup_fee_cents*quantity;
  totals.monthly+=ref.monthly_fee_cents*quantity;
  return totals;
 },{once:0,monthly:0,unbenchmarked:0});
}
export const asUsd=cents=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(Number(cents||0)/100);
export const quoteTotals=items=>items.reduce((a,i)=>{
 const q=Number(i.quote_quantity)||1;
 a.once+=Number(i.setup_fee_cents||0)*q;
 a.monthly+=Number(i.monthly_fee_cents||0)*q;
 if(i.third_party_monthly_cents===null||i.third_party_monthly_cents===undefined)a.unknownExternal+=1;
 else a.external+=Number(i.third_party_monthly_cents||0)*q;
 return a;
},{once:0,monthly:0,external:0,unknownExternal:0});
export function quoteText(project,items,{includeBenchmarks=false}={}){
 const t=quoteTotals(items),b=benchmarkTotals(items),stamp=new Date().toLocaleDateString('en-US');
 return ['AI GENTS | INTERNAL DRAFT ESTIMATE','Project: '+project.title,'Prepared: '+stamp,'Currency: USD','',
 'COMPONENTS (SELECTED SCOPE ONLY)',
 ...items.map(i=>{
  const q=Number(i.quote_quantity)||1;
  const external=i.third_party_monthly_cents==null?'Not estimated':asUsd(Number(i.third_party_monthly_cents)*q);
  const ref=includeBenchmarks?referenceFor(i):null;
  return i.component_label+' | Qty '+q+(ref?' | Benchmark setup '+asUsd(ref.setup_fee_cents*q)+' | Benchmark monthly '+asUsd(ref.monthly_fee_cents*q):'')+' | Quoted setup '+asUsd(Number(i.setup_fee_cents||0)*q)+' | AI Gents monthly '+asUsd(Number(i.monthly_fee_cents||0)*q)+' | External monthly '+external;
 }),
 '',
 ...(includeBenchmarks?['AI Gents catalog benchmark one-time subtotal (standard components only): '+asUsd(b.once),'AI Gents catalog benchmark monthly subtotal (standard components only): '+asUsd(b.monthly),'Unbenchmarked custom components: '+b.unbenchmarked+' item(s)','Benchmarks are reference estimates, not independent market rates.']:[]),
 'AI Gents one-time subtotal: '+asUsd(t.once),
 'AI Gents recurring monthly subtotal: '+asUsd(t.monthly),
 'Estimated third-party monthly subtotal (known amounts only): '+asUsd(t.external),
 'External subscription costs still to confirm: '+t.unknownExternal+' item(s)',
 '',
 'DRAFT — NOT A CONTRACT, INVOICE OR APPROVED PROPOSAL.',
 'Item fees are editable planning estimates, not guaranteed industry rates.',
 'Scope, overlap, implementation complexity, applicable taxes and external subscriptions require review.',
 'Selecting a component does not purchase, install, or authorize any provider service.',
 'Prices exclude sales tax, transaction fees and third-party subscriptions unless expressly noted.'
 ].join('\n');
}
