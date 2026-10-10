'use client';
import {useCallback,useEffect,useState} from 'react';
import {supabase} from '../lib/supabase';

function num(v){return Number(v||0)}
function dt(v){return v?new Date(v).toISOString().slice(0,16):''}

export default function CommerceExpansionPanel({products=[]}){
 const [snap,setSnap]=useState(null),[data,setData]=useState(null),[busy,setBusy]=useState(false),[msg,setMsg]=useState('');
 const [launch,setLaunch]=useState({product_id:'',starts_at:'',early_access_at:'',ends_at:'',max_per_customer:'',notify_enabled:true});
 const [referral,setReferral]=useState({code:'',owner_label:'',commission_pct:10});
 const [bundle,setBundle]=useState({name:'Build Your Own Set',min_items:2,max_items:4,discount_type:'percent',discount_value:10});
 const [upsell,setUpsell]=useState({source_product_id:'',target_product_id:'',discount_pct:10,window_minutes:30});

 const load=useCallback(async()=>{
  if(!supabase)return;
  const [a,b]=await Promise.all([supabase.rpc('admin_commerce_expansion_snapshot'),supabase.rpc('admin_commerce_expansion_data')]);
  if(!a.error)setSnap(a.data);if(!b.error)setData(b.data);
 },[]);
 useEffect(()=>{load()},[load]);

 async function run(fn,args,ok){setBusy(true);setMsg('');const {error}=await supabase.rpc(fn,args);setBusy(false);setMsg(error?error.message:ok);if(!error)load()}
 async function saveLaunch(e){e.preventDefault();await run('admin_save_product_launch',{
  p_product_id:launch.product_id,p_starts_at:launch.starts_at||null,p_early_access_at:launch.early_access_at||null,p_ends_at:launch.ends_at||null,
  p_max_per_customer:launch.max_per_customer?num(launch.max_per_customer):null,p_notify_enabled:!!launch.notify_enabled,p_active:true
 },'Drop / launch saved.')}
 async function saveReferral(e){e.preventDefault();await run('admin_save_referral_code',{p_code:referral.code,p_owner_label:referral.owner_label,p_commission_pct:num(referral.commission_pct),p_active:true},'Referral code saved.')}
 async function saveBundle(e){e.preventDefault();await run('admin_save_flexible_bundle',{
  p_id:null,p_name:bundle.name,p_min_items:num(bundle.min_items),p_max_items:bundle.max_items?num(bundle.max_items):null,p_discount_type:bundle.discount_type,p_discount_value:num(bundle.discount_value),p_eligible_product_ids:[],p_active:true
 },'Build-your-own bundle rule saved.')}
 async function saveUpsell(e){e.preventDefault();await run('admin_save_post_purchase_offer',{
  p_id:null,p_source_product_id:upsell.source_product_id||null,p_target_product_id:upsell.target_product_id||null,p_discount_pct:num(upsell.discount_pct),p_window_minutes:num(upsell.window_minutes),p_active:true
 },'Post-purchase offer saved.')}
 async function toggleFeed(f){await run('admin_set_feed_channel',{p_code:f.code,p_enabled:!f.enabled,p_feed_path:f.feed_path||null},f.label+' updated.')}
 async function resolveRisk(id){await run('admin_resolve_order_risk',{p_flag_id:id},'Risk flag resolved.')}
 async function runRecovery(){
  if(!supabase||busy)return;
  setBusy(true);setMsg('');
  try{
   const {data:s}=await supabase.auth.getSession();
   const token=s.session?.access_token;
   if(!token){setMsg('Admin session unavailable.');return}
   const res=await fetch('/api/recovery/run',{method:'POST',headers:{Authorization:'Bearer '+token}});
   const body=await res.json();
   setMsg(res.ok?('Recovery run complete · '+Number(body.sent||0)+' email(s) sent.'):(body.error||'Recovery run failed.'));
   if(res.ok)load();
  }catch(e){setMsg(String(e?.message||e))}finally{setBusy(false)}
 }
 async function runLifecycle(mode='all'){
  if(!supabase||busy)return;
  setBusy(true);setMsg('');
  try{
   const {data:s}=await supabase.auth.getSession();
   const token=s.session?.access_token;
   if(!token){setMsg('Admin session unavailable.');return}
   const res=await fetch('/api/commerce/notifications/run',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({mode})});
   const body=await res.json();
   setMsg(res.ok?('Lifecycle run complete · '+Number(body.total||0)+' notification(s) sent.'):(body.error||'Lifecycle run failed.'));
   if(res.ok)load();
  }catch(e){setMsg(String(e?.message||e))}finally{setBusy(false)}
 }

 const f=snap?.funnel||{};
 return <section className="adminSection adminViewSection commerceExpansion">
  <div className="sectionLabel"><span>07X / COMMERCE EXPANSION</span><p>Launches, recovery, retention, attribution and lifecycle commerce.</p></div>
  {msg&&<p className="dbNotice">{msg}</p>}
  <div className="commerceExpansionMetrics">
   <article><span>DROP / LAUNCH</span><strong>{snap?.launches||0}</strong><small>{snap?.launch_subscribers||0} subscribers</small><button type="button" className="commerceMetricAction" onClick={()=>runLifecycle('launch')} disabled={busy}>RUN ALERTS →</button></article>
   <article><span>RECOVERY</span><strong>{snap?.active_recovery||0}</strong><small>{snap?.recovered_carts||0} recovered</small><button type="button" className="commerceMetricAction" onClick={runRecovery} disabled={busy}>RUN RECOVERY →</button></article>
   <article><span>REFERRALS</span><strong>{snap?.referrals||0}</strong><small>active partner codes</small></article>
   <article><span>RISK</span><strong>{snap?.risk_open||0}</strong><small>open reviews</small></article><article><span>GIFTS DUE</span><strong>{snap?.gift_due||0}</strong><small>scheduled recipient notices</small><button type="button" className="commerceMetricAction" onClick={()=>runLifecycle('gift')} disabled={busy}>RUN GIFTS →</button></article>
  </div>

  <div className="commerceFunnel adminPanel">
   <header><span>30 DAY FUNNEL</span><small>Product view → paid order</small></header>
   {['product_view','add_to_bag','checkout_start','order_created','payment_succeeded'].map((k,i)=><div key={k}><span>{String(i+1).padStart(2,'0')} · {k.replaceAll('_',' ').toUpperCase()}</span><b>{f[k]||0}</b></div>)}
  </div>

  <div className="commerceExpansionGrid">
   <form className="adminPanel commerceForm" onSubmit={saveLaunch}><header><span>DROP / RELEASE LAUNCH</span><small>Countdown, early access, per-customer limit.</small></header>
    <select required value={launch.product_id} onChange={e=>setLaunch({...launch,product_id:e.target.value})}><option value="">SELECT PRODUCT…</option>{products.map(p=><option key={p.id} value={p.id}>{p.catalogue_no} · {p.title}</option>)}</select>
    <label>PUBLIC START<input type="datetime-local" value={launch.starts_at} onChange={e=>setLaunch({...launch,starts_at:e.target.value})}/></label>
    <label>EARLY ACCESS<input type="datetime-local" value={launch.early_access_at} onChange={e=>setLaunch({...launch,early_access_at:e.target.value})}/></label>
    <label>ENDS<input type="datetime-local" value={launch.ends_at} onChange={e=>setLaunch({...launch,ends_at:e.target.value})}/></label>
    <label>MAX / CUSTOMER<input type="number" min="1" value={launch.max_per_customer} onChange={e=>setLaunch({...launch,max_per_customer:e.target.value})}/></label>
    <label className="checkLine"><input type="checkbox" checked={launch.notify_enabled} onChange={e=>setLaunch({...launch,notify_enabled:e.target.checked})}/> LAUNCH ALERTS</label>
    <button disabled={busy}>SAVE LAUNCH</button>
   </form>

   <form className="adminPanel commerceForm" onSubmit={saveReferral}><header><span>REFERRAL / ARTIST CODE</span><small>Attribution and future payout share.</small></header>
    <label>CODE<input required value={referral.code} onChange={e=>setReferral({...referral,code:e.target.value.toUpperCase()})} placeholder="ADA10"/></label>
    <label>OWNER / PARTNER<input required value={referral.owner_label} onChange={e=>setReferral({...referral,owner_label:e.target.value})}/></label>
    <label>COMMISSION %<input type="number" min="0" max="100" step=".1" value={referral.commission_pct} onChange={e=>setReferral({...referral,commission_pct:e.target.value})}/></label>
    <button disabled={busy}>SAVE REFERRAL</button>
   </form>

   <form className="adminPanel commerceForm" onSubmit={saveBundle}><header><span>BUILD YOUR OWN BUNDLE</span><small>Customer-built set discount rule.</small></header>
    <label>NAME<input value={bundle.name} onChange={e=>setBundle({...bundle,name:e.target.value})}/></label>
    <div className="commerceInline"><label>MIN<input type="number" min="2" value={bundle.min_items} onChange={e=>setBundle({...bundle,min_items:e.target.value})}/></label><label>MAX<input type="number" min="2" value={bundle.max_items} onChange={e=>setBundle({...bundle,max_items:e.target.value})}/></label></div>
    <select value={bundle.discount_type} onChange={e=>setBundle({...bundle,discount_type:e.target.value})}><option value="percent">PERCENT</option><option value="fixed">FIXED TRY</option></select>
    <label>DISCOUNT<input type="number" min=".01" step=".01" value={bundle.discount_value} onChange={e=>setBundle({...bundle,discount_value:e.target.value})}/></label>
    <button disabled={busy}>SAVE FLEX BUNDLE</button>
   </form>

   <form className="adminPanel commerceForm" onSubmit={saveUpsell}><header><span>POST-PURCHASE OFFER</span><small>Offer another object after paid order.</small></header>
    <select value={upsell.source_product_id} onChange={e=>setUpsell({...upsell,source_product_id:e.target.value})}><option value="">ANY SOURCE PRODUCT</option>{products.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select>
    <select required value={upsell.target_product_id} onChange={e=>setUpsell({...upsell,target_product_id:e.target.value})}><option value="">TARGET PRODUCT…</option>{products.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select>
    <div className="commerceInline"><label>DISCOUNT %<input type="number" min=".1" max="100" step=".1" value={upsell.discount_pct} onChange={e=>setUpsell({...upsell,discount_pct:e.target.value})}/></label><label>WINDOW MIN<input type="number" min="1" value={upsell.window_minutes} onChange={e=>setUpsell({...upsell,window_minutes:e.target.value})}/></label></div>
    <button disabled={busy}>SAVE UPSELL</button>
   </form>
  </div>

  <div className="commerceExpansionGrid lower">
   <div className="adminPanel commerceList"><header><span>COMMERCE FEEDS</span><small>Google / Meta / Instagram / Pinterest.</small></header>{(data?.feeds||[]).map(x=><div key={x.code}><div><b>{x.label}</b><small>{x.feed_path||'NO FEED PATH'}</small></div><button onClick={()=>toggleFeed(x)} disabled={busy}>{x.enabled?'ON':'OFF'}</button></div>)}</div>
   <div className="adminPanel commerceList"><header><span>COLLECTOR TIERS</span><small>Retention + early access ladder.</small></header>{(data?.collector_tiers||[]).map(x=><div key={x.code}><div><b>{x.label}</b><small>{x.min_paid_orders} ORDERS · TRY {x.min_spend} · {x.early_access_hours}H EARLY</small></div><strong>{x.reward_pct}%</strong></div>)}</div>
   <div className="adminPanel commerceList"><header><span>RISK REVIEW</span><small>Velocity / high-value flags.</small></header>{(data?.risk_flags||[]).length?(data.risk_flags.map(x=><div key={x.id}><div><b>#SII-{String(x.order_no).padStart(4,'0')} · {x.code}</b><small>{x.detail}</small></div><button onClick={()=>resolveRisk(x.id)}>RESOLVE</button></div>)):<p className="emptyNote">No open risk flags.</p>}</div>
   <div className="adminPanel commerceList"><header><span>LIVE MODULES</span><small>Installed commerce expansion.</small></header>{[
    ['ABANDONED CART','Recovery sessions + hooks'],
    ['ORDER TRACKING','Public order/email lookup'],
    ['PASSPORT','Edition certificate system'],
    ['SHARED LISTS','Wishlist/cart link RPC'],
    ['GIFT EXPERIENCE','Gift message + scheduled fields'],
    ['RESERVATION UX','15 minute stock reservation'],
    ['ATTRIBUTION','UTM/referral event pipeline'],
    ['POST-PURCHASE','Timed offer engine'],
    ['SCHEDULED GIFTS','Recipient delivery notifications']
   ].map(x=><div key={x[0]}><div><b>{x[0]}</b><small>{x[1]}</small></div><strong>READY</strong></div>)}</div>
  </div>
 </section>;
}
