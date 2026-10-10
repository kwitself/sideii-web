'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {supabase} from '../../lib/supabase';

export default function SharedListClient({token}){
 const [data,setData]=useState(undefined);
 useEffect(()=>{if(!token)return;(async()=>{const {data}=await supabase.rpc('get_shared_list',{p_token:token});setData(data||null)})()},[token]);
 if(data===undefined)return <section className="sharedListShell"><p>Loading shared list…</p></section>;
 if(!data)return <section className="sharedListShell"><h1>List unavailable.</h1><p>This shared list may have expired or been revoked.</p></section>;
 const items=Array.isArray(data.payload)?data.payload:[];
 return <section className="sharedListShell">
  <header><span>{String(data.kind||'list').toUpperCase()}</span><h1>{data.title||'SIDE:II Shared List'}</h1><p>Shared from a SIDE:II collector account.</p></header>
  <div className="sharedListGrid">{items.map((item,i)=>{
   const slug=item.product_slug||item.slug;const merch=!!item.is_merch;
   return <article key={slug||i}>{item.cover&&<img src={item.cover} alt=""/>}<div><small>{item.catalogue||item.format||'SIDE:II'}</small><b>{item.title||'Untitled object'}</b>{item.qty&&<span>QTY {item.qty}</span>}{slug&&<Link href={merch?('/store/'+slug):('/releases/'+slug)}>OPEN →</Link>}</div></article>
  })}</div>
 </section>;
}
