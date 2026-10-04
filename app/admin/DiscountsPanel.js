'use client';
import {useEffect,useState} from 'react';
import {supabase} from '../lib/supabase';

const empty={id:null,code:'',discount_type:'percent',value:'10',min_subtotal:'0',usage_limit:'',valid_until:'',active:true};

function fmtDate(v){
 if(!v)return '';
 try{return new Date(v).toLocaleString('tr-TR')}catch{return v}
}

export default function DiscountsPanel(){
 const [codes,setCodes]=useState([]);
 const [form,setForm]=useState(empty);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');

 async function load(){
  if(!supabase)return;
  const {data,error}=await supabase.rpc('admin_list_discount_codes');
  if(error){setMessage(error.message);return}
  setCodes(data||[]);
 }
 useEffect(()=>{load()},[]);

 async function save(e){
  e.preventDefault();setBusy(true);setMessage('');
  const {error}=await supabase.rpc('admin_save_discount_code',{
   p_id:form.id||null,
   p_code:form.code.trim().toUpperCase(),
   p_discount_type:form.discount_type,
   p_value:form.discount_type==='free_shipping'?0:Number(form.value||0),
   p_min_subtotal:Number(form.min_subtotal||0),
   p_usage_limit:form.usage_limit===''?null:Number(form.usage_limit),
   p_valid_until:form.valid_until?new Date(form.valid_until).toISOString():null,
   p_active:!!form.active
  });
  setBusy(false);
  if(error){setMessage(error.message);return}
  setMessage(form.id?'Code updated.':'Code created.');
  setForm(empty);
  await load();
 }

 async function toggle(row){
  const {error}=await supabase.rpc('admin_toggle_discount_code',{p_id:row.id,p_active:!row.active});
  if(error){setMessage(error.message);return}
  await load();
 }

 return <section id="discounts" className="adminSection discountsSection">
  <div className="sectionLabel"><span>06 / DISCOUNTS</span><p>Gift codes, launch offers and free shipping.</p></div>
  {message&&<p className="dbNotice">{message}</p>}
  <div className="discountLayout">
   <form className="adminPanel discountForm" onSubmit={save}>
    <div className="discountIntro"><span>{form.id?'EDIT CODE':'NEW CODE'}</span><h2>{form.id?'Update':'Create'} <em>offer.</em></h2></div>
    <div className="discountGrid">
     <label><span>CODE</span><input required value={form.code} placeholder="SIDEII10" onChange={e=>setForm({...form,code:e.target.value.toUpperCase().replace(/\s+/g,'')})}/></label>
     <label><span>TYPE</span><select value={form.discount_type} onChange={e=>setForm({...form,discount_type:e.target.value})}><option value="percent">PERCENT %</option><option value="fixed">FIXED TRY</option><option value="free_shipping">FREE SHIPPING</option></select></label>
     {form.discount_type!=='free_shipping'&&<label><span>{form.discount_type==='percent'?'VALUE / %':'VALUE / TRY'}</span><input type="number" min="0" step="0.01" value={form.value} onChange={e=>setForm({...form,value:e.target.value})}/></label>}
     <label><span>MINIMUM BASKET / TRY</span><input type="number" min="0" step="0.01" value={form.min_subtotal} onChange={e=>setForm({...form,min_subtotal:e.target.value})}/></label>
     <label><span>USAGE LIMIT</span><input type="number" min="1" placeholder="UNLIMITED" value={form.usage_limit} onChange={e=>setForm({...form,usage_limit:e.target.value})}/></label>
     <label><span>EXPIRES</span><input type="datetime-local" value={form.valid_until} onChange={e=>setForm({...form,valid_until:e.target.value})}/></label>
     <label className="discountToggle"><input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})}/><span>ACTIVE</span></label>
    </div>
    <div className="formActions"><button type="button" className="ghostButton" onClick={()=>setForm(empty)}>RESET</button><button className="saveButton" disabled={busy}>{busy?'SAVING…':form.id?'SAVE CODE':'CREATE CODE'}</button></div>
   </form>
   <div className="adminPanel discountList">
    <div className="discountListHead"><span>LIVE CODES</span><small>{codes.length} TOTAL</small></div>
    {codes.length===0?<div className="emptyNote">No gift or promo codes yet.</div>:codes.map(row=><article key={row.id}>
      <div><strong>{row.code}</strong><small>{row.discount_type==='percent'?row.value+'% OFF':row.discount_type==='fixed'?'₺'+row.value+' OFF':'FREE SHIPPING'} · MIN ₺{Number(row.min_subtotal||0).toLocaleString('tr-TR')}</small></div>
      <div className="discountUsage"><b>{row.usage_count}{row.usage_limit?'/'+row.usage_limit:''}</b><small>USED</small></div>
      <div className="discountExpiry"><b>{row.valid_until?fmtDate(row.valid_until):'NO EXPIRY'}</b><small>{row.active?'ACTIVE':'PAUSED'}</small></div>
      <button type="button" className="ghostButton" onClick={()=>setForm({...row,value:String(row.value??0),min_subtotal:String(row.min_subtotal??0),usage_limit:row.usage_limit??'',valid_until:row.valid_until?new Date(row.valid_until).toISOString().slice(0,16):''})}>EDIT</button>
      <button type="button" className="ghostButton" onClick={()=>toggle(row)}>{row.active?'PAUSE':'ACTIVATE'}</button>
    </article>)}
   </div>
  </div>
 </section>
}
