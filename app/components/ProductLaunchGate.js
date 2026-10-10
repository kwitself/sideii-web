'use client';
import {useEffect,useMemo,useState} from 'react';
import {supabase} from '../lib/supabase';

export default function ProductLaunchGate({productId}){
 const [launch,setLaunch]=useState(null),[email,setEmail]=useState(''),[message,setMessage]=useState('');
 const [now,setNow]=useState(Date.now());
 useEffect(()=>{if(!productId)return;(async()=>{const {data}=await supabase.from('product_launches').select('starts_at,early_access_at,ends_at,max_per_customer,notify_enabled,active').eq('product_id',productId).eq('active',true).maybeSingle();setLaunch(data||null)})()},[productId]);
 useEffect(()=>{if(!launch?.starts_at)return;const id=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(id)},[launch?.starts_at]);
 const remaining=useMemo(()=>{
  if(!launch?.starts_at)return null;
  const d=Math.max(0,new Date(launch.starts_at).getTime()-now);
  return {d,days:Math.floor(d/86400000),h:Math.floor((d%86400000)/3600000),m:Math.floor((d%3600000)/60000),s:Math.floor((d%60000)/1000)};
 },[launch?.starts_at,now]);
 if(!launch)return null;
 async function subscribe(e){
  e.preventDefault();
  const {error}=await supabase.rpc('subscribe_product_launch',{p_product_id:productId,p_email:email.trim()});
  setMessage(error?error.message:'Launch alert saved.');
  if(!error)setEmail('');
 }
 const countdown=remaining?.d>0
  ?remaining.days+'D '+String(remaining.h).padStart(2,'0')+'H '+String(remaining.m).padStart(2,'0')+'M '+String(remaining.s).padStart(2,'0')+'S'
  :'LIVE NOW';
 return <aside className="productLaunchGate">
  <div><span>DROP / RELEASE</span><b>{countdown}</b>{launch.max_per_customer&&<small>LIMIT {launch.max_per_customer} PER CUSTOMER</small>}</div>
  {launch.notify_enabled&&remaining?.d>0&&<form onSubmit={subscribe}><input type="email" required placeholder="EMAIL FOR DROP ALERT" value={email} onChange={e=>setEmail(e.target.value)}/><button>NOTIFY ME</button>{message&&<small>{message}</small>}</form>}
 </aside>;
}
