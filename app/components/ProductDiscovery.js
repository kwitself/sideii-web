'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';

const KEY='sideii-recently-viewed';
const pathFor=p=>p?.isMerch?'/store/'+p.slug:'/releases/'+p.slug;
const snapshot=p=>({id:p.id,slug:p.slug,title:p.rawTitle||p.title,cover:p.cover||null,isMerch:!!p.isMerch,catalogue:p.catalogue||'',artist:p.artist||'',format:p.format||'',merchCategory:p.merchCategory||''});

export default function ProductDiscovery({current,related=[],bundles=[]}){
 const [recent,setRecent]=useState([]);

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

 return <section className="productDiscovery shell">
  {bundleRows.length>0&&<div className="discoveryBlock completeSetBlock">
   <header><span>COMPLETE THE SET</span><small>Bundle savings are recalculated at checkout.</small></header>
   <div className="completeSetGrid">{bundleRows.map(b=><Link href={'/bundles#'+b.slug} className="completeSetCard" key={b.id}>
    <div className="completeSetMeta"><small>{b.discount_type==='percent'?b.discount_value+'% SET SAVING':b.discount_value+' SET SAVING'}</small><h3>{b.name}</h3><p>{b.description||'A SIDE:II collector set.'}</p></div>
    <div className="completeSetItems">{b.items.slice(0,4).map(x=><span key={x.product_id}>{x.product?.cover?<img src={x.product.cover} alt=""/>:<i/>}<b>{x.product?.rawTitle||x.product?.title||'OBJECT'}</b><em>×{x.quantity||1}</em></span>)}</div>
    <strong>VIEW BUNDLE →</strong>
   </Link>)}</div>
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
