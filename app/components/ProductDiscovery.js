'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';

const KEY='sideii-recently-viewed';
const pathFor=p=>p?.isMerch?'/store/'+p.slug:'/releases/'+p.slug;
const snapshot=p=>({id:p.id,slug:p.slug,title:p.rawTitle||p.title,cover:p.cover||null,isMerch:!!p.isMerch,catalogue:p.catalogue||'',artist:p.artist||'',format:p.format||'',merchCategory:p.merchCategory||''});

export default function ProductDiscovery({current,related=[]}){
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
 if(!relatedClean.length&&!recent.length)return null;

 return <section className="productDiscovery shell">
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
