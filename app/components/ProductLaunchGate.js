'use client';
import {useEffect,useMemo,useState} from 'react';
import {supabase} from '../lib/supabase';

export default function ProductLaunchGate({productId}){
 const [launch,setLaunch]=useState(null),[email,setEmail]=useState(''),[message,setMessage]=useState(''),[collector,setCollector]=useState(null);
 const [now,setNow]=useState(Date.now());
 useEffect(()=>{if(!productId)return;(async()=>{const {data}=await supabase.from('product_launches').select('starts_at,early_access_at,ends_at,max_per_customer,notify_enabled,active').eq('product_id',productId).eq('active',true).maybeSingle();setLaunch(data||null);const {data:sessionData}=await supabase.auth.getSession();if(sessionData.session?.user){const {data:c}=await supabase.rpc('get_my_collector_status');setCollector(Array.isArray(c)?c[0]||null:c||null)}})()},[productId]);
 useEffect(()=>{if(!launch?.starts_at)return;const id=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(id)},[launch?.starts_at]);
 const accessAt=useMemo(()=>{
  if(!launch?.starts_at)return null;
  const publicAt=new Date(launch.starts_at).getTime();
  const tierHours=Number(collector?.early_access_hours||0);
  const explicit=launch.early_access_at?new Date(launch.early_access_at).getTime():null;
  const tierAt=tierHours>0?publicAt-tierHours*3600000:null;
  return collector?(explicit&&tierAt?Math.min(explicit,tierAt):(explicit||tierAt||publicAt)):publicAt;
 },[launch?.starts_at,launch?.early_access_at,collector]);
 const remaining=useMemo(()=>{
  if(!accessAt)return null;
  const d=Math.max(0,accessAt-now);
  return {d,days:Math.floor(d/86400000),h:Math.floor((d%86400000)/3600000),m:Math.floor((d%3600000)/60000),s:Math.floor((d%60000)/1000)};
 },[accessAt,now]);
 if(!launch)return null;
 async function subscribe(e){
  e.preventDefault();
  const {error}=await supabase.rpc('subscribe_product_launch',{p_product_id:productId,p_email:email.trim()});
  setMessage(error?error.message:'Launch alert saved.');
  if(!error)setEmail('');
 }
 const publicStart=launch?.starts_at?new Date(launch.starts_at).getTime():0;
 const earlyLive=!!collector&&accessAt&&now>=accessAt&&publicStart&&now<publicStart;
 const countdown=remaining?.d>0
  ?remaining.days+'D '+String(remaining.h).padStart(2,'0')+'H '+String(remaining.m).padStart(2,'0')+'M '+String(remaining.s).padStart(2,'0')+'S'
  :(earlyLive?'EARLY ACCESS LIVE':'LIVE NOW');
 return <aside className="productLaunchGate">
  <div><span>DROP / RELEASE</span><b>{countdown}</b>{earlyLive&&<small>{collector?.label||'COLLECTOR'} ACCESS · {collector?.early_access_hours||0}H EARLY</small>}{launch.max_per_customer&&<small>LIMIT {launch.max_per_customer} PER CUSTOMER</small>}</div>
  {launch.notify_enabled&&remaining?.d>0&&<form onSubmit={subscribe}><input type="email" required placeholder="EMAIL FOR DROP ALERT" value={email} onChange={e=>setEmail(e.target.value)}/><button>NOTIFY ME</button>{message&&<small>{message}</small>}</form>}
 </aside>;
}
