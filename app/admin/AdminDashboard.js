'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import ReleaseWorkspace from './ReleaseWorkspace';

function money(value,currency='TRY'){
 const n=Number(value||0);
 try{return new Intl.NumberFormat('tr-TR',{style:'currency',currency,maximumFractionDigits:2}).format(n)}
 catch{return `₺${n.toFixed(2)}`}
}

export default function AdminDashboard(){
 const [products,setProducts]=useState([]);
 const [orders,setOrders]=useState([]);
 const [customers,setCustomers]=useState([]);
 const [loading,setLoading]=useState(true);
 const [message,setMessage]=useState('');
 const [editing,setEditing]=useState(null);
 const [deletingId,setDeletingId]=useState(null);

 const load=useCallback(async()=>{
  if(!supabase)return;
  setLoading(true); setMessage('');
  const [p,o,c]=await Promise.all([
   supabase.from('products').select('id,catalogue_no,slug,title,artist_project,description,artwork_path,status,is_public,created_at,product_variants(id,sku,format,edition_name,price,currency,manufactured_qty,stock_qty,reserved_qty,low_stock_threshold,active)').order('created_at',{ascending:false}),
   supabase.from('orders').select('id,order_no,email,status,payment_status,total,currency,created_at').order('created_at',{ascending:false}).limit(8),
   supabase.from('customers').select('id,email,full_name,created_at').order('created_at',{ascending:false}).limit(8)
  ]);
  if(p.error){setMessage(p.error.message);setProducts([])}else setProducts(p.data||[]);
  setOrders(o.error?[]:(o.data||[])); setCustomers(c.error?[]:(c.data||[])); setLoading(false);
 },[]);

 useEffect(()=>{load()},[load]);

 const variants=useMemo(()=>products.flatMap(p=>(p.product_variants||[]).map(v=>({...v,product:p}))),[products]);
 const stockUnits=variants.reduce((s,v)=>s+Number(v.stock_qty||0),0);
 const reservedUnits=variants.reduce((s,v)=>s+Number(v.reserved_qty||0),0);
 const openOrders=orders.filter(o=>!['completed','cancelled','refunded'].includes(o.status)).length;
 const revenue=orders.filter(o=>o.payment_status==='paid').reduce((s,o)=>s+Number(o.total||0),0);

 async function deleteRelease(p){
  const ok=window.confirm(`Delete "${p.title}"? This permanently removes the release, its variants and artwork. This cannot be undone.`);
  if(!ok)return;
  setDeletingId(p.id); setMessage('');
  try{
   if(p.artwork_path){
    const {error:storageError}=await supabase.storage.from('release-artwork').remove([p.artwork_path]);
    if(storageError) throw storageError;
   }
   const {error}=await supabase.from('products').delete().eq('id',p.id);
   if(error) throw error;
   setMessage('Release deleted.');
   await load();
  }catch(err){
   setMessage(`Delete failed: ${err?.message||'Unknown error'}`);
  }finally{setDeletingId(null)}
 }

 async function saveStock(v){
  const next=Math.max(0,Number.parseInt(v.stock_qty||'0',10)||0);
  const reserved=Math.max(0,Number.parseInt(v.reserved_qty||'0',10)||0);
  const threshold=Math.max(0,Number.parseInt(v.low_stock_threshold||'0',10)||0);
  const manufactured=Math.max(next+reserved,Number.parseInt(v.manufactured_qty||'0',10)||0);
  const {error}=await supabase.from('product_variants').update({stock_qty:next,reserved_qty:reserved,low_stock_threshold:threshold,manufactured_qty:manufactured}).eq('id',v.id);
  if(error){setMessage(error.message);return}
  await supabase.from('inventory_movements').insert({variant_id:v.id,movement_type:'adjustment',quantity:next-Number(v.originalStock||0),note:'Control room stock adjustment'});
  setEditing(null); setMessage('Inventory updated.'); load();
 }

 return <section className="adminMain"><header className="adminTop"><div><span>SIDE:II / ADMINISTRATION</span><h1>Control <em>room.</em></h1></div><div className="topActions"><Link href="/">View storefront ↗</Link><a className="primaryAction" href="#new-release">＋ New release</a></div></header>
 <section id="overview" className="adminSection"><div className="sectionLabel"><span>01 / OVERVIEW</span><p>Live Supabase catalogue and commerce.</p></div>
 {message&&<p className="dbNotice">{message}</p>}<div className="metricGrid"><article><span>CATALOGUE</span><strong>{String(products.length).padStart(2,'0')}</strong><small>database releases</small></article><article><span>INVENTORY</span><strong>{String(stockUnits).padStart(2,'0')}</strong><small>{reservedUnits} units reserved</small></article><article><span>OPEN ORDERS</span><strong>{String(openOrders).padStart(2,'0')}</strong><small>live order records</small></article><article><span>REVENUE</span><strong>{revenue?money(revenue):'—'}</strong><small>paid orders</small></article></div></section>

 <section id="products" className="adminSection"><div className="sectionLabel"><span>02 / PRODUCTS</span><p>Physical editions from Supabase.</p></div><div className="adminPanel productPanel"><div className="tableHead"><span>EDITION</span><span>FORMAT</span><span>STATUS</span><span>PRICE</span><span>STOCK</span><span>ACTIONS</span></div>
 {loading?<div className="emptyNote">Loading catalogue…</div>:products.length===0?<div className="emptyNote">No database releases yet.</div>:products.map((p,i)=>{const v=p.product_variants?.[0];return <div className="productRow" key={p.id}><div className="editionCell">{p.artwork_path?<img className="adminArtworkThumb" src={supabase.storage.from('release-artwork').getPublicUrl(p.artwork_path).data.publicUrl} alt=""/>:<b>{String(products.length-i).padStart(2,'0')}</b>}<div><strong>{p.title}</strong><small>{p.catalogue_no}</small></div></div><span className="formatPill">{v?.format?.toUpperCase()||'—'}</span><span className="statusDot"><i/>{p.status}</span><span>{v?money(v.price,v.currency):'—'}</span><span>{v?.stock_qty||0}</span><div className="rowActions">{p.is_public&&<Link href={`/releases/${p.slug}`}>VIEW ↗</Link>}<a href="#inventory">STOCK</a><button type="button" className="deleteReleaseButton" disabled={deletingId===p.id} onClick={()=>deleteRelease(p)}>{deletingId===p.id?'DELETING…':'DELETE'}</button></div></div>})}
 <div className="panelAction"><a href="#new-release">＋ ADD PHYSICAL EDITION</a></div></div></section>

 <ReleaseWorkspace onCreated={load}/>

 <section id="orders" className="adminSection twoCol"><div><div className="sectionLabel"><span>03 / ORDERS</span><p>Latest database order activity.</p></div><div className="adminPanel orderList">{orders.length?orders.map(o=><article key={o.id}><div><strong>#SII-{String(o.order_no).padStart(4,'0')}</strong><small>{o.email}</small></div><span>{o.status}</span><b>{money(o.total,o.currency)}</b></article>):<div className="emptyNote">No orders yet. This area is already database-ready.</div>}</div></div>
 <div id="inventory"><div className="sectionLabel"><span>04 / INVENTORY</span><p>Production and stock readiness.</p></div><div className="adminPanel inventoryCard"><div className="inventoryRing"><strong>{stockUnits}</strong><span>UNITS</span></div><div><b>Live inventory connected.</b><p>{variants.length} physical variant · {reservedUnits} reserved.</p><a href="#inventory-list">MANAGE STOCK ↓</a></div></div></div></section>

 <section id="inventory-list" className="adminSection"><div className="sectionLabel"><span>04B / STOCK LEDGER</span><p>Adjust live stock without leaving Control Room.</p></div><div className="adminPanel inventoryList">
 {variants.length===0?<div className="emptyNote">Create a release to start inventory.</div>:variants.map(v=>{const edit=editing?.id===v.id?editing:null;return <div className="inventoryRow" key={v.id}><div><strong>{v.product.title}</strong><small>{v.sku} · {v.format.toUpperCase()}</small></div>{edit?<><label>STOCK<input type="number" min="0" value={edit.stock_qty} onChange={e=>setEditing({...edit,stock_qty:e.target.value})}/></label><label>RESERVED<input type="number" min="0" value={edit.reserved_qty} onChange={e=>setEditing({...edit,reserved_qty:e.target.value})}/></label><label>LOW AT<input type="number" min="0" value={edit.low_stock_threshold} onChange={e=>setEditing({...edit,low_stock_threshold:e.target.value})}/></label><button className="saveButton" onClick={()=>saveStock(edit)}>SAVE</button><button className="ghostButton" onClick={()=>setEditing(null)}>CANCEL</button></>:<><span>{v.stock_qty} IN STOCK</span><span>{v.reserved_qty} RESERVED</span><span>{Number(v.stock_qty)<=Number(v.low_stock_threshold)?'LOW STOCK':'READY'}</span><button className="ghostButton" onClick={()=>setEditing({...v,originalStock:v.stock_qty})}>ADJUST</button></>}</div>})}</div></section>

 <section id="customers" className="adminSection lowerGrid"><article><span>05 / CUSTOMERS</span><h2>Audience,<br/><em>{customers.length?'connected.':'when ready.'}</em></h2><p>{customers.length?`${customers.length} customer record(s) in Supabase.`:'Customer records will appear here after commerce is enabled.'}</p></article><article id="settings"><span>06 / SETTINGS</span><h2>Store<br/><em>configuration.</em></h2><p>Payments, shipping, release defaults and artwork storage are the next commerce layer.</p></article></section><footer className="adminFooter"><span>SIDE:II CONTROL ROOM</span><span>SUPABASE / LIVE</span></footer></section>;
}
