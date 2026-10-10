'use client';
import {useEffect,useRef} from 'react';
import {supabase} from '../lib/supabase';

const KEY='sideii-commerce-session-v1';
function session(){
 try{
  let v=sessionStorage.getItem(KEY);
  if(!v){v=crypto.randomUUID();sessionStorage.setItem(KEY,v)}
  return v;
 }catch{return null}
}
function attribution(){
 try{
  const u=new URL(window.location.href);
  const next={
   source:u.searchParams.get('utm_source')||null,
   medium:u.searchParams.get('utm_medium')||null,
   campaign:u.searchParams.get('utm_campaign')||null,
   content:u.searchParams.get('utm_content')||null,
   term:u.searchParams.get('utm_term')||null,
   referral_code:u.searchParams.get('ref')||u.searchParams.get('referral')||null
  };
  const old=JSON.parse(localStorage.getItem('sideii-attribution-v1')||'{}');
  const merged={...old,...Object.fromEntries(Object.entries(next).filter(([,v])=>v))};
  if(Object.values(next).some(Boolean))localStorage.setItem('sideii-attribution-v1',JSON.stringify(merged));
  return merged;
 }catch{return {}}
}
export function getCommerceAttribution(){
 try{return JSON.parse(localStorage.getItem('sideii-attribution-v1')||'{}')}catch{return {}}
}
export function getCommerceSession(){return session()}
export async function trackCommerce(event_type,extra={}){
 if(!supabase)return;
 const a=attribution();
 try{
  await supabase.rpc('track_commerce_event',{
   p_event_type:event_type,p_session_id:session(),
   p_product_id:extra.product_id||null,p_variant_id:extra.variant_id||null,p_order_id:extra.order_id||null,
   p_source:a.source||null,p_medium:a.medium||null,p_campaign:a.campaign||null,p_content:a.content||null,p_term:a.term||null,
   p_referral_code:a.referral_code||null,p_referrer:document.referrer||null,p_path:window.location.pathname+window.location.search,
   p_device:window.matchMedia('(max-width:760px)').matches?'mobile':'desktop',p_properties:extra.properties||{}
  });
 }catch{}
}
export default function CommerceTelemetry(){
 const lastCount=useRef(0);
 const lastWishlist=useRef(0);
 useEffect(()=>{attribution()},[]);
 useEffect(()=>{
  const onCart=e=>{
   const cart=Array.isArray(e?.detail)?e.detail:[];
   const count=cart.reduce((s,x)=>s+Number(x.qty||0),0);
   if(count>lastCount.current)trackCommerce('add_to_bag',{properties:{cart_count:count}});
   lastCount.current=count;
  };
  const onWishlist=e=>{const items=Array.isArray(e?.detail)?e.detail:[];if(items.length>lastWishlist.current)trackCommerce('wishlist_add',{properties:{wishlist_count:items.length}});lastWishlist.current=items.length};
  window.addEventListener('sideii-cart',onCart);window.addEventListener('sideii-wishlist',onWishlist);
  return()=>{window.removeEventListener('sideii-cart',onCart);window.removeEventListener('sideii-wishlist',onWishlist)};
 },[]);
 return null;
}
