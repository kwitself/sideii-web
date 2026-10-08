'use client';

import {useEffect,useState} from 'react';
import {useParams} from 'next/navigation';
import Link from 'next/link';
import GlobalHeader from '../../components/GlobalHeader';
import {supabase} from '../../lib/supabase';
import '../guest-order.css';

const money=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:2}).format(Number(n||0));

export default function GuestOrderPage(){
 const params=useParams();
 const token=String(params?.token||'');
 const [order,setOrder]=useState(null);
 const [paymentLink,setPaymentLink]=useState(null);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState('');
 const [reason,setReason]=useState('');
 const [message,setMessage]=useState('');

 async function load(){
  if(!supabase||!token)return;
  setLoading(true);
  const o=await supabase.rpc('get_guest_order_portal',{p_guest_access_token:token});
  const portal=o.data||null;
  if(portal?.id){
   const pay=await supabase.rpc('get_guest_order_payment_link',{p_order_id:portal.id,p_guest_access_token:token});
   setPaymentLink(pay.data||null);
  }else setPaymentLink(null);
  setOrder(portal);
  setLoading(false);
 }

 useEffect(()=>{load()},[token]);

 async function requestAction(type){
  if(!order||busy)return;
  setBusy(type);setMessage('');
  const {error}=await supabase.rpc('request_guest_order_action',{
   p_guest_access_token:token,
   p_type:type,
   p_reason:reason.trim()||null
  });
  setBusy('');
  if(error){setMessage(error.message);return}
  setReason('');
  setMessage(type==='cancel'?'Cancellation request sent.':type==='refund'?'Refund request sent.':'Return request sent.');
  await load();
 }

 async function download(item){
  if(!item?.download_available||busy)return;
  setBusy('download:'+item.id);setMessage('');
  const {data,error}=await supabase.rpc('create_guest_digital_download_grant',{
   p_guest_access_token:token,
   p_order_item_id:item.id
  });
  setBusy('');
  if(error||!data){setMessage(error?.message||'Digital download unavailable.');return}
  window.open('/api/download/'+encodeURIComponent(String(data)),'_blank','noopener,noreferrer');
 }

 if(loading)return <main className="guestOrderPage"><GlobalHeader/><section className="guestOrderHero shell"><span>ORDER / ACCESS</span><h1>Loading your order.</h1></section></main>;
 if(!order)return <main className="guestOrderPage"><GlobalHeader/><section className="guestOrderHero shell"><span>ORDER / ACCESS</span><h1>This order link is unavailable.</h1><p>The private order link may be invalid. Use the original order email if you have another copy.</p><Link href="/store">RETURN TO STORE →</Link></section></main>;

 const canCancel=order.payment_status==='unpaid'&&['pending','preparing'].includes(order.status);
 const canRefund=order.payment_status==='paid'&&['pending','preparing'].includes(order.status);
 const canReturn=order.payment_status==='paid'&&['shipped','completed'].includes(order.status);

 return <main className="guestOrderPage">
  <GlobalHeader/>
  <section className="guestOrderHero shell">
   <span>PRIVATE ORDER ACCESS</span>
   <div><h1>Order <i>#SII-{String(order.order_no).padStart(4,'0')}</i></h1><p>Keep this link private. Anyone with it can view and manage this order.</p></div>
  </section>

  <section className="guestOrderLayout shell">
   <article className="guestOrderCard guestOrderSummary">
    <header><span>ORDER STATUS</span><b>{String(order.status).toUpperCase()}</b></header>
    <div className="guestOrderStats">
     <div><small>PAYMENT</small><strong>{String(order.payment_status).toUpperCase()}</strong></div>
     <div><small>TOTAL</small><strong>{money(order.total)}</strong></div>
     <div><small>EXTERNAL DUE</small><strong>{money(order.external_payment_due)}</strong></div>
     <div><small>PLACED</small><strong>{new Date(order.created_at).toLocaleDateString('tr-TR')}</strong></div>
    </div>
    {order.tracking_number&&<div className="guestTracking"><small>TRACKING</small><b>{order.shipping_carrier||'CARRIER'} · {order.tracking_number}</b></div>}
   </article>

   {order.payment_status==='unpaid'&&<article className="guestOrderCard guestPaymentCard">
    <header><span>PAYMENT</span><b>IYZICO LINK</b></header>
    {paymentLink?.available?<><p>Your secure iyzico payment link is ready for the exact outstanding amount.</p><a href={paymentLink.url} target="_blank" rel="noreferrer">PAY {money(paymentLink.external_payment_due)} WITH IYZICO ↗</a></>:<><p>{paymentLink?.reason==='amount_mismatch'?'The configured payment Link does not match this order amount, so payment is temporarily held for manual matching.':paymentLink?.reason==='manual_link_required'?'This order needs a manually created iyzico Link because it contains multiple products or quantities.':'A payment Link has not been assigned yet.'}</p><small>Keep order #SII-{String(order.order_no).padStart(4,'0')} for payment matching.</small></>}
   </article>}

   <article className="guestOrderCard guestOrderItems">
    <header><span>ITEMS</span><b>{order.items?.length||0}</b></header>
    {(order.items||[]).map(item=><div className="guestOrderItem" key={item.id}><div><small>{item.sku} · {String(item.format).toUpperCase()}</small><b>{item.title}</b><span>QTY {item.quantity}{item.preorder?' · PRE-ORDER':''}</span></div><strong>{money(item.line_total)}</strong>{item.download_available&&<button type="button" disabled={busy==='download:'+item.id} onClick={()=>download(item)}>{busy==='download:'+item.id?'PREPARING…':'DOWNLOAD DIGITAL EDITION ↗'}</button>}</div>)}
   </article>

   {(canCancel||canRefund||canReturn)&&<article className="guestOrderCard guestOrderActions">
    <header><span>ORDER REQUEST</span><b>AFTERCARE</b></header>
    <p>Requests remain attached to this order and are reviewed before they are accepted.</p>
    <textarea maxLength="1000" value={reason} onChange={e=>setReason(e.target.value)} placeholder="Optional reason / note"/>
    <div>{canCancel&&<button type="button" disabled={!!busy} onClick={()=>requestAction('cancel')}>REQUEST CANCELLATION</button>}{canRefund&&<button type="button" disabled={!!busy} onClick={()=>requestAction('refund')}>REQUEST REFUND</button>}{canReturn&&<button type="button" disabled={!!busy} onClick={()=>requestAction('return')}>REQUEST RETURN</button>}</div>
   </article>}

   {(order.requests||[]).length>0&&<article className="guestOrderCard guestOrderRequests">
    <header><span>REQUEST HISTORY</span><b>{order.requests.length}</b></header>
    {order.requests.map(r=><div key={r.id}><b>{String(r.request_type).toUpperCase()}</b><span>{String(r.status).toUpperCase()}</span><small>{new Date(r.created_at).toLocaleDateString('tr-TR')}</small>{r.reason&&<p>{r.reason}</p>}</div>)}
   </article>}

   {message&&<p className="guestOrderMessage">{message}</p>}
   <div className="guestOrderFoot"><Link href="/policies">STORE POLICIES →</Link><Link href="/store">RETURN TO STORE →</Link></div>
  </section>
 </main>;
}
