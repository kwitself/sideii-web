'use client';
import {useState} from 'react';
import {supabase} from '../lib/supabase';

export default function OrderTrackingClient(){
 const [orderNo,setOrderNo]=useState('');
 const [email,setEmail]=useState('');
 const [busy,setBusy]=useState(false);
 const [result,setResult]=useState(undefined);
 async function submit(e){
  e.preventDefault();setBusy(true);setResult(undefined);
  const n=Number(String(orderNo).replace(/\D/g,''));
  if(!n||!email.trim()){setBusy(false);setResult(null);return}
  const {data}=await supabase.rpc('lookup_order_tracking',{p_order_no:n,p_email:email.trim()});
  setResult(data||null);setBusy(false);
 }
 return <section className="trackingShell">
  <div className="trackingIntro"><span>ORDER / TRACKING</span><h1>Follow the<br/><em>object.</em></h1><p>Enter your SIDE:II order number and the email used at checkout.</p></div>
  <form className="trackingForm" onSubmit={submit}>
   <label>ORDER NUMBER<input inputMode="numeric" placeholder="SII-0026" value={orderNo} onChange={e=>setOrderNo(e.target.value)}/></label>
   <label>EMAIL<input type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/></label>
   <button disabled={busy}>{busy?'CHECKING…':'TRACK ORDER →'}</button>
  </form>
  {result===null&&<div className="trackingResult empty"><b>NO MATCH</b><p>Check the order number and email and try again.</p></div>}
  {result&&<div className="trackingResult">
   <div><span>ORDER</span><strong>#SII-{String(result.order_no).padStart(4,'0')}</strong></div>
   <div><span>STATUS</span><strong>{String(result.status||'pending').toUpperCase()}</strong></div>
   <div><span>PAYMENT</span><strong>{String(result.payment_status||'unpaid').toUpperCase()}</strong></div>
   <div><span>CARRIER</span><strong>{result.shipping_carrier||'—'}</strong></div>
   <div><span>TRACKING</span><strong>{result.tracking_number||'—'}</strong></div>
   {result.reservation_expires_at&&result.payment_status==='unpaid'&&<small>Reservation valid until {new Date(result.reservation_expires_at).toLocaleString()}.</small>}
  </div>}
 </section>;
}
