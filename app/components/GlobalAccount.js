'use client';
import Link from 'next/link';
import {useEffect,useMemo,useState} from 'react';
import {usePathname} from 'next/navigation';
import {supabase} from '../lib/supabase';
import TurkeyAddressFields from './TurkeyAddressFields';
import {readWishlist,writeWishlist} from '../lib/wishlist';
import {readCart} from '../lib/cart';

const money=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:0}).format(Number(n||0));

export default function GlobalAccount(){
 const pathname=usePathname();
 const [open,setOpen]=useState(false),[session,setSession]=useState(null),[mode,setMode]=useState('signin');
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[orders,setOrders]=useState([]),[selectedOrder,setSelectedOrder]=useState(null),[closingOrder,setClosingOrder]=useState(false),[wishlist,setWishlist]=useState([]),[savedCart,setSavedCart]=useState([]),[addresses,setAddresses]=useState([]),[addressEditing,setAddressEditing]=useState(false),[addressBusy,setAddressBusy]=useState(false);
 const emptyAddress={id:null,label:'HOME',full_name:'',phone:'',address_line:'',city:'',district:'',postal_code:'',is_default:false};
 const [addressForm,setAddressForm]=useState(emptyAddress);
 const [auth,setAuth]=useState({email:'',password:'',full_name:''});
 const [profile,setProfile]=useState({full_name:'',phone:'',address_line:'',city:'',district:'',postal_code:''});
 const signedIn=!!session?.user;
 const displayName=profile.full_name||session?.user?.email?.split('@')[0]||'ACCOUNT';
 const initials=useMemo(()=>displayName.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]?.toUpperCase()).join('')||'II',[displayName]);

 async function loadAccount(user){
  if(!supabase||!user)return;
  const [{data:p,error:profileError},{data:o},{data:w},{data:a}]=await Promise.all([
   supabase.rpc('get_my_customer_account'),
   supabase.rpc('get_my_store_orders'),
   supabase.from('customer_wishlist').select('product_slug,title,catalogue,cover,is_merch').eq('user_id',user.id).order('created_at',{ascending:false}),
   supabase.from('customer_addresses').select('id,label,full_name,phone,address_line,city,district,postal_code,is_default').eq('user_id',user.id).order('is_default',{ascending:false}).order('created_at',{ascending:true})
  ]);
  const row=Array.isArray(p)?p[0]:p;
  const next={full_name:row?.full_name||user.user_metadata?.full_name||'',phone:row?.phone||'',address_line:row?.address_line||'',city:row?.city||'',district:row?.district||'',postal_code:row?.postal_code||''};
  if(profileError) setMessage(profileError.message);
  const local=readWishlist();
  const merged=[...(w||[])];
  for(const item of local)if(!merged.some(x=>x.product_slug===item.product_slug))merged.push(item);
  setWishlist(merged);writeWishlist(merged);
  if(local.length) await supabase.from('customer_wishlist').upsert(local.map(x=>({...x,user_id:user.id})),{onConflict:'user_id,product_slug'});
  setProfile(next);setOrders(Array.isArray(o)?o:[]);setAddresses(Array.isArray(a)?a:[]);
  window.dispatchEvent(new CustomEvent('sideii-account-profile',{detail:{email:user.email||'',...next}}));
 }

 useEffect(()=>{
  const syncWishlist=e=>setWishlist(e?.detail||readWishlist());
  const syncCart=e=>setSavedCart(e?.detail||readCart());
  setWishlist(readWishlist());setSavedCart(readCart());
  window.addEventListener('sideii-wishlist',syncWishlist);
  window.addEventListener('sideii-saved-cart',syncCart);
  window.addEventListener('sideii-cart',syncCart);
  return()=>{window.removeEventListener('sideii-wishlist',syncWishlist);window.removeEventListener('sideii-saved-cart',syncCart);window.removeEventListener('sideii-cart',syncCart)};
 },[]);

 useEffect(()=>{
  if(!supabase)return;
  let live=true;
  const bootstrap=async()=>{
    const {data}=await supabase.auth.getSession();
    if(!live)return;
    const current=data.session||null;
    setSession(current);
    if(current?.user) await loadAccount(current.user);
  };
  bootstrap();
  const {data:sub}=supabase.auth.onAuthStateChange((event,next)=>{
    if(!live)return;
    setSession(next||null);setMessage('');
    if(event==='SIGNED_IN'&&next?.user) setTimeout(()=>loadAccount(next.user),0);
    if(event==='SIGNED_OUT'){setOrders([]);setProfile({full_name:'',phone:'',address_line:'',city:'',district:'',postal_code:''});window.dispatchEvent(new CustomEvent('sideii-account-profile',{detail:null}))}
  });
  return()=>{live=false;sub.subscription.unsubscribe()};
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
 async function removeWishlistItem(slug){
  const next=wishlist.filter(x=>x.product_slug!==slug);
  setWishlist(next);writeWishlist(next);
  if(session?.user)await supabase.from('customer_wishlist').delete().eq('user_id',session.user.id).eq('product_slug',slug);
 }
 async function saveAddress(e){
  e.preventDefault();
  if(!session?.user)return;
  if(!addressForm.address_line.trim()||!addressForm.city||!addressForm.district){setMessage('Complete the address, city and district.');return}
  setAddressBusy(true);setMessage('');
  const {data,error}=await supabase.rpc('save_my_customer_address',{
   p_id:addressForm.id||null,
   p_label:addressForm.label||'HOME',
   p_full_name:addressForm.full_name||profile.full_name||'',
   p_phone:addressForm.phone||profile.phone||'',
   p_address_line:addressForm.address_line,
   p_city:addressForm.city,
   p_district:addressForm.district,
   p_postal_code:addressForm.postal_code||'',
   p_is_default:!!addressForm.is_default
  });
  setAddressBusy(false);
  if(error){setMessage(error.message);return}
  await loadAccount(session.user);
  setAddressForm(emptyAddress);setAddressEditing(false);setMessage('Address saved.');
 }
 function editAddress(a){setAddressForm({...emptyAddress,...a});setAddressEditing(true)}
 async function deleteAddress(id){
  if(!session?.user)return;
  const {error}=await supabase.from('customer_addresses').delete().eq('id',id).eq('user_id',session.user.id);
  if(error){setMessage(error.message);return}
  await loadAccount(session.user);
 }
 function useAddress(a){
  window.dispatchEvent(new CustomEvent('sideii-checkout-address',{detail:a}));
  window.dispatchEvent(new Event('sideii-open-bag'));
  setOpen(false);
 }
 function closeOrderDetail(){
  if(!selectedOrder||closingOrder)return;
  setClosingOrder(true);
  setTimeout(()=>{setSelectedOrder(null);setClosingOrder(false)},220);
 }
 function toggleOrder(o){
  if(selectedOrder?.id===o.id){closeOrderDetail();return}
  setClosingOrder(false);
  setSelectedOrder(o);
 }

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
     <TurkeyAddressFields form={profile} setForm={setProfile}/>
     <label>POSTAL CODE<input value={profile.postal_code} onChange={e=>setProfile({...profile,postal_code:e.target.value})}/></label>
     {message&&<p className="accountMessage">{message}</p>}
     <button className="accountPrimary" disabled={busy}>{busy?'SAVING…':'SAVE DETAILS'}</button>
    </form>
    <section className="accountAddressBook">
      <div className="accountSectionHead"><span>ADDRESS BOOK</span><small>{addresses.length}</small></div>
      <div className="accountAddressActions"><button type="button" onClick={()=>{setAddressForm({...emptyAddress,full_name:profile.full_name,phone:profile.phone});setAddressEditing(v=>!v)}}>{addressEditing?'CANCEL':'＋ ADD ADDRESS'}</button></div>
      {addressEditing&&<form className="accountAddressForm" onSubmit={saveAddress}>
        <div className="accountAddressLabelRow">{['HOME','WORK','OTHER'].map(x=><button type="button" key={x} className={addressForm.label===x?'active':''} onClick={()=>setAddressForm({...addressForm,label:x})}>{x}</button>)}</div>
        <label>FULL NAME<input value={addressForm.full_name} onChange={e=>setAddressForm({...addressForm,full_name:e.target.value})}/></label>
        <label>PHONE<input value={addressForm.phone} onChange={e=>setAddressForm({...addressForm,phone:e.target.value})}/></label>
        <label>ADDRESS<textarea required value={addressForm.address_line} onChange={e=>setAddressForm({...addressForm,address_line:e.target.value})}/></label>
        <TurkeyAddressFields form={addressForm} setForm={setAddressForm}/>
        <label>POSTAL CODE<input value={addressForm.postal_code} onChange={e=>setAddressForm({...addressForm,postal_code:e.target.value})}/></label>
        <label className="accountDefaultAddress"><input type="checkbox" checked={!!addressForm.is_default} onChange={e=>setAddressForm({...addressForm,is_default:e.target.checked})}/><span>USE AS DEFAULT ADDRESS</span></label>
        <button className="accountPrimary" disabled={addressBusy}>{addressBusy?'SAVING…':'SAVE ADDRESS'}</button>
      </form>}
      <div className="accountAddressList">{addresses.map(a=><article key={a.id}>
        <div><div className="accountAddressTitle"><b>{a.label}</b>{a.is_default&&<span>DEFAULT</span>}</div><small>{a.full_name||displayName}</small><p>{a.address_line}</p><p>{[a.district,a.city,a.postal_code].filter(Boolean).join(' · ')}</p></div>
        <div className="accountAddressButtons"><button type="button" onClick={()=>useAddress(a)}>USE</button><button type="button" onClick={()=>editAddress(a)}>EDIT</button><button type="button" onClick={()=>deleteAddress(a.id)}>REMOVE</button></div>
      </article>)}</div>
    </section>
    <section className="accountSavedBag">
      <div className="accountSectionHead"><span>SAVED BAG</span><small>{savedCart.reduce((s,x)=>s+Number(x.qty||0),0)}</small></div>
      {savedCart.length===0?<p className="accountEmpty">Your bag is empty.</p>:<button type="button" className="accountSavedBagButton" onClick={()=>{setOpen(false);window.dispatchEvent(new Event('sideii-open-bag'))}}>
        <span>{savedCart.length} {savedCart.length===1?'ITEM':'ITEMS'} SAVED TO YOUR ACCOUNT</span><b>OPEN BAG →</b>
      </button>}
    </section>
    <section className="accountWishlist">
      <div className="accountSectionHead"><span>WISHLIST</span><small>{wishlist.length}</small></div>
      {wishlist.length===0?<p className="accountEmpty">No saved items yet.</p>:wishlist.map(item=><article key={item.product_slug}>
        <Link href={item.is_merch?('/store/'+item.product_slug):('/releases/'+item.product_slug)} onClick={()=>setOpen(false)}>
          {item.cover?<img src={item.cover} alt=""/>:<span className="accountWishlistPlaceholder">SIDE:II</span>}
          <div><b>{item.title}</b><small>{item.catalogue||'SIDE:II'}</small></div>
        </Link>
        <button type="button" onClick={()=>removeWishlistItem(item.product_slug)}>REMOVE</button>
      </article>)}
    </section>
    <section className="accountOrders"><div className="accountSectionHead"><span>ORDER HISTORY</span><small>{orders.length}</small></div>
     {orders.length===0?<p className="accountEmpty">No orders yet.</p>:orders.map(o=><button type="button" className="accountOrderRow" key={o.id} onClick={()=>toggleOrder(o)}><div><b>#SII-{String(o.order_no).padStart(4,'0')}</b><small>{new Date(o.created_at).toLocaleDateString('tr-TR')} · {String(o.status).toUpperCase()}</small></div><strong>{money(o.total)}</strong>{o.tracking_number&&<em>{o.shipping_carrier||'CARRIER'} · {o.tracking_number}</em>}<span>VIEW →</span></button>)}
    </section>
    {selectedOrder&&<section className={'accountOrderDetail '+(closingOrder?'closing':'')}>
      <div className="accountOrderDetailHead"><div><small>ORDER</small><h3>#SII-{String(selectedOrder.order_no).padStart(4,'0')}</h3></div><button type="button" onClick={closeOrderDetail}>CLOSE ×</button></div>
      <div className="accountOrderMeta">
       <div><span>STATUS</span><b>{String(selectedOrder.status||'').toUpperCase()}</b></div>
       <div><span>PAYMENT</span><b>{String(selectedOrder.payment_status||'').toUpperCase()}</b></div>
       <div><span>ORDERED</span><b>{new Date(selectedOrder.created_at).toLocaleString('tr-TR')}</b></div>
       <div><span>FULFILMENT</span><b>{String(selectedOrder.fulfillment_type||'—').toUpperCase()}</b></div>
      </div>
      <div className="accountOrderItems">{(selectedOrder.items||[]).map((it,i)=><article key={it.id||i}><div><b>{it.title}</b><small>{it.format||''}{it.sku?' · '+it.sku:''} · QTY {it.quantity}</small></div><strong>{money(it.line_total)}</strong></article>)}</div>
      <div className="accountOrderTotals">
       <div><span>SUBTOTAL</span><b>{money(selectedOrder.subtotal)}</b></div>
       {Number(selectedOrder.discount_total||0)>0&&<div><span>DISCOUNT{selectedOrder.promo_code?' · '+selectedOrder.promo_code:''}</span><b>−{money(selectedOrder.discount_total)}</b></div>}
       {Number(selectedOrder.campaign_discount_total||0)>0&&<div><span>CAMPAIGN{selectedOrder.campaign_name?' · '+selectedOrder.campaign_name:''}</span><b>−{money(selectedOrder.campaign_discount_total)}</b></div>}
       <div><span>SHIPPING</span><b>{Number(selectedOrder.shipping_total||0)>0?money(selectedOrder.shipping_total):'FREE'}</b></div>
       <div className="grand"><span>TOTAL</span><b>{money(selectedOrder.total)}</b></div>
      </div>
      {selectedOrder.shipping_address&&<div className="accountOrderAddress"><span>DELIVERY</span><b>{selectedOrder.shipping_name||displayName}</b><p>{selectedOrder.shipping_phone||''}</p><p>{selectedOrder.shipping_address.line1||''}</p><p>{[selectedOrder.shipping_address.district,selectedOrder.shipping_address.city,selectedOrder.shipping_address.postal_code].filter(Boolean).join(' · ')}</p></div>}
      {(selectedOrder.shipping_carrier||selectedOrder.tracking_number)&&<div className="accountOrderTracking"><span>TRACKING</span><b>{selectedOrder.shipping_carrier||'CARRIER'}</b><p>{selectedOrder.tracking_number||'Not assigned yet'}</p>{selectedOrder.shipped_at&&<small>SHIPPED · {new Date(selectedOrder.shipped_at).toLocaleString('tr-TR')}</small>}</div>}
      {selectedOrder.notes&&<div className="accountOrderNote"><span>ORDER NOTE</span><p>{selectedOrder.notes}</p></div>}
     </section>}
    <button className="accountSignout" onClick={signOut}>SIGN OUT</button>
   </div>}
  </aside>
  {open&&<button className="globalAccountShade" aria-label="Close account" onClick={()=>setOpen(false)}/>}
 </>;
}