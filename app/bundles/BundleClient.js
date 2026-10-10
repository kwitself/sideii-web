'use client';
import GlobalHeader from '../components/GlobalHeader';
import {useMemo,useState} from 'react';
import {MAX_CART_LINE_QTY,addCartItem,readCart} from '../lib/cart';
import {useLocaleCurrency} from '../components/LocaleCurrencyProvider';

export default function BundleClient({bundles=[],products=[],flexRules=[]}){
 const {money}=useLocaleCurrency();
 const [message,setMessage]=useState('');
 const [flexSelected,setFlexSelected]=useState([]);
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

 const activeFlex=flexRules[0]||null;
 const flexEligible=useMemo(()=>{
  if(!activeFlex)return [];
  const ids=Array.isArray(activeFlex.eligible_product_ids)?activeFlex.eligible_product_ids:[];
  return products.filter(p=>!ids.length||ids.includes(p.id));
 },[activeFlex,products]);
 const flexRows=useMemo(()=>flexSelected.map(id=>{const product=productMap[id];return {product,variant:chosenVariant(product)}}).filter(x=>x.product&&x.variant),[flexSelected,productMap]);
 const flexSubtotal=flexRows.reduce((sum,x)=>sum+Number(x.variant.price||0),0);
 const flexDiscount=!activeFlex?0:(activeFlex.discount_type==='percent'?flexSubtotal*Math.min(Number(activeFlex.discount_value||0),100)/100:Math.min(flexSubtotal,Number(activeFlex.discount_value||0)));
 const flexReady=!!activeFlex&&flexRows.length>=Number(activeFlex.min_items||2)&&(!activeFlex.max_items||flexRows.length<=Number(activeFlex.max_items));

 function toggleFlex(productId){
  if(flexSelected.includes(productId)){setFlexSelected(x=>x.filter(id=>id!==productId));return}
  if(activeFlex?.max_items&&flexSelected.length>=Number(activeFlex.max_items)){setMessage('This set allows up to '+activeFlex.max_items+' objects.');return}
  setFlexSelected(x=>[...x,productId]);
 }
 function addFlexBundle(){
  if(!flexReady){setMessage('Select at least '+Number(activeFlex?.min_items||2)+' eligible objects.');return}
  const cart=readCart();
  for(const row of flexRows){
   const allowed=lineMax(row.product,row.variant);
   const key=String(row.variant.id||row.variant.sku||'');
   const existing=cart.find(x=>String(x.key||x.variantId||x.sku||'')===key);
   if(row.product.status!=='AVAILABLE'||allowed<=Number(existing?.qty||0)){setMessage(row.product.title+' is unavailable for this set.');return}
  }
  for(const row of flexRows)addCartItem(row.product,row.variant);
  setMessage((activeFlex.name||'Custom set')+' added. Final saving is verified at checkout.');
  setFlexSelected([]);
  window.dispatchEvent(new Event('sideii-open-bag'));
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
   {message&&<p className="bundleMessage" role="status" aria-live="polite">{message}</p>}
   {bundles.length===0?<div className="bundleEmpty"><small>BUNDLES / IN PREPARATION</small><h2>No public collector bundles yet.</h2></div>:bundles.map((b,i)=>{const x=bundlePreview(b);return <article id={b.slug} key={b.id}>
    <div className="bundleIndex">{String(i+1).padStart(2,'0')}</div>
    <div className="bundleInfo"><small>{b.discount_type==='percent'?b.discount_value+'% SET SAVING':money(b.discount_value)+' SET SAVING'}</small><h2>{b.name}</h2><p>{b.description||'A SIDE:II collector set.'}</p><div className="bundleItems">{x.valid.map(r=><span key={r.product.id}>{r.product.catalogue} · {r.product.title} × {r.cfg.quantity}</span>)}</div></div>
    <div className="bundleBuy"><small>SET TOTAL</small>{x.discount>0&&<del>{money(x.subtotal)}</del>}<b>{money(x.total)}</b><button disabled={x.valid.length!==x.rows.length||!x.valid.length} onClick={()=>addBundle(b)}>{x.valid.length!==x.rows.length?'UNAVAILABLE':'ADD BUNDLE →'}</button></div>
   </article>})}
  </section>
  {activeFlex&&<section className="flexBundleBuilder shell">
   <header><div><span>BUILD YOUR OWN / SET</span><h2>{activeFlex.name}</h2><p>Choose {activeFlex.min_items}{activeFlex.max_items?'–'+activeFlex.max_items:'+'} eligible objects. The checkout backend recalculates the best available saving.</p></div><div><small>{activeFlex.discount_type==='percent'?activeFlex.discount_value+'% SAVING':money(activeFlex.discount_value)+' SAVING'}</small><b>{flexReady?money(Math.max(0,flexSubtotal-flexDiscount)):money(flexSubtotal)}</b></div></header>
   <div className="flexBundleGrid">{flexEligible.map(p=>{const v=chosenVariant(p),selected=flexSelected.includes(p.id);return <button type="button" key={p.id} className={selected?'selected':''} onClick={()=>toggleFlex(p.id)} disabled={!v||p.status!=='AVAILABLE'}><span>{selected?'✓':'＋'}</span><div><small>{p.catalogue}</small><b>{p.rawTitle||p.title}</b><em>{v?money(v.price):'UNAVAILABLE'}</em></div></button>})}</div>
   <footer><span>{flexSelected.length} / {activeFlex.max_items||'∞'} SELECTED</span><button type="button" disabled={!flexReady} onClick={addFlexBundle}>ADD CUSTOM SET →</button></footer>
  </section>}
 </main>
}
