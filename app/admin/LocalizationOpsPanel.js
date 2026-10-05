'use client';
import {useEffect,useState} from 'react';
import {supabase} from '../lib/supabase';

export default function LocalizationOpsPanel(){
 const [rates,setRates]=useState([]),[locales,setLocales]=useState([]),[busy,setBusy]=useState(''),[message,setMessage]=useState('');
 async function load(){
  if(!supabase)return;
  const [r,l]=await Promise.all([supabase.rpc('admin_list_fx_rates'),supabase.rpc('admin_list_locales')]);
  if(r.error)return setMessage(r.error.message);
  setRates(r.data||[]);setLocales(l.data||[]);
 }
 useEffect(()=>{load()},[]);

 async function saveRate(row){
  setBusy('r:'+row.currency);setMessage('');
  const {error}=await supabase.rpc('admin_save_fx_rate',{
   p_currency:row.currency,
   p_rate_from_try:row.currency==='TRY'?1:(row.rate_from_try===''?null:Number(row.rate_from_try)),
   p_active:row.currency==='TRY'?true:!!row.active,
   p_source:row.source||'manual'
  });
  setBusy('');if(error)return setMessage(error.message);setMessage(row.currency+' rate saved.');load();
 }
 async function saveLocale(row){
  setBusy('l:'+row.code);setMessage('');
  const {error}=await supabase.rpc('admin_save_locale',{
   p_code:row.code,p_label:row.label,p_native_label:row.native_label,p_active:!!row.active,p_sort_order:Number(row.sort_order)||0
  });
  setBusy('');if(error)return setMessage(error.message);setMessage(row.code.toUpperCase()+' locale saved.');load();
 }

 return <section id="localization" className="adminSection localizationOps">
  <div className="sectionLabel"><span>13 / LOCALIZATION</span><p>Languages and display currencies. Settlement remains TRY until live payment setup.</p></div>
  {message&&<p className="dbNotice">{message}</p>}
  <div className="localizationGrid">
   <article className="adminPanel localizationCard"><header><span>DISPLAY CURRENCIES</span><small>1 TRY = selected currency rate</small></header>
    {rates.map((x,i)=><div className="fxRow" key={x.currency}>
      <b>{x.currency}</b>
      <input type="number" min="0" step="0.00000001" disabled={x.currency==='TRY'} value={x.rate_from_try??''} placeholder="RATE FROM TRY" onChange={e=>setRates(rows=>rows.map((r,n)=>n===i?{...r,rate_from_try:e.target.value}:r))}/>
      <label><input type="checkbox" disabled={x.currency==='TRY'} checked={!!x.active} onChange={e=>setRates(rows=>rows.map((r,n)=>n===i?{...r,active:e.target.checked}:r))}/><span>ACTIVE</span></label>
      <button className="saveButton" disabled={busy==='r:'+x.currency} onClick={()=>saveRate(x)}>SAVE</button>
    </div>)}
    <p className="localizationNote">USD / EUR / GBP stay hidden until a rate is entered and activated. Live FX provider sync is intentionally deferred to the final provider/domain phase.</p>
   </article>

   <article className="adminPanel localizationCard"><header><span>LANGUAGES</span><small>Customer storefront language availability</small></header>
    {locales.map((x,i)=><div className="localeRow" key={x.code}>
      <b>{x.code.toUpperCase()}</b>
      <input value={x.label} onChange={e=>setLocales(rows=>rows.map((r,n)=>n===i?{...r,label:e.target.value}:r))}/>
      <input value={x.native_label} onChange={e=>setLocales(rows=>rows.map((r,n)=>n===i?{...r,native_label:e.target.value}:r))}/>
      <label><input type="checkbox" checked={!!x.active} onChange={e=>setLocales(rows=>rows.map((r,n)=>n===i?{...r,active:e.target.checked}:r))}/><span>ACTIVE</span></label>
      <button className="saveButton" disabled={busy==='l:'+x.code} onClick={()=>saveLocale(x)}>SAVE</button>
    </div>)}
   </article>
  </div>
 </section>;
}
