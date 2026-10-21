'use client';
import {useState} from 'react';
import {parseOrderNumber} from '../lib/storefront-validation';

export default function OrderTrackingClient(){
 const [orderNo,setOrderNo]=useState('');
 const [email,setEmail]=useState('');
 const [busy,setBusy]=useState(false);
 const [result,setResult]=useState(undefined);
 const [error,setError]=useState('');
 async function submit(e){
  e.preventDefault();if(busy)return;setResult(undefined);setError('');
  const n=parseOrderNumber(orderNo);
  if(!n||!email.trim()){setError('Enter a valid order number, such as SII-0026, and your checkout email.');return}
  setBusy(true);
  try{
   const response=await fetch('/api/order-tracking',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({order_no:n,email:email.trim()})});
   if(response.status===404){setResult(null);return}
   if(response.status===429){setError('Too many attempts. Please wait a moment before trying again.');return}
   if(!response.ok)throw new Error('Tracking unavailable');
   const data=await response.json();setResult(data.order||null);
  }catch{setError('Order tracking is temporarily unavailable. Your details have been kept; please try again.')}finally{setBusy(false)}
 }
 return <section className="trackingShell">
  <div className="trackingIntro"><span>ORDER / TRACKING</span><h1>Follow the<br/><em>object.</em></h1><p>Enter your SIDE:II order number and the email used at checkout.</p></div>
  <form className="trackingForm" onSubmit={submit}>
   <label>ORDER NUMBER<input required autoCapitalize="characters" placeholder="SII-0026" value={orderNo} onChange={e=>setOrderNo(e.target.value)}/></label>
   <label>EMAIL<input required type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/></label>
   <button disabled={busy}>{busy?'CHECKING…':'TRACK ORDER →'}</button>
  </form>
  {error&&<div className="trackingResult empty" role="alert"><b>PLEASE TRY AGAIN</b><p>{error}</p></div>}
  {result===null&&<div className="trackingResult empty" role="status"><b>NO MATCH</b><p>Check the order number and email and try again.</p></div>}
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
