'use client';
import {useEffect,useMemo,useState} from 'react';
import {usePathname} from 'next/navigation';
import {supabase} from '../lib/supabase';

const money=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:0}).format(Number(n||0));

export default function GlobalAccount(){
 const pathname=usePathname();
 const [open,setOpen]=useState(false),[session,setSession]=useState(null),[mode,setMode]=useState('signin');
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[orders,setOrders]=useState([]);
 const [auth,setAuth]=useState({email:'',password:'',full_name:''});
 const [profile,setProfile]=useState({full_name:'',phone:'',address_line:'',city:'',district:'',postal_code:''});
 const signedIn=!!session?.user;
 const displayName=profile.full_name||session?.user?.email?.split('@')[0]||'ACCOUNT';
 const initials=useMemo(()=>displayName.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]?.toUpperCase()).join('')||'II',[displayName]);

 async function loadAccount(user){
  if(!supabase||!user)return;
  const [{data:p},{data:o}]=await Promise.all([
   supabase.from('customer_accounts').select('full_name,phone,address_line,city,district,postal_code').eq('user_id',user.id).maybeSingle(),
   supabase.rpc('get_my_store_orders')
  ]);
  const next={full_name:p?.full_name||user.user_metadata?.full_name||'',phone:p?.phone||'',address_line:p?.address_line||'',city:p?.city||'',district:p?.district||'',postal_code:p?.postal_code||''};
  setProfile(next);setOrders(Array.isArray(o)?o:[]);
  window.dispatchEvent(new CustomEvent('sideii-account-profile',{detail:{email:user.email||'',...next}}));
 }

 useEffect(()=>{
  if(!supabase)return;
  supabase.auth.getSession().then(({data})=>{setSession(data.session||null);if(data.session?.user)loadAccount(data.session.user)});
  const {data:sub}=supabase.auth.onAuthStateChange((_event,next)=>{setSession(next||null);setMessage('');if(next?.user)loadAccount(next.user);else{setOrders([]);window.dispatchEvent(new CustomEvent('sideii-account-profile',{detail:null}))}});
  return()=>sub.subscription.unsubscribe();
 },[]);

 async function submitAuth(e){
  e.preventDefault();setBusy(true);setMessage('');
  if(mode==='signup'){
   const {data,error}=await supabase.auth.signUp({email:auth.email.trim(),password:auth.password,options:{data:{full_name:auth.full_name.trim()}}});
   setBusy(false);if(error)return setMessage(error.message);
   if(data.session){setOpen(false)}else setMessage('Check your email to confirm your account.');
   return;
  }
  const {error}=await supabase.auth.signInWithPassword({email:auth.email.trim(),password:auth.password});
  setBusy(false);if(error)return setMessage(error.message);setOpen(false);
 }
 async function saveProfile(e){
  e.preventDefault();setBusy(true);setMessage('');
  const {data,error}=await supabase.rpc('save_my_customer_account',{
   p_full_name:profile.full_name,p_phone:profile.phone,p_address_line:profile.address_line,
   p_city:profile.city,p_district:profile.district,p_postal_code:profile.postal_code
  });
  setBusy(false);if(error)return setMessage(error.message);
  const saved=Array.isArray(data)?data[0]:data;
  const next={full_name:saved?.full_name||'',phone:saved?.phone||'',address_line:saved?.address_line||'',city:saved?.city||'',district:saved?.district||'',postal_code:saved?.postal_code||''};
  setProfile(next);setMessage('Account details saved.');
  window.dispatchEvent(new CustomEvent('sideii-account-profile',{detail:{email:session?.user?.email||'',...next}}));
 }
 async function resetPassword(){
  if(!auth.email.trim())return setMessage('Enter your email first.');
  const {error}=await supabase.auth.resetPasswordForEmail(auth.email.trim(),{redirectTo:window.location.origin});
  setMessage(error?error.message:'Password reset email sent.');
 }
 async function signOut(){await supabase.auth.signOut();setOpen(false)}

 if(pathname?.startsWith('/admin'))return null;
 return <>
  {!open&&<button className="globalAccountTrigger" onClick={()=>{setMessage('');setOpen(true)}}>{signedIn?initials:'ACCOUNT'}</button>}
  <aside className={'globalAccountDrawer '+(open?'open':'')}>
   <button className="globalAccountClose" onClick={()=>setOpen(false)}>CLOSE ×</button><span>ACCOUNT</span>
   {!signedIn?<div className="accountAuth">
    <div className="accountTabs"><button className={mode==='signin'?'active':''} onClick={()=>setMode('signin')}>SIGN IN</button><button className={mode==='signup'?'active':''} onClick={()=>setMode('signup')}>CREATE ACCOUNT</button></div>
    <h3>{mode==='signup'?'Join SIDE:II.':'Welcome back.'}</h3>
    <form onSubmit={submitAuth}>
     {mode==='signup'&&<label>FULL NAME<input required value={auth.full_name} onChange={e=>setAuth({...auth,full_name:e.target.value})}/></label>}
     <label>EMAIL<input type="email" required value={auth.email} onChange={e=>setAuth({...auth,email:e.target.value})}/></label>
     <label>PASSWORD<input type="password" minLength="6" required value={auth.password} onChange={e=>setAuth({...auth,password:e.target.value})}/></label>
     {message&&<p className="accountMessage">{message}</p>}
     <button className="accountPrimary" disabled={busy}>{busy?'PLEASE WAIT…':mode==='signup'?'CREATE ACCOUNT':'SIGN IN'}</button>
     {mode==='signin'&&<button type="button" className="accountTextButton" onClick={resetPassword}>FORGOT PASSWORD?</button>}
    </form>
   </div>:<div className="accountBody">
    <header className="accountIdentity"><b>{displayName}</b><small>{session.user.email}</small></header>
    <form className="accountProfile" onSubmit={saveProfile}>
     <label>FULL NAME<input value={profile.full_name} onChange={e=>setProfile({...profile,full_name:e.target.value})}/></label>
     <label>PHONE<input value={profile.phone} onChange={e=>setProfile({...profile,phone:e.target.value})}/></label>
     <label>ADDRESS<textarea value={profile.address_line} onChange={e=>setProfile({...profile,address_line:e.target.value})}/></label>
     <div className="accountTwo"><label>CITY<input value={profile.city} onChange={e=>setProfile({...profile,city:e.target.value})}/></label><label>DISTRICT<input value={profile.district} onChange={e=>setProfile({...profile,district:e.target.value})}/></label></div>
     <label>POSTAL CODE<input value={profile.postal_code} onChange={e=>setProfile({...profile,postal_code:e.target.value})}/></label>
     {message&&<p className="accountMessage">{message}</p>}
     <button className="accountPrimary" disabled={busy}>{busy?'SAVING…':'SAVE DETAILS'}</button>
    </form>
    <section className="accountOrders"><div className="accountSectionHead"><span>ORDER HISTORY</span><small>{orders.length}</small></div>
     {orders.length===0?<p className="accountEmpty">No orders yet.</p>:orders.map(o=><article key={o.id}><div><b>#SII-{String(o.order_no).padStart(4,'0')}</b><small>{new Date(o.created_at).toLocaleDateString('tr-TR')} · {String(o.status).toUpperCase()}</small></div><strong>{money(o.total)}</strong>{o.tracking_number&&<em>{o.shipping_carrier||'CARRIER'} · {o.tracking_number}</em>}</article>)}
    </section>
    <button className="accountSignout" onClick={signOut}>SIGN OUT</button>
   </div>}
  </aside>
  {open&&<button className="globalAccountShade" aria-label="Close account" onClick={()=>setOpen(false)}/>}
 </>;
}