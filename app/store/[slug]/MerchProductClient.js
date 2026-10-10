'use client';
import Link from 'next/link';
import {useEffect,useMemo,useState} from 'react';
import {addCartItem,readCart} from '../../lib/cart';
import {supabase} from '../../lib/supabase';
import {useLocaleCurrency} from '../../components/LocaleCurrencyProvider';
import MerchMockupPreview from '../../components/MerchMockupPreview';
import ProductShare from '../../components/ProductShare';
import ProductLaunchGate from '../../components/ProductLaunchGate';

function normalizeTemplate(v){
 const x=String(v||'apparel').toLowerCase();
 return ['apparel','mug','lighter','beanie','patch'].includes(x)?x:(x==='accessory'?'lighter':'apparel');
}

export default function MerchProductClient({product}){
 const {money}=useLocaleCurrency();
 const variants=product.variants||[];
 const detail=product.storefrontConfig?.detail||{};
 const wear=product.storefrontConfig?.wear||{};
 const wearVisible=product.isMerch&&product.storefrontConfig?.visibility?.wear!==false;
 const showWearSupport=wearVisible&&wear.show_support!==false;
 const defaultVariant=detail.default_variant;const defaultIndex=Math.max(0,variants.findIndex(x=>String(x.id||x.sku)===String(defaultVariant)));
 const [index,setIndex]=useState(defaultVariant&&defaultVariant!=='auto'?defaultIndex:0);
 const preferredSide=detail.default_side==='back'&&product.mockups?.back?'back':product.mockups?.front?'front':'back';
 const [side,setSide]=useState(preferredSide);
 const [added,setAdded]=useState(false);
 const [bagCount,setBagCount]=useState(0);const[waitEmail,setWaitEmail]=useState(''),[waitMessage,setWaitMessage]=useState(''),[waitBusy,setWaitBusy]=useState(false);const[paymentMode,setPaymentMode]=useState({mode:'',extra_support_enabled:false});
 useEffect(()=>{const token=new URLSearchParams(window.location.search).get('variant');if(token){const i=variants.findIndex(x=>String(x.sku||x.id)===token||String(x.id||'')===token);if(i>=0)setIndex(i)}const sync=()=>setBagCount(readCart().reduce((s,x)=>s+x.qty,0));sync();window.addEventListener('sideii-cart',sync);(async()=>{if(!supabase)return;const {data}=await supabase.rpc('get_store_payment_mode');if(data)setPaymentMode(data)})();return()=>window.removeEventListener('sideii-cart',sync)},[]);
 const selectVariant=i=>{setIndex(i);const token=variants[i]?.sku||variants[i]?.id;if(!token)return;const url=new URL(window.location.href);url.searchParams.set('variant',token);history.replaceState(null,'',url.pathname+url.search+url.hash)};
 const v=variants[index]||{};
 const soldOut=Number(v.stock||0)<=0,canPreorder=soldOut&&v.preorderEnabled;const unavailable=product.status!=='AVAILABLE'||(soldOut&&!canPreorder);
 const hasFront=!!product.mockups?.front,hasBack=normalizeTemplate(product.mockups?.front?.template||product.merchCategory)==='apparel'&&!!product.mockups?.back;
 const gallery=useMemo(()=>product.galleryImages?.filter(x=>x?.url&&!x?.mockup)||[],[product.galleryImages]);
 function add(){if(unavailable)return;const next=addCartItem(product,v);setBagCount(next.reduce((s,x)=>s+x.qty,0));setAdded(true);setTimeout(()=>setAdded(false),1300)}
 async function joinWaitlist(){const email=waitEmail.trim();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){setWaitMessage('Enter a valid email.');return}setWaitBusy(true);setWaitMessage('');const {error}=await supabase.rpc('join_stock_waitlist',{p_variant_id:v.id,p_email:email});setWaitBusy(false);setWaitMessage(error?error.message:'You are on the restock list.');}
 return <section className="merchDetail shell">
  <div className="merchDetailVisual">
   <div className="merchViewSelector"><span>PRODUCT VIEW</span><div className="merchDetailSwitch" role="tablist" aria-label="Product view">{hasFront&&<button type="button" role="tab" aria-selected={side==='front'} className={side==='front'?'active':''} onClick={()=>setSide('front')}><i>01</i><b>FRONT</b></button>}{hasBack&&<button type="button" role="tab" aria-selected={side==='back'} className={side==='back'?'active':''} onClick={()=>setSide('back')}><i>02</i><b>BACK</b></button>}</div></div>
   <MerchMockupPreview product={product} side={side} raster className="merchDetailRasterStage"/><div className="merchViewMeta"><span>{side.toUpperCase()} VIEW</span><small>{String(product.merchCategory||'MERCH').toUpperCase()}</small></div>
   {gallery.length>0&&<div className="merchDetailGallery">{gallery.slice(0,4).map((g,i)=><img key={g.id||g.url||i} src={g.url} alt={product.title+' view '+(i+1)}/>)}</div>}
  </div>
  <div className="merchDetailInfo">
   <Link href="/store" className="merchBack">← STORE</Link>
   <span>SIDE:II / {String(product.merchCategory||'MERCH').toUpperCase()}</span><Link className="merchWearMark" href="/wear">WEAR WHAT YOU SUPPORT ↗</Link><ProductShare product={product} kind="store"/><ProductLaunchGate productId={product.id}/>
   <h1>{product.title}</h1>
   <p>{product.lead}</p>
   <div className="merchDetailFacts"><div><span>PRODUCT</span><b>{product.catalogue}</b></div><div><span>AVAILABILITY</span><b>{product.status}</b></div></div>
   {variants.length>0&&<div className="merchVariantChooser"><span>CHOOSE SIZE / COLOUR</span><div>{variants.map((x,i)=><button key={x.id||x.sku} className={i===index?'active':''} onClick={()=>selectVariant(i)}>{x.formatLabel}<small>{x.stock>0?x.stock+' LEFT':x.preorderEnabled?'PRE-ORDER':'SOLD OUT'}{x.editionNumberingEnabled&&x.editionTotal?' · LIMITED '+x.editionTotal:''}</small></button>)}</div></div>}
   {showWearSupport&&<div className={'merchSupportCallout '+(paymentMode.extra_support_enabled===false?'paused':'')}><div><span>{wear.support_label||'WWYS SUPPORT'}</span><b>{paymentMode.extra_support_enabled===false?'Extra support is temporarily paused.':(wear.support_line||'Add extra support in your bag.')}</b></div><small>{paymentMode.extra_support_enabled===false?'The WWYS impact model remains active and extra support will reopen with integrated checkout.':'Choose any extra amount after adding this object to your bag.'}</small></div>}
   <div className="merchBuyRow"><strong>{money(v.price)}</strong><button disabled={unavailable} onClick={add}>{product.status!=='AVAILABLE'?'COMING SOON':soldOut&&!canPreorder?'SOLD OUT':added?'ADDED ✓':canPreorder?'PRE-ORDER':'ADD TO BAG'}</button></div>{product.status==='AVAILABLE'&&soldOut&&!canPreorder&&product.commerceConfig?.waitlist!==false&&<div className="merchWaitlist"><input type="email" placeholder="EMAIL FOR RESTOCK ALERT" value={waitEmail} onChange={e=>setWaitEmail(e.target.value)}/><button type="button" disabled={waitBusy} onClick={joinWaitlist}>{waitBusy?'SAVING…':'NOTIFY ME'}</button>{waitMessage&&<small>{waitMessage}</small>}</div>}
   <Link className="merchBagLink" href="/store?checkout=1">BAG · {bagCount}</Link>
  </div>
 </section>
}
