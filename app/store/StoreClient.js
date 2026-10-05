'use client';
import Link from 'next/link';
import {useEffect,useMemo,useState} from 'react';
import {supabase} from '../lib/supabase';
import {addCartItem,readCart,writeCart} from '../lib/cart';
import TurkeyAddressFields from '../components/TurkeyAddressFields';
import {readWishlist,writeWishlist,wishlistItemFromProduct} from '../lib/wishlist';
import {useLocaleCurrency} from '../components/LocaleCurrencyProvider';
const friendlyStoreError=message=>{
 const m=String(message||'').trim();
 if(!m)return 'Something changed in your bag. Please review it and try again.';
 if(/out of stock/i.test(m))return 'This item is currently sold out.';
 if(/insufficient stock/i.test(m)){
  const match=m.match(/available:\\s*(\\d+)/i); const left=match?match[1]:null;
  return left?('Only '+left+' left in stock. Your bag has been adjusted.'):'There is not enough stock for this item.';
 }
 if(/edition unavailable/i.test(m))return 'This edition is no longer available.';
 if(/promo usage limit reached/i.test(m))return 'This code has reached its usage limit.';
 if(/promo code expired/i.test(m))return 'This code has expired.';
 if(/promo code inactive/i.test(m))return 'This code is currently inactive.';
 if(/promo code not started/i.test(m))return 'This code is not active yet.';
 if(/promo code not found/i.test(m))return 'This code is not valid.';
 if(/promo code invalid/i.test(m))return 'This code is not valid or has expired.';
 if(/promo code no longer available/i.test(m))return 'This code is no longer available.';
 if(/promo minimum not met/i.test(m)){const amount=m.match(/:\s*([0-9.]+)/)?.[1];return amount?('This code requires a minimum basket of ₺'+Number(amount).toLocaleString('tr-TR')+'.'):'Your basket does not meet the minimum for this code.';}
 if(/cart is empty/i.test(m))return 'Your bag is empty.';
 if(/shipping details are required/i.test(m))return 'Please complete your delivery details.';
 if(/store connection unavailable/i.test(m))return 'The store could not be reached. Please try again.';
 return 'Something changed in your bag. Please review it and try again.';
};
function CartMerchThumb({item}){const mockup=item.mockup;if(!mockup)return item.cover?<img src={item.cover} alt=""/>:null;const fill=mockup.garmentColor||'#171719';const front=(mockup.side||'front')!=='back';return <div className="cartMerchThumb"><svg viewBox="0 0 420 500" aria-hidden="true"><path fill={fill} d="M82 82 L158 48 Q210 68 262 48 L338 82 L392 151 L350 194 L316 171 L316 438 Q210 447 104 438 L104 171 L70 194 L28 151 Z"/><path className="storeMerchLine" d="M82 82 L158 48 Q210 68 262 48 L338 82 L392 151 L350 194 L316 171 L316 438 Q210 447 104 438 L104 171 L70 194 L28 151 Z"/><path className="storeMerchLine storeMerchSeam" d="M104 171 L82 82 M316 171 L338 82 M104 426 Q210 436 316 426 M31 154 L72 190 M389 154 L348 190"/>{front?<><path className="storeMerchLine storeMerchNeck" d="M167 48 Q172 98 210 100 Q248 98 253 48"/><path className="storeMerchLine storeMerchSeam" d="M174 55 Q179 88 210 89 Q241 88 246 55"/></>:<><path className="storeMerchLine storeMerchNeck" d="M167 48 Q185 70 210 71 Q235 70 253 48"/><path className="storeMerchLine storeMerchSeam" d="M174 53 Q190 64 210 65 Q230 64 246 53"/></>}</svg><div className="cartMerchPrint">{mockup.designUrl&&<img src={mockup.designUrl} alt="" style={{left:(mockup.x??50)+'%',top:(mockup.y??50)+'%',width:(mockup.scale??36)+'%',transform:`translate(-50%,-50%) rotate(${mockup.rotation??0}deg)`}}/>}</div></div>}
function MerchPreview({product}){
 const mockup=product.mockups?.front||product.mockups?.back;
 const fill=mockup?.garmentColor||'#171719';
 const front=(mockup?.side||'front')!=='back';
 return <div className="storeMerchPreview">
  <div className="storeMerchTee">
   <svg viewBox="0 0 420 500" aria-hidden="true">
    <path fill={fill} d="M82 82 L158 48 Q210 68 262 48 L338 82 L392 151 L350 194 L316 171 L316 438 Q210 447 104 438 L104 171 L70 194 L28 151 Z"/>
    <path className="storeMerchLine" d="M82 82 L158 48 Q210 68 262 48 L338 82 L392 151 L350 194 L316 171 L316 438 Q210 447 104 438 L104 171 L70 194 L28 151 Z"/>
    <path className="storeMerchLine storeMerchSeam" d="M104 171 L82 82 M316 171 L338 82 M104 426 Q210 436 316 426 M31 154 L72 190 M389 154 L348 190"/>{front?<><path className="storeMerchLine storeMerchNeck" d="M167 48 Q172 98 210 100 Q248 98 253 48"/><path className="storeMerchLine storeMerchSeam" d="M174 55 Q179 88 210 89 Q241 88 246 55"/></>:<><path className="storeMerchLine storeMerchNeck" d="M167 48 Q185 70 210 71 Q235 70 253 48"/><path className="storeMerchLine storeMerchSeam" d="M174 53 Q190 64 210 65 Q230 64 246 53"/></>}
   </svg>
   <div className="storeMerchPrint">{mockup?.designUrl&&<img src={mockup.designUrl} alt="" style={{left:(mockup.x??50)+'%',top:(mockup.y??50)+'%',width:(mockup.scale??36)+'%',transform:`translate(-50%,-50%) rotate(${mockup.rotation??0}deg)`}}/>}</div>
  </div>
  <span>{front?'FRONT':'BACK'} / {String(product.merchCategory||'MERCH').toUpperCase()}</span>
 </div>
}

