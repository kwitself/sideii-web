'use client';
import Link from 'next/link';
import {useEffect,useMemo,useRef,useState} from 'react';
import {usePathname} from 'next/navigation';
import {supabase} from '../lib/supabase';
import GlobalAddressFields from './GlobalAddressFields';
import {readWishlist,writeWishlist} from '../lib/wishlist';
import {readCart} from '../lib/cart';
import {useLocaleCurrency} from './LocaleCurrencyProvider';
import PostPurchaseOffers from './PostPurchaseOffers';

export default function GlobalAccount(){
 const drawerRef=useRef(null);
 const {money,t}=useLocaleCurrency();
 const pathname=usePathname();
 const [open,setOpen]=useState(false),[session,setSession]=useState(null),[mode,setMode]=useState('signin');
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[orders,setOrders]=useState([]),[selectedOrder,setSelectedOrder]=useState(null),[closingOrder,setClosingOrder]=useState(false),[wishlist,setWishlist]=useState([]),[savedCart,setSavedCart]=useState([]),[addresses,setAddresses]=useState([]),[addressEditing,setAddressEditing]=useState(false),[addressBusy,setAddressBusy]=useState(false),[requestBusy,setRequestBusy]=useState(false),[requestReason,setRequestReason]=useState('');
 const [collection,setCollection]=useState([]),[passports,setPassports]=useState([]),[ownerContent,setOwnerContent]=useState([]),[collectorSummary,setCollectorSummary]=useState(null),[collectorLevel,setCollectorLevel]=useState(null),[collectorReward,setCollectorReward]=useState(null),[storeCredit,setStoreCredit]=useState(null),[storeCreditHistory,setStoreCreditHistory]=useState([]),[sharedLinks,setSharedLinks]=useState([]);
 const emptyAddress={id:null,label:'',full_name:'',phone:'',address_line:'',country_code:'TR',state_region:'',city:'',district:'',postal_code:'',is_default:false};
 const [addressForm,setAddressForm]=useState(emptyAddress);
 const [auth,setAuth]=useState({email:'',password:'',full_name:''});
 const [profile,setProfile]=useState({full_name:'',phone:'',address_line:'',country_code:'TR',state_region:'',city:'',district:'',postal_code:''});
 const signedIn=!!session?.user;
 const displayName=profile.full_name||session?.user?.email?.split('@')[0]||'ACCOUNT';
 const initials=useMemo(()=>displayName.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]?.toUpperCase()).join('')||'II',[displayName]);

 async function loadAccount(user){
  if(!supabase||!user)return;
  const [{data:p,error:profileError},{data:o},{data:w},{data:a},{data:col},{data:pass},{data:own},{data:summary},{data:credit},{data:creditHistory},{data:shares}]=await Promise.all([
   supabase.rpc('get_my_customer_account'),
   supabase.rpc('get_my_store_orders'),
   supabase.from('customer_wishlist').select('product_slug,title,catalogue,cover,is_merch').eq('user_id',user.id).order('created_at',{ascending:false}),
   supabase.from('customer_addresses').select('id,label,full_name,phone,address_line,country_code,state_region,city,district,postal_code,is_default').eq('user_id',user.id).order('is_default',{ascending:false}).order('created_at',{ascending:true}),
   supabase.rpc('get_my_collection'),
   supabase.rpc('get_my_edition_passports'),
   supabase.rpc('get_my_owner_content'),
   supabase.rpc('get_my_collector_summary'),
   supabase.rpc('get_my_store_credit'),
   supabase.rpc('get_my_store_credit_history'),
   supabase.rpc('get_my_shared_lists')
  ]);
  const row=Array.isArray(p)?p[0]:p;
  const next={full_name:row?.full_name||user.user_metadata?.full_name||'',phone:row?.phone||'',address_line:row?.address_line||'',country_code:row?.country_code||'TR',state_region:row?.state_region||'',city:row?.city||'',district:row?.district||'',postal_code:row?.postal_code||''};
  if(profileError) setMessage(profileError.message);
  const local=readWishlist();
  const merged=[...(w||[])];
  for(const item of local)if(!merged.some(x=>x.product_slug===item.product_slug))merged.push(item);
  setWishlist(merged);writeWishlist(merged);
  if(local.length) await supabase.from('customer_wishlist').upsert(local.map(x=>({...x,user_id:user.id})),{onConflict:'user_id,product_slug'});
  setProfile(next);setOrders(Array.isArray(o)?o:[]);setAddresses(Array.isArray(a)?a:[]);setCollection(Array.isArray(col)?col:[]);setPassports(Array.isArray(pass)?pass:[]);setOwnerContent(Array.isArray(own)?own:[]);setCollectorSummary(Array.isArray(summary)?summary[0]||null:summary||null);setStoreCredit(Array.isArray(credit)?credit[0]||null:credit||null);setStoreCreditHistory(Array.isArray(creditHistory)?creditHistory:[]);setSharedLinks(Array.isArray(shares)?shares:[]);
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
  if(!supabase||!session?.user)return;
  let live=true;
  supabase.rpc('get_my_collector_status').then(({data})=>{if(live)setCollectorLevel(Array.isArray(data)?data[0]||null:data||null)});
  return()=>{live=false};
 },[session?.user?.id]);

 async function claimCollectorReward(){
  if(!supabase||!session?.user)return;
  setBusy(true);setMessage('');
  const {data,error}=await supabase.rpc('claim_my_collector_reward');
  setBusy(false);
  if(error){setMessage(error.message);return}
  setCollectorReward(data||null);
  if(data?.code){try{await navigator.clipboard.writeText(data.code);setMessage('Collector reward code copied.')}catch{setMessage('Collector reward · '+data.code)}}
 }

 async function shareAccountList(kind,payload){
  if(!supabase||!session?.user)return;
  setMessage('');
  const {data,error}=await supabase.rpc('create_my_shared_list',{p_kind:kind,p_title:kind==='wishlist'?'SIDE:II Wishlist':'SIDE:II Saved Bag',p_payload:payload,p_expires_days:30});
  if(error){setMessage(error.message);return}
  const url=window.location.origin+'/lists/'+data.token;
  try{await navigator.clipboard.writeText(url);setMessage('Share link copied.')}catch{setMessage(url)}
  const {data:shares}=await supabase.rpc('get_my_shared_lists');setSharedLinks(Array.isArray(shares)?shares:[]);
 }
 async function copySharedLink(token){const url=window.location.origin+'/lists/'+token;try{await navigator.clipboard.writeText(url);setMessage('Share link copied.')}catch{setMessage(url)}}
 async function revokeSharedLink(token){if(!supabase||!session?.user)return;const {error}=await supabase.rpc('revoke_my_shared_list',{p_token:token});if(error){setMessage(error.message);return}setSharedLinks(x=>x.filter(v=>v.token!==token));setMessage('Share link revoked.');}

 useEffect(()=>{
  const openAccount=()=>{setMessage('');setOpen(true)};
  window.addEventListener('sideii-open-account',openAccount);
  return()=>window.removeEventListener('sideii-open-account',openAccount);
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
    if(event==='SIGNED_OUT'){setOrders([]);setCollection([]);setPassports([]);setOwnerContent([]);setCollectorSummary(null);setStoreCredit(null);setStoreCreditHistory([]);setSharedLinks([]);setProfile({full_name:'',phone:'',address_line:'',country_code:'TR',state_region:'',city:'',district:'',postal_code:''});window.dispatchEvent(new CustomEvent('sideii-account-profile',{detail:null}))}
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
   p_city:profile.city,p_district:profile.district,p_postal_code:profile.postal_code,
   p_country_code:profile.country_code||'TR',p_state_region:profile.state_region||''
  });
  setBusy(false);if(error)return setMessage(error.message);
  const saved=Array.isArray(data)?data[0]:data;
  const next={full_name:saved?.full_name||'',phone:saved?.phone||'',address_line:saved?.address_line||'',country_code:saved?.country_code||'TR',state_region:saved?.state_region||'',city:saved?.city||'',district:saved?.district||'',postal_code:saved?.postal_code||''};
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
  if(!addressForm.address_line.trim()||!addressForm.city||(addressForm.country_code==='TR'&&!addressForm.district)){setMessage(addressForm.country_code==='TR'?'Complete the address, city and district.':'Complete the address and city.');return}
  setAddressBusy(true);setMessage('');
  const {data,error}=await supabase.rpc('save_my_customer_address',{
   p_id:addressForm.id||null,
   p_label:addressForm.label||'ADDRESS',
   p_full_name:addressForm.full_name||profile.full_name||'',
   p_phone:addressForm.phone||profile.phone||'',
   p_address_line:addressForm.address_line,
   p_city:addressForm.city,
   p_district:addressForm.district,
   p_postal_code:addressForm.postal_code||'',
   p_is_default:!!addressForm.is_default,
   p_country_code:addressForm.country_code||'TR',
   p_state_region:addressForm.state_region||''
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
  setRequestReason('');
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   drawerRef.current?.querySelector('.accountOrderDetail')?.scrollIntoView({behavior:'smooth',block:'start'});
  }));
 }
 async function requestOrderAction(type){
  if(!selectedOrder||requestBusy)return;
  setRequestBusy(true);setMessage('');
  const {error}=await supabase.rpc('request_order_action',{p_order_id:selectedOrder.id,p_type:type,p_reason:requestReason||null});
  setRequestBusy(false);
  if(error){setMessage(error.message);return}
  setMessage(type==='cancel'?'Cancellation request sent.':type==='refund'?'Refund request sent.':'Return request sent.');
  setRequestReason('');
  if(session?.user)await loadAccount(session.user);
 }

 async function downloadDigitalItem(item){
  if(!item?.id||!item.download_available||!session?.user)return;
  setMessage('');
  const {data,error}=await supabase.rpc('create_my_digital_download_grant',{p_order_item_id:item.id});
  if(error||!data){setMessage(error?.message||'Digital download unavailable.');return}
  window.open('/api/download/'+encodeURIComponent(String(data)),'_blank','noopener,noreferrer');
 }

 useEffect(()=>{if(!open)return;
  const previousOverflow=document.body.style.overflow;
  const previousFocus=document.activeElement;
  document.body.style.overflow='hidden';
  const node=drawerRef.current;
  const focusables=()=>node?[...node.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]:[];
  requestAnimationFrame(()=>focusables()[0]?.focus());
  const onKey=e=>{
   if(e.key==='Escape'){if(selectedOrder){closeOrderDetail()}else setOpen(false);return}
   if(e.key!=='Tab')return;
   const items=focusables();if(!items.length)return;
   const first=items[0],last=items[items.length-1];
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  };
  window.addEventListener('keydown',onKey);
  return()=>{document.body.style.overflow=previousOverflow;window.removeEventListener('keydown',onKey);requestAnimationFrame(()=>previousFocus?.focus?.())}
 },[open,selectedOrder,closingOrder]);
 if(pathname?.startsWith('/admin'))return null;
 return <>
  {!open&&<button className="globalAccountTrigger" aria-haspopup="dialog" aria-expanded={open} aria-label={t('ACCOUNT')} onClick={()=>{setMessage('');setOpen(true)}}>{signedIn?initials:'ACCOUNT'}</button>}
  <aside ref={drawerRef} className={'globalAccountDrawer '+(open?'open':'')} role="dialog" aria-modal="true" aria-label={t('ACCOUNT')} aria-hidden={!open}>
   <button className="globalAccountClose" onClick={()=>setOpen(false)}>{t('CLOSE')} ×</button><span>{t('ACCOUNT')}</span>
   {!signedIn?<div className="accountAuth">
    <div className="accountTabs"><button className={mode==='signin'?'active':''} onClick={()=>setMode('signin')}>{t('SIGN IN')}</button><button className={mode==='signup'?'active':''} onClick={()=>setMode('signup')}>{t('CREATE ACCOUNT')}</button></div>
    <h3>{mode==='signup'?'Join SIDE:II.':'Welcome back.'}</h3>
    <form onSubmit={submitAuth}>
     {mode==='signup'&&<label>{t('FULL NAME')}<input required value={auth.full_name} onChange={e=>setAuth({...auth,full_name:e.target.value})}/></label>}
     <label>{t('EMAIL')}<input type="email" required value={auth.email} onChange={e=>setAuth({...auth,email:e.target.value})}/></label>
     <label>{t('PASSWORD')}<input type="password" minLength="6" required value={auth.password} onChange={e=>setAuth({...auth,password:e.target.value})}/></label>
     {message&&<p className="accountMessage">{message}</p>}
     <button className="accountPrimary" disabled={busy}>{busy?'PLEASE WAIT…':mode==='signup'?'CREATE ACCOUNT':'SIGN IN'}</button>
     {mode==='signin'&&<button type="button" className="accountTextButton" onClick={resetPassword}>{t('FORGOT PASSWORD?')}</button>}
    </form>
   </div>:<div className="accountBody">
    <header className="accountIdentity"><b>{displayName}</b><small>{session.user.email}</small></header>
    <form className="accountProfile" onSubmit={saveProfile}>
     <label>{t('FULL NAME')}<input value={profile.full_name} onChange={e=>setProfile({...profile,full_name:e.target.value})}/></label>
     <label>PHONE<input value={profile.phone} onChange={e=>setProfile({...profile,phone:e.target.value})}/></label>
     <label>ADDRESS<textarea value={profile.address_line} onChange={e=>setProfile({...profile,address_line:e.target.value})}/></label>
     <GlobalAddressFields form={{...profile,country:profile.country_code}} setForm={next=>setProfile({...next,country_code:next.country||next.country_code||'TR'})}/>
     <label>POSTAL CODE<input value={profile.postal_code} onChange={e=>setProfile({...profile,postal_code:e.target.value})}/></label>
     {message&&<p className="accountMessage">{message}</p>}
     <button className="accountPrimary" disabled={busy}>{busy?'SAVING…':'SAVE DETAILS'}</button>
    </form>
    <section className="accountAddressBook">
      <div className="accountSectionHead"><span>{t('ADDRESS BOOK')}</span><small>{addresses.length}</small></div>
      <div className="accountAddressActions"><button type="button" onClick={()=>{setAddressForm({...emptyAddress,full_name:profile.full_name,phone:profile.phone});setAddressEditing(v=>!v)}}>{addressEditing?'CANCEL':'＋ ADD ADDRESS'}</button></div>
      {addressEditing&&<form className="accountAddressForm" onSubmit={saveAddress}>
        <label>ADDRESS NAME<input required maxLength="40" placeholder="e.g. HOME, STUDIO, MOM'S HOUSE" value={addressForm.label} onChange={e=>setAddressForm({...addressForm,label:e.target.value})}/></label>
        <label>{t('FULL NAME')}<input value={addressForm.full_name} onChange={e=>setAddressForm({...addressForm,full_name:e.target.value})}/></label>
        <label>PHONE<input value={addressForm.phone} onChange={e=>setAddressForm({...addressForm,phone:e.target.value})}/></label>
        <label>ADDRESS<textarea required value={addressForm.address_line} onChange={e=>setAddressForm({...addressForm,address_line:e.target.value})}/></label>
        <GlobalAddressFields form={{...addressForm,country:addressForm.country_code}} setForm={next=>setAddressForm({...next,country_code:next.country||next.country_code||'TR'})}/>
        <label>POSTAL CODE<input value={addressForm.postal_code} onChange={e=>setAddressForm({...addressForm,postal_code:e.target.value})}/></label>
        <label className="accountDefaultAddress"><input type="checkbox" checked={!!addressForm.is_default} onChange={e=>setAddressForm({...addressForm,is_default:e.target.checked})}/><span>USE AS DEFAULT ADDRESS</span></label>
        <button className="accountPrimary" disabled={addressBusy}>{addressBusy?'SAVING…':'SAVE ADDRESS'}</button>
      </form>}
      <div className="accountAddressList">{addresses.map(a=><article key={a.id}>
        <div><div className="accountAddressTitle"><b>{a.label}</b>{a.is_default&&<span>DEFAULT</span>}</div><small>{a.full_name||displayName}</small><p>{a.address_line}</p><p>{[a.district||a.state_region,a.city,a.postal_code,a.country_code&&a.country_code!=='TR'?a.country_code:null].filter(Boolean).join(' · ')}</p></div>
        <div className="accountAddressButtons"><button type="button" onClick={()=>useAddress(a)}>USE</button><button type="button" onClick={()=>editAddress(a)}>EDIT</button><button type="button" onClick={()=>deleteAddress(a.id)}>REMOVE</button></div>
      </article>)}</div>
    </section>
    <section className="accountSavedBag">
      <div className="accountSectionHead"><span>SAVED BAG</span><div><small>{savedCart.reduce((s,x)=>s+Number(x.qty||0),0)}</small>{savedCart.length>0&&<button type="button" className="accountShareMini" onClick={()=>shareAccountList('cart',savedCart)}>SHARE ↗</button>}</div></div>
      {savedCart.length===0?<p className="accountEmpty">Your bag is empty.</p>:<button type="button" className="accountSavedBagButton" onClick={()=>{setOpen(false);window.dispatchEvent(new Event('sideii-open-bag'))}}>
        <span>{savedCart.length} {savedCart.length===1?'ITEM':'ITEMS'} SAVED TO YOUR ACCOUNT</span><b>OPEN BAG →</b>
      </button>}
    </section>
    <section className="accountWishlist">
      <div className="accountSectionHead"><span>WISHLIST</span><div><small>{wishlist.length}</small>{wishlist.length>0&&<button type="button" className="accountShareMini" onClick={()=>shareAccountList('wishlist',wishlist)}>SHARE ↗</button>}</div></div>
      {wishlist.length===0?<p className="accountEmpty">No saved items yet.</p>:wishlist.map(item=><article key={item.product_slug}>
        <Link href={item.is_merch?('/store/'+item.product_slug):('/releases/'+item.product_slug)} onClick={()=>setOpen(false)}>
          {item.cover?<img src={item.cover} alt=""/>:<span className="accountWishlistPlaceholder">SIDE:II</span>}
          <div><b>{item.title}</b><small>{item.catalogue||'SIDE:II'}</small></div>
        </Link>
        <button type="button" onClick={()=>removeWishlistItem(item.product_slug)}>REMOVE</button>
      </article>)}
    </section>
    <section className="accountSharedLinks">
      <div className="accountSectionHead"><span>SHARED LINKS</span><small>{sharedLinks.length}</small></div>
      {sharedLinks.length===0?<p className="accountEmpty">No active shared links.</p>:<div className="accountSharedLinkList">{sharedLinks.map(x=><article key={x.token}>
        <div><b>{x.title||'SIDE:II Shared List'}</b><small>{String(x.kind||'list').toUpperCase()} · {x.item_count||0} ITEM{Number(x.item_count||0)===1?'':'S'} · EXPIRES {x.expires_at?new Date(x.expires_at).toLocaleDateString('tr-TR'):'—'}</small></div>
        <div><button type="button" onClick={()=>copySharedLink(x.token)}>COPY</button><button type="button" onClick={()=>revokeSharedLink(x.token)}>REVOKE</button></div>
      </article>)}</div>}
    </section>
    <section className="accountCollectorSummary">
      <div className="accountSectionHead"><span>{t('COLLECTOR PROFILE')}</span><small>{collectorSummary?collectorSummary.completion_percent+'%':'—'}</small></div>
      <div className="collectorSummaryGrid">
        <div><span>{t('CATALOGUE OWNED')}</span><b>{collectorSummary?.owned_products||0} / {collectorSummary?.public_catalogue_products||0}</b></div>
        <div><span>{t('OWNED UNITS')}</span><b>{collectorSummary?.owned_units||0}</b></div>
        <div><span>{t('PASSPORTS')}</span><b>{collectorSummary?.active_passports||0}</b></div>
        <div><span>{t('OWNER CONTENT')}</span><b>{collectorSummary?.owner_content_items||0}</b></div>
        <div><span>{t('VERIFIED IMPACT')}</span><b>{money(collectorSummary?.verified_impact_total||0)}</b></div>
        <div><span>{t('STORE CREDIT')}</span><b>{money(storeCredit?.balance||0)}</b></div>{collectorLevel&&<div className="collectorTierCard"><span>COLLECTOR LEVEL</span><b>{collectorLevel.label||collectorLevel.tier}</b><small>{collectorLevel.early_access_hours||0}H EARLY · {collectorLevel.reward_pct||0}% REWARD</small>{Number(collectorLevel.reward_pct||0)>0&&<button type="button" className="collectorRewardButton" disabled={busy} onClick={claimCollectorReward}>{collectorReward?.code?collectorReward.code:'CLAIM MONTHLY REWARD →'}</button>}</div>}
      </div>
      <div className="collectorCompletion"><i><b style={{width:Math.max(0,Math.min(100,Number(collectorSummary?.completion_percent||0)))+'%'}}/></i><small>{t('CATALOGUE COMPLETION')}</small></div>
    </section>
    <section className="accountStoreCredit">
      <div className="accountSectionHead"><span>{t('STORE CREDIT')}</span><small>{money(storeCredit?.balance||0)}</small></div>
      {storeCreditHistory.length===0?<p className="accountEmpty">No store credit activity yet.</p>:<div className="accountStoreCreditList">{storeCreditHistory.slice(0,8).map(x=><article key={x.id}><div><b>{String(x.entry_type||'').toUpperCase()}</b><small>{new Date(x.created_at).toLocaleDateString('tr-TR')}{x.note?' · '+x.note:''}</small></div><strong className={Number(x.amount)>=0?'positive':'negative'}>{Number(x.amount)>=0?'+':''}{money(x.amount)}</strong></article>)}</div>}
    </section>
    <section className="accountCollection">
      <div className="accountSectionHead"><span>{t('MY COLLECTION')}</span><small>{collection.reduce((s,x)=>s+Number(x.total_quantity||0),0)}</small></div>
      {collection.length===0?<p className="accountEmpty">Paid physical and digital editions will appear here.</p>:collection.map(item=><article key={item.product_id+':'+item.format}>
        <div><b>{item.product_title}</b><small>{item.catalogue_no} · {String(item.format||'').toUpperCase()} · QTY {item.total_quantity}</small>{item.passport_count>0&&<em>{item.passport_count} EDITION PASSPORT{item.passport_count===1?'':'S'}</em>}</div>
        <Link href={item.product_type==='merch'?('/store/'+item.product_slug):('/releases/'+item.product_slug)} onClick={()=>setOpen(false)}>OPEN →</Link>
      </article>)}
      {passports.length>0&&<div className="accountPassportList"><span>EDITION PASSPORTS</span>{passports.map(p=><Link key={p.id} href={'/passport/'+p.public_token} onClick={()=>setOpen(false)}><div><b>{p.catalogue_no} · #{String(p.edition_number).padStart(3,'0')}</b><small>{p.product_title} · {String(p.format).toUpperCase()}</small></div><span>VERIFY ↗</span></Link>)}</div>}
    </section>
    <section className="accountOwnerContent">
      <div className="accountSectionHead"><span>{t('OWNER CONTENT')}</span><small>{ownerContent.length}</small></div>
      {ownerContent.length===0?<p className="accountEmpty">Exclusive release content will appear here when available.</p>:ownerContent.map(x=><article key={x.id}><div><b>{x.title}</b><small>{x.catalogue_no} · {String(x.content_type).toUpperCase()}</small>{x.note&&<p>{x.note}</p>}</div>{x.content_url&&<a href={x.content_url} target="_blank" rel="noreferrer">OPEN ↗</a>}</article>)}
    </section>
    <section className="accountOrders"><div className="accountSectionHead"><span>{t('ORDER HISTORY')}</span><small>{orders.length}</small></div>
     {orders.length===0?<p className="accountEmpty">No orders yet.</p>:orders.map(o=><button type="button" className={'accountOrderRow '+(selectedOrder?.id===o.id?'selected':'')} key={o.id} onClick={()=>toggleOrder(o)}><div><b>#SII-{String(o.order_no).padStart(4,'0')}</b><small>{new Date(o.created_at).toLocaleDateString('tr-TR')} · {String(o.status).toUpperCase()}</small></div><strong>{money(o.total)}</strong>{o.tracking_number&&<em>{o.shipping_carrier||'CARRIER'} · {o.tracking_number}</em>}<span>VIEW →</span></button>)}
    </section>
    {selectedOrder&&<section className={'accountOrderDetail '+(closingOrder?'closing':'')}>
      <div className="accountOrderDetailHead"><div><small>ORDER</small><h3>#SII-{String(selectedOrder.order_no).padStart(4,'0')}</h3></div><button type="button" onClick={closeOrderDetail}>{t('CLOSE')} ×</button></div>
      <div className="accountOrderMeta">
       <div><span>STATUS</span><b>{String(selectedOrder.status||'').toUpperCase()}</b></div>
       <div><span>PAYMENT</span><b>{String(selectedOrder.payment_status||'').toUpperCase()}</b></div>
       <div><span>ORDERED</span><b>{new Date(selectedOrder.created_at).toLocaleString('tr-TR')}</b></div>
       <div><span>FULFILMENT</span><b>{String(selectedOrder.fulfillment_type||'—').toUpperCase()}</b></div>
      </div>
      <div className="accountOrderItems">{(selectedOrder.items||[]).map((it,i)=><article key={it.id||i}><div><b>{it.title}</b><small>{it.format||''}{it.sku?' · '+it.sku:''} · QTY {it.quantity}{it.preorder?' · PRE-ORDER':''}</small>{Array.isArray(it.edition_numbers)&&it.edition_numbers.length>0&&<small>EDITION · {it.edition_numbers.map(n=>'#'+String(n).padStart(3,'0')).join(' / ')}</small>}{it.download_available&&<button type="button" className="accountDownloadLink" onClick={()=>downloadDigitalItem(it)}>DOWNLOAD DIGITAL EDITION ↗</button>}</div><strong>{money(it.line_total)}</strong></article>)}</div>
      <div className="accountOrderTotals">
       <div><span>SUBTOTAL</span><b>{money(selectedOrder.subtotal)}</b></div>
       {Number(selectedOrder.discount_total||0)>0&&<div><span>DISCOUNT{selectedOrder.promo_code?' · '+selectedOrder.promo_code:''}</span><b>−{money(selectedOrder.discount_total)}</b></div>}
       {Number(selectedOrder.campaign_discount_total||0)>0&&<div><span>CAMPAIGN{selectedOrder.campaign_name?' · '+selectedOrder.campaign_name:''}</span><b>−{money(selectedOrder.campaign_discount_total)}</b></div>}
       {Number(selectedOrder.gift_card_amount||0)>0&&<div><span>GIFT CARD</span><b>−{money(selectedOrder.gift_card_amount)}</b></div>}
       {Number(selectedOrder.store_credit_amount||0)>0&&<div><span>STORE CREDIT</span><b>−{money(selectedOrder.store_credit_amount)}</b></div>}
       {Number(selectedOrder.store_value_total||0)>0&&<div className="storeValueHistory"><span>STORE VALUE · {String(selectedOrder.store_value_status||'').toUpperCase()}</span><b>−{money(selectedOrder.store_value_total)}</b></div>}
       <div><span>SHIPPING</span><b>{Number(selectedOrder.shipping_total||0)>0?money(selectedOrder.shipping_total):'FREE'}</b></div>
       <div className="grand"><span>TOTAL</span><b>{money(selectedOrder.total)}</b></div>
      </div>
      {selectedOrder.shipping_address&&<div className="accountOrderAddress"><span>DELIVERY</span><b>{selectedOrder.shipping_name||displayName}</b><p>{selectedOrder.shipping_phone||''}</p><p>{selectedOrder.shipping_address.line1||''}</p><p>{[selectedOrder.shipping_address.district,selectedOrder.shipping_address.city,selectedOrder.shipping_address.postal_code].filter(Boolean).join(' · ')}</p></div>}
      {selectedOrder.invoice_type&&<div className="accountOrderInvoice"><span>INVOICE</span><b>{selectedOrder.invoice_type==='company'?(selectedOrder.invoice_company||'COMPANY'):'INDIVIDUAL'}</b>{selectedOrder.invoice_type==='company'&&<><p>{selectedOrder.invoice_tax_office||''}</p><p>{selectedOrder.invoice_tax_number||''}</p></>}</div>}
      {(selectedOrder.shipping_carrier||selectedOrder.tracking_number)&&<div className="accountOrderTracking"><span>TRACKING</span><b>{selectedOrder.shipping_carrier||'CARRIER'}</b><p>{selectedOrder.tracking_number||'Not assigned yet'}</p>{selectedOrder.shipped_at&&<small>SHIPPED · {new Date(selectedOrder.shipped_at).toLocaleString('tr-TR')}</small>}</div>}
      {selectedOrder.is_gift&&<div className="accountOrderGift"><span>GIFT ORDER</span><b>{selectedOrder.hide_prices?'PRICES HIDDEN IN PACKING':'STANDARD PACKING'}</b>{selectedOrder.gift_message&&<p>{selectedOrder.gift_message}</p>}{selectedOrder.gift_recipient_email&&<small>RECIPIENT · {selectedOrder.gift_recipient_email}</small>}{selectedOrder.gift_delivery_at&&<small>DELIVER AFTER · {new Date(selectedOrder.gift_delivery_at).toLocaleString('tr-TR')}</small>}{selectedOrder.gift_wrap&&<small>GIFT WRAP · YES</small>}</div>}{selectedOrder.notes&&<div className="accountOrderNote"><span>ORDER NOTE</span><p>{selectedOrder.notes}</p></div>}
      <PostPurchaseOffers orderId={selectedOrder.id} paymentStatus={selectedOrder.payment_status}/>
      <div className="accountOrderRequest">
       <span>ORDER REQUESTS</span>
       {(selectedOrder.return_requests||[]).length>0&&<div className="accountOrderRequestHistory">{selectedOrder.return_requests.map(r=><p key={r.id}>{String(r.request_type).toUpperCase()} · {String(r.status).toUpperCase()} · {new Date(r.created_at).toLocaleDateString('tr-TR')}</p>)}</div>}
       {['pending','preparing','shipped','completed'].includes(selectedOrder.status)&&<><textarea maxLength="1000" placeholder="Optional reason / note" value={requestReason} onChange={e=>setRequestReason(e.target.value)}/><div>{selectedOrder.payment_status==='unpaid'&&['pending','preparing'].includes(selectedOrder.status)&&<button type="button" disabled={requestBusy} onClick={()=>requestOrderAction('cancel')}>REQUEST CANCELLATION</button>}{selectedOrder.payment_status==='paid'&&['pending','preparing'].includes(selectedOrder.status)&&<button type="button" disabled={requestBusy} onClick={()=>requestOrderAction('refund')}>REQUEST REFUND</button>}{selectedOrder.payment_status==='paid'&&['shipped','completed'].includes(selectedOrder.status)&&<button type="button" disabled={requestBusy} onClick={()=>requestOrderAction('return')}>REQUEST RETURN</button>}</div></>}
      </div>
     </section>}
    <button className="accountSignout" onClick={signOut}>{t('SIGN OUT')}</button>
   </div>}
  </aside>
  {open&&<button className="globalAccountShade" aria-label="Close account" onClick={()=>setOpen(false)}/>}
 </>;
}