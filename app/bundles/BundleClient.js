'use client';
import GlobalHeader from '../components/GlobalHeader';
import {useMemo,useState} from 'react';
import {MAX_CART_LINE_QTY,addCartItem,readCart} from '../lib/cart';
import {useLocaleCurrency} from '../components/LocaleCurrencyProvider';

export default function BundleClient({bundles=[],products=[]}){
 const {money}=useLocaleCurrency();
 const [message,setMessage]=useState('');
 const productMap=useMemo(()=>Object.fromEntries(products.map(p=>[p.id,p])),[products]);

 const chosenVariant=product=>(product?.variants||[])[0]||null;
 const lineMax=(product,v)=>{
  if(!v)return 0;
  if(v.format==='digital')return Math.min(MAX_CART_LINE_QTY,Number(product?.commerceConfig?.max_qty)>0?Number(product.commerceConfig.max_qty):MAX_CART_LINE_QTY);
  const stock=Number(v.stock||0);
  const preorder=!!v.preorderEnabled;
  const preorderLimit=preorder&&Number(v.preorderLimit)>0?Number(v.preorderLimit):MAX_CART_LINE_QTY;
  const productMax=Number(product?.commerceConfig?.max_qty)>0?Number(product.commerceConfig.max_qty):MAX_CART_LINE_QTY;
  return Math.max(0,Math.min(MAX_CART_LINE_QTY,productMax,preorder?preorderLimit:stock));
 };

 function bundlePreview(bundle){
  const items=Array.isArray(bundle.items)?bundle.items:[];
  const rows=items.map(x=>{
   const product=productMap[x.product_id];
   return {cfg:x,product,variant:chosenVariant(product)};
  });
  const valid=rows.filter(x=>x.product&&x.variant);
  const subtotal=valid.reduce((s,r)=>s+Number(r.variant.price||0)*Math.max(1,Number(r.cfg.quantity||1)),0);
  const discount=bundle.discount_type==='percent'?subtotal*Math.min(Number(bundle.discount_value||0),100)/100:Math.min(subtotal,Number(bundle.discount_value||0));
  return {rows,valid,subtotal,discount,total:Math.max(0,subtotal-discount)};
 }

 function addBundle(bundle){
  const {rows,valid}=bundlePreview(bundle);
  if(!rows.length){setMessage('This bundle has no products yet.');return}
  if(valid.length!==rows.length){setMessage('One or more bundle products are unavailable. Nothing was added.');return}

  const cart=readCart();
  for(const row of valid){
   const {product,variant:v}=row;
   if(product.status!=='AVAILABLE'){setMessage(product.title+' is not currently available. Nothing was added.');return}
   const qty=Math.max(1,Number(row.cfg.quantity||1));
   const key=String(v.id||v.sku||'');
   const existing=cart.find(x=>String(x.key||x.variantId||x.sku||'')===key);
   const allowed=lineMax(product,v);
   if(allowed<=0){setMessage(product.title+' is sold out. Nothing was added.');return}
   if(Number(existing?.qty||0)+qty>allowed){
    setMessage(product.title+' does not have enough available quantity for this bundle. Nothing was added.');
    return;
   }
  }

  for(const row of valid){
   const qty=Math.max(1,Number(row.cfg.quantity||1));
   for(let i=0;i<qty;i++)addCartItem(row.product,row.variant);
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
    <div className="bundleInfo"><small>{b.discount_type==='percent'?b.discount_value+'% SET SAVING':money(b.discount_value)+' SET SAVING'}</small><h2>{b.name}</h2><p>{b.description||'A SIDE:II collector set.'}</p><div className="bundleItems">{x.valid.map(r=><span key={r.product.id}>{r.product.catalogue} · {r.product.title} × {r.cfg.quantity}</span>)}</div></div>
    <div className="bundleBuy"><small>SET TOTAL</small>{x.discount>0&&<del>{money(x.subtotal)}</del>}<b>{money(x.total)}</b><button disabled={x.valid.length!==x.rows.length||!x.valid.length} onClick={()=>addBundle(b)}>{x.valid.length!==x.rows.length?'UNAVAILABLE':'ADD BUNDLE →'}</button></div>
   </article>})}
  </section>
 </main>
}
