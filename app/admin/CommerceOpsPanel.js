'use client';
import {useEffect,useMemo,useState} from 'react';
import {supabase} from '../lib/supabase';

const money=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:0}).format(Number(n||0));

export default function CommerceOpsPanel({products,onChanged}){
 const [days,setDays]=useState(30),[report,setReport]=useState(null),[alerts,setAlerts]=useState([]),[returns,setReturns]=useState([]),[rates,setRates]=useState([]);
 const [message,setMessage]=useState(''),[busy,setBusy]=useState('');
 const variants=useMemo(()=>products.flatMap(p=>(p.product_variants||[]).map(v=>({...v,productTitle:p.title}))),[products]);

 async function loadOps(){
  if(!supabase)return;
  const [r,a,rr,s]=await Promise.all([
   supabase.rpc('admin_sales_report',{p_days:days}),
   supabase.rpc('admin_stock_alerts'),
   supabase.rpc('admin_get_return_requests'),
   supabase.from('shipping_class_rates').select('code,label,rate,active').order('code')
  ]);
  if(!r.error)setReport(r.data||null);
  if(!a.error)setAlerts(Array.isArray(a.data)?a.data:[]);
  if(!rr.error)setReturns(Array.isArray(rr.data)?rr.data:[]);
  if(!s.error)setRates(s.data||[]);
 }
 useEffect(()=>{loadOps()},[days,products]);

 async function saveRate(row){
  setBusy('rate:'+row.code);setMessage('');
  const {error}=await supabase.rpc('admin_save_shipping_class_rate',{p_code:row.code,p_rate:Number(row.rate)||0,p_active:!!row.active});
  setBusy('');if(error)return setMessage(error.message);
  setMessage('Shipping class saved.');loadOps();
 }

 async function saveVariant(v){
  setBusy('variant:'+v.id);setMessage('');
  const {error}=await supabase.rpc('admin_update_variant_commerce',{
   p_variant_id:v.id,
   p_shipping_class:v.shipping_class||'',
   p_low_stock_threshold:Number(v.low_stock_threshold)||0,
   p_preorder_enabled:!!v.preorder_enabled,
   p_preorder_limit:v.preorder_limit===''?null:(Number(v.preorder_limit)||null),
   p_edition_numbering_enabled:!!v.edition_numbering_enabled,
   p_edition_total:v.edition_total===''?null:(Number(v.edition_total)||null),
   p_digital_download_url:v.digital_download_url||'',
   p_iyzilink_url:v.iyzilink_url||'',
   p_iyzilink_amount:v.iyzilink_amount===''||v.iyzilink_amount==null?null:Number(v.iyzilink_amount)
  });
  setBusy('');if(error)return setMessage(error.message);
  setMessage(v.sku+' commerce settings saved.');
  await onChanged?.();loadOps();
 }

 async function updateReturn(id,status){
  setBusy('return:'+id);setMessage('');
  const {error}=await supabase.rpc('admin_update_return_request',{p_request_id:id,p_status:status});
  setBusy('');if(error)return setMessage(error.message);
  setMessage('Request updated.');loadOps();
 }


 return <section id="commerce-ops" className="adminSection commerceOps">
  <div className="sectionLabel"><span>07 / COMMERCE OPS</span><p>Sales, shipping, stock, pre-orders and customer requests.</p></div>
  {message&&<p className="dbNotice">{message}</p>}

  <div className="commerceMetricHead"><span>SALES REPORT</span><select value={days} onChange={e=>setDays(Number(e.target.value))}><option value="7">7 DAYS</option><option value="30">30 DAYS</option><option value="90">90 DAYS</option><option value="365">365 DAYS</option></select></div>
  <div className="metricGrid commerceMetrics">
   <article><span>ORDERS</span><strong>{report?.orders??'—'}</strong><small>{report?.paid_orders??0} paid</small></article>
   <article><span>REVENUE</span><strong>{report?money(report.revenue):'—'}</strong><small>{days} day window</small></article>
   <article><span>AVG ORDER</span><strong>{report?money(report.average_order_value):'—'}</strong><small>paid orders</small></article>
   <article><span>UNITS</span><strong>{report?.units??'—'}</strong><small>{report?.cancelled??0} cancelled/refunded</small></article>
  </div>

  <div className="commerceOpsGrid">
   <article className="adminPanel commerceCard">
    <header><span>SHIPPING CLASSES</span><small>Quote uses the highest class in the bag.</small></header>
    {rates.map((r,i)=><div className="commerceRateRow" key={r.code}><div><b>{r.label}</b><small>{r.code.toUpperCase()}</small></div><input type="number" min="0" step=".01" value={r.rate} onChange={e=>setRates(x=>x.map((y,n)=>n===i?{...y,rate:e.target.value}:y))}/><button disabled={busy==='rate:'+r.code} onClick={()=>saveRate(r)}>SAVE</button></div>)}
   </article>
   <article className="adminPanel commerceCard">
    <header><span>STOCK ALERTS / WAITLIST</span><small>Low stock and pending restock interest.</small></header>
    {alerts.length===0?<p className="emptyNote">No stock alerts.</p>:alerts.map(a=><div className="commerceAlertRow" key={a.variant_id}><div><b>{a.title}</b><small>{a.sku} · {String(a.format).toUpperCase()}</small></div><strong>{a.available}</strong><span>LOW AT {a.threshold}</span><em>{a.waitlist_count} WAITING</em></div>)}
   </article>
  </div>

  <article className="adminPanel commerceVariants">
   <header><span>VARIANT COMMERCE SETTINGS</span><small>Shipping class · stock · pre-order · limited numbering · digital delivery · iyzico Link.</small></header>
   {variants.map(v=><VariantRow key={v.id} initial={v} saving={busy==='variant:'+v.id} onSave={saveVariant}/>)}
  </article>

  <article className="adminPanel commerceReturns">
   <header><span>RETURN / CANCELLATION REQUESTS</span><small>{returns.length}</small></header>
   {returns.length===0?<p className="emptyNote">No customer requests.</p>:returns.map(r=><div className="commerceReturnRow" key={r.id}><div><b>#{String(r.order_no).padStart(4,'0')} · {String(r.request_type).toUpperCase()}</b><small>{r.email}</small><p>{r.reason||'No reason provided.'}</p></div><select disabled={busy==='return:'+r.id} value={r.status} onChange={e=>updateReturn(r.id,e.target.value)}><option value="open">OPEN</option><option value="approved">APPROVED</option><option value="rejected">REJECTED</option><option value="completed">COMPLETED</option></select></div>)}
  </article>
 </section>;
}

function VariantRow({initial,onSave,saving}){
 const [open,setOpen]=useState(false);
 const [v,setV]=useState(()=>({
  ...initial,
  shipping_class:initial.shipping_class||(['vinyl'].includes(initial.format)?'vinyl':initial.format==='merch'?'merch':'standard'),
  low_stock_threshold:initial.low_stock_threshold??0,
  preorder_limit:initial.preorder_limit??'',
  edition_total:initial.edition_total??'',
  digital_download_url:initial.digital_download_url||'',
  iyzilink_url:initial.iyzilink_url||'',
  iyzilink_amount:initial.iyzilink_amount??''
 }));
 useEffect(()=>setV(x=>({...x,...initial,digital_download_url:initial.digital_download_url||'',iyzilink_url:initial.iyzilink_url||'',iyzilink_amount:initial.iyzilink_amount??'',preorder_limit:initial.preorder_limit??'',edition_total:initial.edition_total??''})),[initial]);
 return <div className={'commerceVariantRow commerceVariantCollapsible '+(open?'open':'')}>
   <button type="button" className="commerceVariantSummary" onClick={()=>setOpen(x=>!x)} aria-expanded={open}>
    <span><b>{v.productTitle}</b><small>{v.sku} · {String(v.format).toUpperCase()}</small></span>
    <span className="commerceVariantMeta">
      <em>{String(v.shipping_class||'standard').toUpperCase()}</em>
      <em>LOW {Number(v.low_stock_threshold||0)}</em>
      {v.preorder_enabled&&<em>PRE-ORDER</em>}
      {v.edition_numbering_enabled&&<em>NUMBERED</em>}
      <em className={v.iyzilink_url&&v.iyzilink_amount?'ready':'pending'}>{v.iyzilink_url&&v.iyzilink_amount?'IYZI READY':'IYZI PENDING'}</em>
    </span>
    <i>{open?'−':'+'}</i>
   </button>
   {open&&<div className="commerceVariantBody">
    <label>SHIP CLASS<select value={v.shipping_class||'standard'} onChange={e=>setV({...v,shipping_class:e.target.value})}><option value="standard">STANDARD</option><option value="vinyl">VINYL</option><option value="merch">MERCH</option></select></label>
    <label>LOW AT<input type="number" min="0" value={v.low_stock_threshold} onChange={e=>setV({...v,low_stock_threshold:e.target.value})}/></label>
    <label className="commerceCheck"><input type="checkbox" checked={!!v.preorder_enabled} onChange={e=>setV({...v,preorder_enabled:e.target.checked})}/><span>PRE-ORDER</span></label>
    <label>PRE-ORDER LIMIT<input type="number" min="0" disabled={!v.preorder_enabled} value={v.preorder_limit} onChange={e=>setV({...v,preorder_limit:e.target.value})}/></label>
    <label className="commerceCheck"><input type="checkbox" checked={!!v.edition_numbering_enabled} onChange={e=>setV({...v,edition_numbering_enabled:e.target.checked})}/><span>NUMBERED</span></label>
    <label>EDITION TOTAL<input type="number" min="1" disabled={!v.edition_numbering_enabled} value={v.edition_total} onChange={e=>setV({...v,edition_total:e.target.value})}/></label>
    {v.format==='digital'&&<label className="commerceWide">DOWNLOAD URL<input placeholder="https://..." value={v.digital_download_url} onChange={e=>setV({...v,digital_download_url:e.target.value})}/></label>}
    <div className="commerceWide iyziLinkField"><label>IYZICO LINK<input type="url" placeholder="https://..." value={v.iyzilink_url} onChange={e=>setV({...v,iyzilink_url:e.target.value})}/></label><label>LINK AMOUNT<input type="number" min="0" step=".01" placeholder="0.00" value={v.iyzilink_amount} onChange={e=>setV({...v,iyzilink_amount:e.target.value})}/></label><small>Direct payment appears only when the order's external payment due exactly matches this Link amount.</small></div>
    <button className="saveButton" disabled={saving} onClick={()=>onSave(v)}>{saving?'SAVING…':'SAVE'}</button>
   </div>}
  </div>}
