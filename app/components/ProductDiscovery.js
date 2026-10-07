'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {MAX_CART_LINE_QTY,addCartItem,readCart} from '../lib/cart';

const KEY='sideii-recently-viewed';
const pathFor=p=>p?.isMerch?'/store/'+p.slug:'/releases/'+p.slug;
const snapshot=p=>({id:p.id,slug:p.slug,title:p.rawTitle||p.title,cover:p.cover||null,isMerch:!!p.isMerch,catalogue:p.catalogue||'',artist:p.artist||'',format:p.format||'',merchCategory:p.merchCategory||''});
const chosenVariant=product=>(product?.variants||[]).find(v=>v.format==='digital'||Number(v.stock||0)>0||v.preorderEnabled)||(product?.variants||[])[0]||null;
const lineMax=(product,v)=>{
 if(!v)return 0;
 const productMax=Number(product?.commerceConfig?.max_qty)>0?Number(product.commerceConfig.max_qty):MAX_CART_LINE_QTY;
 if(v.format==='digital')return Math.min(MAX_CART_LINE_QTY,productMax);
 const preorder=!!v.preorderEnabled;
 const preorderLimit=preorder&&Number(v.preorderLimit)>0?Number(v.preorderLimit):MAX_CART_LINE_QTY;
 const stock=Number(v.stock||0);
 return Math.max(0,Math.min(MAX_CART_LINE_QTY,productMax,preorder?preorderLimit:stock));
};

export default function ProductDiscovery({current,related=[],bundles=[]}){
 const [recent,setRecent]=useState([]);
 const [bundleMessage,setBundleMessage]=useState('');

 useEffect(()=>{
  try{
   const raw=JSON.parse(localStorage.getItem(KEY)||'[]');
   const list=Array.isArray(raw)?raw:[];
   setRecent(list.filter(x=>x.slug&&x.slug!==current.slug).slice(0,4));
   const next=[snapshot(current),...list.filter(x=>x.slug!==current.slug)].slice(0,8);
   localStorage.setItem(KEY,JSON.stringify(next));
  }catch{}
 },[current.id,current.slug]);

 const relatedClean=(related||[]).filter(x=>x&&x.slug&&x.slug!==current.slug).slice(0,6);
 const bundleRows=(bundles||[]).filter(b=>Array.isArray(b.items)&&b.items.length>=2).slice(0,3);
 if(!relatedClean.length&&!recent.length&&!bundleRows.length)return null;

 function addBundle(bundle){
  setBundleMessage('');
  const rows=(bundle.items||[]).map(item=>({item,product:item.product,variant:chosenVariant(item.product)}));
  if(!rows.length||rows.some(x=>!x.product||!x.variant)){setBundleMessage('One or more set items are unavailable.');return}
  const cart=readCart();
  for(const row of rows){
   const {product,variant,item}=row;
   if(product.status!=='AVAILABLE'){setBundleMessage((product.rawTitle||product.title)+' is not currently available.');return}
   const qty=Math.max(1,Number(item.quantity||1));
   const key=String(variant.id||variant.sku||'');
   const existing=cart.find(x=>String(x.key||x.variantId||x.sku||'')===key);
   const allowed=lineMax(product,variant);
   if(allowed<=0){setBundleMessage((product.rawTitle||product.title)+' is sold out.');return}
   if(Number(existing?.qty||0)+qty>allowed){setBundleMessage('Not enough stock for '+(product.rawTitle||product.title)+'.');return}
  }
  for(const row of rows){
   const qty=Math.max(1,Number(row.item.quantity||1));
   for(let i=0;i<qty;i++)addCartItem(row.product,row.variant);
  }
  setBundleMessage(bundle.name+' added. Bundle saving will be applied automatically in the bag.');
  window.dispatchEvent(new Event('sideii-open-bag'));
 }

 return <section className="productDiscovery shell">
  {bundleRows.length>0&&<div className="discoveryBlock completeSetBlock">
   <header><span>COMPLETE THE SET</span><small>Bundle savings are recalculated at checkout.</small></header>
   {bundleMessage&&<p className="completeSetStatus" role="status" aria-live="polite">{bundleMessage}</p>}
   <div className="completeSetGrid">{bundleRows.map(b=><article className="completeSetCard" key={b.id}>
    <Link href={'/bundles#'+b.slug} className="completeSetCardLink" aria-label={'Open '+b.name+' bundle'}>
     <div className="completeSetMeta"><small>{b.discount_type==='percent'?b.discount_value+'% SET SAVING':b.discount_value+' TRY SET SAVING'}</small><h3>{b.name}</h3><p>{b.description||'A SIDE:II collector set.'}</p></div>
     <div className="completeSetItems">{b.items.slice(0,4).map(x=><span key={x.product_id}>{x.product?.cover?<img src={x.product.cover} alt=""/>:<i/>}<b>{x.product?.rawTitle||x.product?.title||'OBJECT'}</b><em>×{x.quantity||1}</em></span>)}</div>
    </Link>
    <div className="completeSetActions"><button type="button" onClick={()=>addBundle(b)}>ADD SET TO BAG</button><Link href={'/bundles#'+b.slug}>VIEW SET →</Link></div>
   </article>)}</div>
  </div>}
  {relatedClean.length>0&&<div className="discoveryBlock">
   <header><span>YOU MAY ALSO LIKE</span><small>Curated by collection, imprint and format.</small></header>
   <div className="discoveryGrid">{relatedClean.map(p=><Link href={pathFor(p)} className="discoveryCard" key={p.id||p.slug}>
    <div className="discoveryVisual">{p.cover?<img src={p.cover} alt={p.rawTitle||p.title}/>:<span>{p.catalogue}</span>}</div>
    <div><small>{p.isMerch?String(p.merchCategory||'MERCH').toUpperCase():(p.artist||p.imprint||'SIDE:II')}</small><h3>{p.rawTitle||p.title}</h3><b>{p.format||p.catalogue}</b></div>
   </Link>)}</div>
  </div>}
  {recent.length>0&&<div className="discoveryBlock recentlyViewed">
   <header><span>RECENTLY VIEWED</span><small>Stored on this device.</small></header>
   <div className="discoveryGrid recentGrid">{recent.map(p=><Link href={pathFor(p)} className="discoveryCard" key={p.slug}>
    <div className="discoveryVisual">{p.cover?<img src={p.cover} alt={p.title}/>:<span>{p.catalogue}</span>}</div>
    <div><small>{p.isMerch?String(p.merchCategory||'MERCH').toUpperCase():(p.artist||'SIDE:II')}</small><h3>{p.title}</h3><b>{p.format||p.catalogue}</b></div>
   </Link>)}</div>
  </div>}
 </section>;
}