export default function StoreClient({releases}){
 const {money:fmt,t}=useLocaleCurrency();
 const [filter,setFilter]=useState('all'),[formatFilter,setFormatFilter]=useState('all');
 const [cart,setCart]=useState([]),[open,setOpen]=useState(false),[checkout,setCheckout]=useState(false),[busy,setBusy]=useState(false),[done,setDone]=useState(null),[error,setError]=useState(''),[quote,setQuote]=useState(null);
 const [wishlist,setWishlist]=useState([]),[wishlistUser,setWishlistUser]=useState(null);
 const [waitlistVariant,setWaitlistVariant]=useState(null),[waitlistEmail,setWaitlistEmail]=useState(''),[waitlistMessage,setWaitlistMessage]=useState(''),[waitlistBusy,setWaitlistBusy]=useState(false);
 useEffect(()=>{const q=new URLSearchParams(window.location.search);const imprint=q.get('imprint');if(['sideii','lethargia','selected'].includes(imprint))setFilter(imprint);const media=q.get('media');if(['merch','vinyl','cd','cassette','digital'].includes(media))setFormatFilter(media);const raw=readCart();const hydrated=raw.map(item=>{const product=releases.find(r=>r.variants?.some(v=>(v.id||v.sku)===item.key));if(!product)return item;const variant=product.variants.find(v=>(v.id||v.sku)===item.key)||{};return {...item,title:product.title,catalogue:product.catalogue,cover:product.cover,format:variant.formatLabel||item.format,price:Number(variant.price??item.price??0),stock:variant.format==='digital'?null:Number(variant.stock??item.stock??0),isMerch:!!product.isMerch,merchCategory:product.merchCategory||item.merchCategory||null,size:variant.size||item.size||null,color:variant.color||item.color||null,style:variant.style||item.style||null,mockup:product.isMerch?(product.mockups?.front||product.mockups?.back||item.mockup||null):null};});setCart(hydrated);if(JSON.stringify(hydrated)!==JSON.stringify(raw))writeCart(hydrated);if(q.get('checkout')==='1'){window.dispatchEvent(new Event('sideii-open-bag'));window.history.replaceState({},'',window.location.pathname)}},[releases]);
 useEffect(()=>{const fn=e=>setCart(e.detail||readCart());window.addEventListener('sideii-cart',fn);return()=>window.removeEventListener('sideii-cart',fn)},[]);
 useEffect(()=>{
  let live=true;
  const load=async()=>{
   const local=readWishlist();
   setWishlist(local);
   if(!supabase)return;
   const {data:s}=await supabase.auth.getSession();
   if(!live)return;
   const user=s.session?.user||null;setWishlistUser(user);
   if(!user)return;
   const {data:remote}=await supabase.from('customer_wishlist').select('product_slug,title,catalogue,cover,is_merch').eq('user_id',user.id);
   if(!live)return;
   const merged=[...(remote||[])];
   for(const item of local)if(!merged.some(x=>x.product_slug===item.product_slug))merged.push(item);
   setWishlist(merged);writeWishlist(merged);
   if(local.length){
    await supabase.from('customer_wishlist').upsert(local.map(x=>({...x,user_id:user.id})),{onConflict:'user_id,product_slug'});
   }
  };
  load();
  const {data:sub}=supabase?.auth.onAuthStateChange((_e,s)=>{const u=s?.user||null;setWishlistUser(u);if(u)load()})||{data:{subscription:{unsubscribe(){}}}};
  const sync=e=>setWishlist(e.detail||readWishlist());window.addEventListener('sideii-wishlist',sync);
  return()=>{live=false;sub.subscription.unsubscribe();window.removeEventListener('sideii-wishlist',sync)};
 },[]);
 async function toggleWishlist(product){
  const item=wishlistItemFromProduct(product);
  const exists=wishlist.some(x=>x.product_slug===item.product_slug);
  const next=exists?wishlist.filter(x=>x.product_slug!==item.product_slug):[...wishlist,item];
  setWishlist(next);writeWishlist(next);
  if(supabase&&wishlistUser){
   if(exists) await supabase.from('customer_wishlist').delete().eq('user_id',wishlistUser.id).eq('product_slug',item.product_slug);
   else await supabase.from('customer_wishlist').upsert({...item,user_id:wishlistUser.id},{onConflict:'user_id,product_slug'});
  }
 }
 async function joinWaitlist(v){
  const email=waitlistEmail.trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){setWaitlistMessage('Enter a valid email.');return}
  setWaitlistBusy(true);setWaitlistMessage('');
  const {error}=await supabase.rpc('join_stock_waitlist',{p_variant_id:v.id,p_email:email});
  setWaitlistBusy(false);
  if(error){setWaitlistMessage(error.message);return}
  setWaitlistMessage('You are on the restock list.');
 }
 const updateCart=next=>{setQuote(null);setQuoteError('');setCart(next);writeCart(next)};
 const [form,setForm]=useState({name:'',email:'',phone:'',address:'',city:'',district:'',postal:'',notes:''});
 const [quoteError,setQuoteError]=useState('');
 const [promoInput,setPromoInput]=useState('');
 const [promoCode,setPromoCode]=useState('');
 const [promoBusy,setPromoBusy]=useState(false);
 const uniqueReleases=useMemo(()=>Array.from(new Map((releases||[]).map(r=>[r.slug||r.id||r.catalogue,r])).values()),[releases]);
 const filtered=uniqueReleases.filter(r=>(filter==='all'||(filter==='selected'?r.productOrigin==='distributed':r.imprint===filter))&&(formatFilter==='all'||(formatFilter==='merch'?r.isMerch:r.variants.some(v=>v.format===formatFilter))));
 const physical=cart.some(x=>!x.digital),digital=cart.some(x=>x.digital),localSubtotal=useMemo(()=>cart.reduce((s,x)=>s+x.price*x.qty,0),[cart]),subtotal=quote?Number(quote.subtotal):localSubtotal,discount=quote?Number(quote.discount_total||0):0,shipping=quote?Number(quote.shipping_total):0,total=quote?Number(quote.total):subtotal-discount+shipping,orderType=physical&&digital?'MIXED ORDER':physical?'PHYSICAL ORDER':'DIGITAL ORDER';
 const add=(r,v)=>{setDone(null);setQuote(null);setQuoteError('');setCart(addCartItem(r,v));window.dispatchEvent(new Event('sideii-open-bag'))};
 async function refreshLiveQuoteNow(code=promoCode){
  if(!supabase||cart.length===0){setQuote(null);setQuoteError('');return cart.length===0}
  setQuote(null);setQuoteError('');
  const items=cart.map(x=>({variant_id:x.variantId,quantity:x.qty}));
  const {data,error}=await supabase.rpc('quote_store_order_v2',{p_items:items,p_promo_code:code||null});
  if(error){setQuoteError(friendlyStoreError(error.message));return false}
  setQuote(data);
  if(data?.promo_code)setPromoCode(data.promo_code);
  if(Array.isArray(data?.items)){
   let changed=false;
   const synced=cart.map(x=>{
    const liveItem=data.items.find(i=>String(i.variant_id)===String(x.variantId));
    if(!liveItem)return x;
    const nextPrice=Number(liveItem.price??x.price);
    const nextStock=liveItem.available==null?null:Number(liveItem.available);
    const nextQty=nextStock==null?x.qty:Math.min(x.qty,Math.max(1,nextStock));
    if(nextPrice!==Number(x.price)||nextStock!==x.stock||nextQty!==x.qty)changed=true;
    return {...x,price:nextPrice,stock:nextStock,qty:nextQty};
   });
   if(changed){setCart(synced);writeCart(synced)}
  }
  return true;
 }
 useEffect(()=>{let live=true;setQuote(null);setQuoteError('');if(!supabase||cart.length===0)return()=>{live=false};const timer=setTimeout(async()=>{const items=cart.map(x=>({variant_id:x.variantId,quantity:x.qty}));const {data,error}=await supabase.rpc('quote_store_order_v2',{p_items:items,p_promo_code:promoCode||null});if(!live)return;if(error){setQuoteError(friendlyStoreError(error.message));return}setQuote(data);if(Array.isArray(data?.items)){let changed=false;const synced=cart.map(x=>{const liveItem=data.items.find(i=>String(i.variant_id)===String(x.variantId));if(!liveItem)return x;const nextPrice=Number(liveItem.price??x.price),nextStock=liveItem.available==null?null:Number(liveItem.available);const nextQty=nextStock==null?x.qty:Math.min(x.qty,Math.max(1,nextStock));if(nextPrice!==Number(x.price)||nextStock!==x.stock||nextQty!==x.qty)changed=true;return {...x,price:nextPrice,stock:nextStock,qty:nextQty};});if(changed){setCart(synced);writeCart(synced);}}},120);return()=>{live=false;clearTimeout(timer)}},[cart,promoCode]);
 async function applyPromo(){
  const code=promoInput.trim().toUpperCase();
  if(!code){setPromoCode('');setPromoInput('');await refreshLiveQuoteNow('');return}
  setPromoBusy(true);setQuoteError('');
  const ok=await refreshLiveQuoteNow(code);
  setPromoBusy(false);
  if(ok){setPromoCode(code);setPromoInput(code)}
 }
 async function removePromo(){
  setPromoCode('');setPromoInput('');setQuoteError('');await refreshLiveQuoteNow('');
 }
 async function placeOrder(e){e.preventDefault();setError('');if(quoteError)return setError(quoteError);const email=form.email.trim(),phone=form.phone.replace(/\s|\(|\)|-/g,'');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return setError('Enter a valid email address.');if(physical&&!/^(?:\+90|0)?5\d{9}$/.test(phone))return setError('Enter a valid Turkish mobile number.');if(physical&&form.address.trim().length<10)return setError('Enter a complete delivery address.');if(physical&&(!form.city||!form.district))return setError('Select city and district.');if(!supabase)return setError('Store connection unavailable.');setBusy(true);
  const address=physical?{line1:form.address,city:form.city,district:form.district,postal_code:form.postal,country:'TR'}:null;
  const items=cart.map(x=>({variant_id:x.variantId,quantity:x.qty}));
  const {data,error:rpcError}=await supabase.rpc('create_store_order_v2',{p_email:email,p_full_name:form.name.trim(),p_phone:physical?phone:null,p_address:address,p_notes:form.notes||null,p_items:items,p_promo_code:promoCode||null});
  setBusy(false);if(rpcError){setError(friendlyStoreError(rpcError.message));return}setDone({...data,email,items:cart.map(x=>({key:x.key,title:x.title,format:x.isMerch?[x.size,x.color,x.style].filter(Boolean).join(' · '):x.format,qty:x.qty,price:x.price,isMerch:x.isMerch})),shippingAddress:address});updateCart([]);setCheckout(false);
 }
 return <><main className={"storePage "+(filter==="lethargia"?"storePageLethargia":"")}><header className="nav shell"><Link className="brand" href="/"><img src="/brand/sideii-logo-flat.png" alt="Side II"/></Link><nav><Link href="/">Releases</Link><Link href="/#imprints">Imprints</Link><Link href="/#about">About</Link><Link href="/apply">Apply</Link></nav></header>
 <section className="storeHero shell"><span>STORE / CATALOGUE</span><h1>Available<br/><i>editions.</i></h1><p>Physical objects and digital masters from SIDE:II and its imprints.</p><div className="storeEditorialLinks"><Link className="storeWearEntry" href="/wear">{t('WEAR WHAT YOU SUPPORT')} →</Link><Link className="storeWearEntry" href="/collections">{t('COLLECTIONS')} →</Link><Link className="storeWearEntry" href="/bundles">{t('BUNDLES')} →</Link><Link className="storeWearEntry" href="/archive">{t('ARCHIVE')} →</Link></div></section>
 <section className="storeFilters shell"><div>{[['all','ALL'],['sideii','SIDE:II'],['lethargia','LETHARGIA'],['selected','SELECTED']].map(([v,l])=><button key={v} className={filter===v?'active':''} onClick={()=>setFilter(v)}>{l}</button>)}</div><div>{[['all','ALL MEDIA'],['merch','MERCH'],['vinyl','VINYL'],['cd','CD'],['cassette','CASSETTE'],['digital','DIGITAL']].map(([v,l])=><button key={v} className={formatFilter===v?'active':''} onClick={()=>setFormatFilter(v)}>{l}</button>)}</div></section>{filter==='lethargia'&&<section className="storeImprintContext shell"><div><small>A SIDE:II IMPRINT</small><img src="/brand/lethargia/lethargia-logo.png" alt="Lethargia Records"/></div><p>Independent editions developed under their own visual and physical logic.</p><Link href="/imprints/lethargia">OPEN IMPRINT ↗</Link></section>}<section className="storeCatalogue shell">{filtered.map(r=><article className={"storeProduct "+(r.isMerch?"merchProduct ":"")+(r.productOrigin==="distributed"?"selectedProduct ":"")+(r.imprint==="lethargia"?"lethargiaProduct":"")} key={r.slug}><button type="button" className={"storeWishlistButton "+(wishlist.some(x=>x.product_slug===r.slug)?"active":"")} aria-label="Toggle wishlist" onClick={()=>toggleWishlist(r)}>{wishlist.some(x=>x.product_slug===r.slug)?'♥':'♡'}</button><Link href={r.isMerch?('/store/'+r.slug):('/releases/'+r.slug)} className="storeCover">{r.isMerch&&r.mockups?.front?<MerchPreview product={r}/>:r.cover?<img src={r.cover} alt={r.title}/>:<span>{r.catalogue}</span>}</Link><div className="storeProductMeta">{r.productOrigin==='distributed'&&<span className="selectedBadge">SELECTED / DISTRIBUTION</span>}{r.isMerch&&<span className="merchBadge">SIDE:II / MERCH</span>}{r.imprint==='lethargia'&&r.productOrigin!=='distributed'&&<Link className="lethargiaBadge" href="/imprints/lethargia">LETHARGIA RECORDS / IMPRINT ↗</Link>}<small>{r.isMerch?String(r.merchCategory||'MERCH').toUpperCase():(r.productOrigin==='distributed'?(r.originalLabel||'SELECTED / DISTRIBUTION'):(r.imprint==='lethargia'?'LETHARGIA RECORDS':'SIDE:II'))} · {r.originalCatalogue||r.catalogue}</small><h2>{r.title}</h2>{r.productOrigin==='distributed'&&<p className="selectedAttribution">Independent release by <b>{r.originalLabel||'external label'}</b>. Distributed / selected by SIDE:II.</p>}<div className="storeVariants">{r.variants.map(v=>{const soldOut=v.format!=='digital'&&v.stock<=0;const canPreorder=soldOut&&v.preorderEnabled;const unavailable=r.status!=='AVAILABLE'||(soldOut&&!canPreorder);return <div className="storeVariant" key={v.id||v.sku}><div><b>{v.formatLabel}</b><span>{r.isMerch?[v.style,soldOut?(canPreorder?'PRE-ORDER':'SOLD OUT'):v.stock+' IN STOCK'].filter(Boolean).join(' · '):v.format==='digital'?'DIGITAL DOWNLOAD':v.format==='vinyl'?[v.vinylSize,v.vinylSpeed,v.vinylWeight&&v.vinylWeight+'G',v.vinylColor,soldOut&&canPreorder?'PRE-ORDER':null].filter(Boolean).join(' · '):soldOut?(canPreorder?'PRE-ORDER': 'SOLD OUT'):v.stock+' IN STOCK'}{v.editionNumberingEnabled&&v.editionTotal?' · LIMITED '+v.editionTotal:''}</span></div><strong>{fmt(v.price)}</strong>{unavailable&&soldOut&&!canPreorder?<button className="waitlistButton" type="button" onClick={()=>{setWaitlistVariant(waitlistVariant===v.id?null:v.id);setWaitlistMessage('')}}>WAITLIST</button>:<button disabled={unavailable} onClick={()=>add(r,v)}>{r.status!=='AVAILABLE'?'COMING SOON':canPreorder?'PRE-ORDER':'ADD'}</button>}{waitlistVariant===v.id&&<div className="storeWaitlist"><input type="email" placeholder="EMAIL FOR RESTOCK ALERT" value={waitlistEmail} onChange={e=>setWaitlistEmail(e.target.value)}/><button type="button" disabled={waitlistBusy} onClick={()=>joinWaitlist(v)}>{waitlistBusy?'SAVING…':'NOTIFY ME'}</button>{waitlistMessage&&<small>{waitlistMessage}</small>}</div>}</div>})}</div></div></article>)}{filtered.length===0&&(filter==='lethargia'?<div className="storeNoResults storeNoResultsLethargia"><small>LETHARGIA / CATALOGUE IN PREPARATION</small><h3>No public editions yet.</h3><p>The first Lethargia releases will appear here automatically when they are made public in Control Room.</p><Link href="/imprints/lethargia">OPEN LETHARGIA RECORDS ↗</Link></div>:<div className="storeNoResults">NO PRODUCTS IN THIS SELECTION.</div>)}</section></main>
 {false&&<aside className={'cartDrawer '+(open?'open':'')}><button className="cartClose" onClick={()=>{setOpen(false);setCheckout(false)}}>CLOSE ×</button><span>SHOPPING BAG</span>{done?<div className="orderDone"><b>ORDER RECEIVED</b><strong>#SII-{String(done.order_no).padStart(4,'0')}</strong><p>{fmt(done.total)}</p><small>Your order has been recorded. Payment has not been collected yet.</small><div className="orderDoneMeta"><span>EMAIL</span><em>{done.email}</em>{done.shippingAddress&&<><span>DELIVERY</span><em>{[done.shippingAddress.city,done.shippingAddress.district].filter(Boolean).join(' / ')}</em></>}</div><div className="orderDoneItems">{(done.items||[]).map(x=><div key={x.key}><span>{x.title}<small>{x.format||'ITEM'} · QTY {x.qty}</small></span><strong>{fmt(x.price*x.qty)}</strong></div>)}</div><div className="orderDoneTotals"><span>SUBTOTAL <strong>{fmt(done.subtotal)}</strong></span><span>SHIPPING <strong>{fmt(done.shipping_total)}</strong></span><span>TOTAL <strong>{fmt(done.total)}</strong></span></div><button type="button" className="orderDoneClose" onClick={()=>{setDone(null);setOpen(false)}}>CONTINUE SHOPPING →</button></div>:checkout?<form className="checkoutForm" onSubmit={placeOrder}><h3>Checkout</h3><label>EMAIL<input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>FULL NAME<input required={physical} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>PHONE<input required={physical} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>{physical&&<><label>ADDRESS<textarea required value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></label><TurkeyAddressFields form={form} setForm={setForm}/><label>POSTAL CODE<input value={form.postal} onChange={e=>setForm({...form,postal:e.target.value})}/></label></>}<label>ORDER NOTE<textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label>{error&&<p className="checkoutError">{error}</p>}<div className="checkoutSummary"><div className="checkoutSummaryHead"><span>ORDER SUMMARY</span><small>{orderType}</small></div>{cart.map(x=><div className="checkoutSummaryItem" key={x.key}><span>{x.title}<small>{x.format} · QTY {x.qty}</small></span><strong>{fmt(x.price*x.qty)}</strong></div>)}<div className="checkoutSummaryRow"><span>SUBTOTAL</span><strong>{fmt(subtotal)}</strong></div>{discount>0&&<div className="checkoutSummaryRow checkoutSummaryDiscount"><span>DISCOUNT · {promoCode}</span><strong>−{fmt(discount)}</strong></div>}<div className="checkoutSummaryRow"><span>SHIPPING</span><strong>{physical?(quote?fmt(shipping):'CALCULATING…'):'NOT REQUIRED'}</strong></div><div className="checkoutSummaryRow checkoutSummaryTotal"><span>TOTAL</span><strong>{fmt(total)}</strong></div></div><button className="checkoutButton" disabled={busy||!!quoteError||!quote}>{busy?'CREATING ORDER…':quoteError?'UNAVAILABLE':!quote?'CHECKING CART…':'PLACE ORDER'}</button><button type="button" className="checkoutBack" onClick={()=>setCheckout(false)}>← BACK TO BAG</button></form>:cart.length===0?<p className="cartEmpty">Your bag is empty.</p>:<><div className="cartItems">{cart.map(x=><article key={x.key}>{x.isMerch?<CartMerchThumb item={x}/>:x.cover&&<img src={x.cover} alt=""/>}<div><b>{x.title}</b><small>{x.isMerch?[x.size,x.color,x.style].filter(Boolean).join(' · '):x.format}{x.digital?' · DOWNLOAD':''}</small><div><button onClick={()=>updateCart(cart.map(y=>y.key===x.key?{...y,qty:Math.max(1,y.qty-1)}:y))}>−</button><span>{x.qty}</span><button disabled={x.stock!=null&&x.qty>=x.stock} onClick={()=>updateCart(cart.map(y=>y.key===x.key?{...y,qty:y.stock==null?y.qty+1:Math.min(y.qty+1,y.stock)}:y))}>＋</button><button onClick={()=>updateCart(cart.filter(y=>y.key!==x.key))}>REMOVE</button></div></div><strong>{fmt(x.price*x.qty)}</strong></article>)}</div><div className="promoBox"><div className="promoLabel"><span>GIFT / PROMO CODE</span>{promoCode&&<button type="button" onClick={removePromo}>REMOVE</button>}</div><div className="promoEntry"><input value={promoInput} placeholder="ENTER CODE" onChange={e=>setPromoInput(e.target.value.toUpperCase())} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();applyPromo()}}}/><button type="button" disabled={promoBusy||!promoInput.trim()} onClick={applyPromo}>{promoBusy?'CHECKING…':promoCode?'UPDATE':'APPLY'}</button></div>{promoCode&&quote&&!quoteError&&<small>CODE {promoCode} APPLIED</small>}</div><div className="cartTotal"><span>SUBTOTAL</span><strong>{fmt(localSubtotal)}</strong></div>{discount>0&&<div className="cartDiscount"><span>DISCOUNT · {promoCode}</span><strong>−{fmt(discount)}</strong></div>}{physical&&quote&&shipping>0&&<div className="cartShipping"><span>SHIPPING</span><strong>{fmt(shipping)}</strong></div>}{quoteError&&<p className="checkoutError">{quoteError}</p>}<button className="checkoutButton" disabled={!!quoteError||!quote} onClick={async()=>{if(await refreshLiveQuoteNow())setCheckout(true)}}>{quoteError?'UNAVAILABLE':quote?'CHECKOUT →':'CHECKING CART…'}</button></>}</aside>}</>
}
