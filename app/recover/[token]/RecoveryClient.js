'use client';
import {useEffect,useState} from 'react';
import {useRouter,useSearchParams} from 'next/navigation';
import {supabase} from '../../lib/supabase';
import {writeCart} from '../../lib/cart';
import {trackCommerce} from '../../components/CommerceTelemetry';

export default function RecoveryClient({token}){
 const router=useRouter(),search=useSearchParams();const [data,setData]=useState(undefined),[busy,setBusy]=useState(false),[unsubscribed,setUnsubscribed]=useState(false);
 useEffect(()=>{if(!token)return;(async()=>{
  if(search?.get('unsubscribe')==='1'){
   await supabase.rpc('unsubscribe_cart_recovery',{p_token:token});
   setUnsubscribed(true);
  }
  const {data}=await supabase.rpc('get_cart_recovery',{p_token:token});
  setData(data||null);
  if(data){supabase.rpc('mark_cart_recovery_opened',{p_token:token});trackCommerce('recovery_open',{properties:{recovery:true}})}
 })()},[token,search]);
 if(data===undefined)return <section className="recoveryShell"><p>Loading saved bag…</p></section>;
 if(unsubscribed)return <section className="recoveryShell"><span>BAG / RECOVERY</span><h1>Reminder emails<br/><em>are off.</em></h1><p>Your saved bag remains available on this device, but we will not send more recovery reminders for this session.</p></section>;
 if(!data)return <section className="recoveryShell"><h1>This bag is no longer available.</h1><p>It may have expired or already been converted into an order.</p></section>;
 const cart=Array.isArray(data.cart)?data.cart:[];
 function restore(){setBusy(true);writeCart(cart);window.dispatchEvent(new CustomEvent('sideii-cart',{detail:cart}));setTimeout(()=>{router.push('/store');window.dispatchEvent(new Event('sideii-open-bag'))},100)}
 return <section className="recoveryShell"><span>BAG / RECOVERY</span><h1>Your objects<br/><em>are still here.</em></h1><p>{cart.length} saved item{cart.length===1?'':'s'} from your previous visit.</p><div className="recoveryItems">{cart.map((x,i)=><article key={x.key||x.variantId||i}><div><b>{x.title||'SIDE:II object'}</b><small>{x.format||x.sku||''} · QTY {x.qty||1}</small></div><strong>{Number(x.price||0).toLocaleString('tr-TR')} TRY</strong></article>)}</div><button onClick={restore} disabled={busy}>{busy?'RESTORING…':'RESTORE BAG →'}</button></section>;
}
