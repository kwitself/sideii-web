'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {supabase} from '../lib/supabase';
import {trackCommerce} from './CommerceTelemetry';

export default function PostPurchaseOffers({orderId,paymentStatus,guestAccessToken=null}){
 const [offers,setOffers]=useState([]),[claimed,setClaimed]=useState({}),[busy,setBusy]=useState(null);
 useEffect(()=>{
  if(!orderId||paymentStatus!=='paid'||!supabase){setOffers([]);return}
  let live=true;
  (async()=>{
   const {data}=await supabase.rpc('get_active_post_purchase_offers',{p_order_id:orderId,p_guest_access_token:guestAccessToken});
   if(live){const rows=Array.isArray(data)?data:[];setOffers(rows);if(rows.length)trackCommerce('upsell_view',{order_id:orderId,properties:{offers:rows.length}})}
  })();
  return()=>{live=false};
 },[orderId,paymentStatus,guestAccessToken]);
 if(!offers.length)return null;
 async function claim(offer){
  setBusy(offer.id);
  const {data,error}=await supabase.rpc('claim_post_purchase_offer',{p_order_id:orderId,p_offer_id:offer.id,p_guest_access_token:guestAccessToken});
  setBusy(null);
  if(error)return;
  setClaimed(v=>({...v,[offer.id]:data}));
  trackCommerce('upsell_accept',{order_id:orderId,properties:{offer_id:offer.id,target_product_id:offer.target_product_id}});
  try{await navigator.clipboard.writeText(data.code)}catch{}
 }
 return <section className="postPurchaseOffers">
  <header><span>AFTER / ORDER</span><b>Complete the object.</b><small>Limited post-purchase offers tied to this paid order.</small></header>
  {offers.map(offer=>{const c=claimed[offer.id],p=offer.product||{};return <article key={offer.id}>
   <div><small>{offer.discount_pct}% OFFER</small><b>{p.title||'SIDE:II object'}</b><span>{offer.window_minutes} MINUTE WINDOW</span></div>
   {c?<div className="postPurchaseClaimed"><strong>{c.code}</strong><small>CODE COPIED</small>{p.slug&&<Link href={(p.product_type==='merch'?'/store/':'/releases/')+p.slug}>OPEN OBJECT →</Link>}</div>:<button type="button" disabled={busy===offer.id} onClick={()=>claim(offer)}>{busy===offer.id?'CREATING…':'CLAIM OFFER →'}</button>}
  </article>})}
 </section>;
}
