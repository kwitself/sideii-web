'use client';
import GlobalHeader from '../components/GlobalHeader';
import Link from 'next/link';
import {useMemo,useState} from 'react';
import {addCartItem,readCart} from '../lib/cart';
import {useLocaleCurrency} from '../components/LocaleCurrencyProvider';

export default function BundleClient({bundles=[],products=[]}){
 const {money}=useLocaleCurrency();
 const [message,setMessage]=useState('');
 const productMap=useMemo(()=>Object.fromEntries(products.map(p=>[p.id,p])),[products]);

 function bundlePreview(bundle){
  const items=Array.isArray(bundle.items)?bundle.items:[];
  const rows=items.map(x=>({cfg:x,product:productMap[x.product_id]})).filter(x=>x.product);
  const subtotal=rows.reduce((s,r)=>s+Number(r.product.variants?.[0]?.price||0)*Number(r.cfg.quantity||1),0);
  const discount=bundle.discount_type==='percent'?subtotal*Math.min(Number(bundle.discount_value||0),100)/100:Math.min(subtotal,Number(bundle.discount_value||0));
  return {rows,subtotal,discount,total:Math.max(0,subtotal-discount)};
 }

 function addBundle(bundle){
  const {rows}=bundlePreview(bundle);
  if(!rows.length){setMessage('This bundle has no available products yet.');return}
  for(const row of rows){
   const v=row.product.variants?.[0];
   if(!v){setMessage('A bundle product has no active edition.');return}
   const qty=Math.max(1,Number(row.cfg.quantity||1));
   for(let i=0;i<qty;i++)addCartItem(row.product,v);
  }
  setMessage(bundle.name+' added. Bundle discount is calculated automatically in the bag.');
  window.dispatchEvent(new Event('sideii-open-bag'));
 }

 return <main className="bundlesPage">
  <GlobalHeader/>
  <section className="bundlesHero shell"><span>STORE / BUNDLES</span><h1>More than<br/><i>one object.</i></h1><p>Collector sets combine catalogue objects into a single purchase. Eligible bundle savings are calculated again by the store backend at checkout.</p></section>
  <section className="bundleList shell">
   {message&&<p className="bundleMessage">{message}</p>}
   {bundles.length===0?<div className="bundleEmpty"><small>BUNDLES / IN PREPARATION</small><h2>No public collector bundles yet.</h2></div>:bundles.map((b,i)=>{const x=bundlePreview(b);return <article id={b.slug} key={b.id}>
    <div className="bundleIndex">{String(i+1).padStart(2,'0')}</div>
    <div className="bundleInfo"><small>{b.discount_type==='percent'?b.discount_value+'% SET SAVING':money(b.discount_value)+' SET SAVING'}</small><h2>{b.name}</h2><p>{b.description||'A SIDE:II collector set.'}</p><div className="bundleItems">{x.rows.map(r=><span key={r.product.id}>{r.product.catalogue} · {r.product.title} × {r.cfg.quantity}</span>)}</div></div>
    <div className="bundleBuy"><small>SET TOTAL</small>{x.discount>0&&<del>{money(x.subtotal)}</del>}<b>{money(x.total)}</b><button onClick={()=>addBundle(b)}>ADD BUNDLE →</button></div>
   </article>})}
  </section>
 </main>
}
