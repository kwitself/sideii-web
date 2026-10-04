'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import ReleaseWorkspace from './ReleaseWorkspace';
import EditReleaseModal from './EditReleaseModal';
import MerchWorkspace from './MerchWorkspace';
import MerchEditor from './MerchEditor';
import DiscountsPanel from './DiscountsPanel';

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
 const [statusSaving,setStatusSaving]=useState(null);
 const [editRelease,setEditRelease]=useState(null);
 const [merchProduct,setMerchProduct]=useState(null),[merchSetup,setMerchSetup]=useState(false);
 const [selectedOrder,setSelectedOrder]=useState(null);
 const [orderSaving,setOrderSaving]=useState(false);
 const [shippingEdit,setShippingEdit]=useState({carrier:'',tracking:''});
 const [shippingSettings,setShippingSettings]=useState({enabled:true,standard_rate:0,vinyl_rate:0,free_shipping_threshold:''});
 const [shippingSaving,setShippingSaving]=useState(false);

 const load=useCallback(async()=>{
  if(!supabase)return;
  setLoading(true); setMessage('');
  const [p,o,c,s]=await Promise.all([
   supabase.from('products').select('id,catalogue_no,slug,title,artist_project,description,imprint,artwork_path,gallery_images,has_shrinkwrap,release_date,credits,tracklist,gallery_paths,status,is_public,product_origin,original_label,original_catalogue_no,barcode,homepage_selected,product_type,merch_category,created_at,updated_at,product_variants(id,sku,format,edition_name,edition_details,price,currency,manufactured_qty,stock_qty,reserved_qty,low_stock_threshold,active,digital_formats,audio_specs,vinyl_size,vinyl_speed,vinyl_weight_g,vinyl_color,option_size,option_color,option_style,weight_g,shipping_class)').order('created_at',{ascending:false}),
   supabase.from('orders').select('id,order_no,email,status,payment_status,subtotal,shipping_total,total,currency,shipping_name,shipping_phone,shipping_address,notes,fulfillment_type,shipping_carrier,tracking_number,shipped_at,created_at,order_items(id,sku,title,format,quantity,unit_price,line_total)').order('created_at',{ascending:false}).limit(8),
   supabase.from('customers').select('id,email,full_name,created_at').order('created_at',{ascending:false}).limit(8),
   supabase.from('shipping_settings').select('enabled,standard_rate,vinyl_rate,free_shipping_threshold').eq('id',1).maybeSingle()
  ]);
  if(p.error){setMessage(p.error.message);setProducts([])}else setProducts(p.data||[]);
  setOrders(o.error?[]:(o.data||[])); setCustomers(c.error?[]:(c.data||[])); if(!s.error&&s.data)setShippingSettings({...s.data,free_shipping_threshold:s.data.free_shipping_threshold??''}); setLoading(false);
  return p.error?[]:(p.data||[]);
 },[]);

 useEffect(()=>{load()},[load]);

 const variants=useMemo(()=>products.flatMap(p=>(p.product_variants||[]).map(v=>({...v,product:p}))),[products]);
 const stockUnits=variants.reduce((s,v)=>s+Number(v.stock_qty||0),0);
 const reservedUnits=variants.reduce((s,v)=>s+Number(v.reserved_qty||0),0);
 const availableUnits=Math.max(0,stockUnits-reservedUnits);
 const openOrders=orders.filter(o=>!['completed','cancelled','refunded'].includes(o.status)).length;
 const revenue=orders.filter(o=>o.payment_status==='paid').reduce((s,o)=>s+Number(o.total||0),0);

 async function changeStatus(p,status){
  setStatusSaving(p.id); setMessage('');
  const isPublic=status==='active'||status==='forthcoming';
  const {error}=await supabase.from('products').update({status,is_public:isPublic}).eq('id',p.id);
  setStatusSaving(null);
  if(error){setMessage(`Status update failed: ${error.message}`);return}
  setMessage(`${p.title} → ${status.toUpperCase()}`);
  await load();
 }

 async function toggleHomepageSelected(p){
  setMessage('');
  const {error}=await supabase.from('products').update({homepage_selected:!p.homepage_selected}).eq('id',p.id);
  if(error){setMessage('Homepage selection failed: '+error.message);return}
  setProducts(prev=>prev.map(x=>x.id===p.id?{...x,homepage_selected:!x.homepage_selected}:x));
  setMessage(p.homepage_selected?p.title+' removed from homepage selection.':p.title+' selected for homepage.');
 }

 async function toggleWrap(p){
  const {error}=await supabase.from('products').update({has_shrinkwrap:!p.has_shrinkwrap}).eq('id',p.id);
  if(error){setMessage(`Finish update failed: ${error.message}`);return}
  await load();
 }

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

 async function updateOrder(order,status,paymentStatus,shipping=null){
  setOrderSaving(true);setMessage('');
  const carrier=shipping?.carrier??order.shipping_carrier??null,tracking=shipping?.tracking??order.tracking_number??null;
  const {error}=await supabase.rpc('admin_update_order',{p_order_id:order.id,p_status:status??null,p_payment_status:paymentStatus??null,p_shipping_carrier:carrier,p_tracking_number:tracking});
  setOrderSaving(false);
  if(error){setMessage(error.message);return}
  const nextStatus=status??order.status,nextPayment=paymentStatus??order.payment_status;
  setMessage('Order #SII-'+String(order.order_no).padStart(4,'0')+' updated.');
  setSelectedOrder(prev=>prev?{...prev,status:nextStatus,payment_status:nextPayment,shipping_carrier:carrier,tracking_number:tracking,shipped_at:nextStatus==='shipped'?(prev.shipped_at||new Date().toISOString()):prev.shipped_at}:prev);
  setOrders(prev=>prev.map(x=>x.id===order.id?{...x,status:nextStatus,payment_status:nextPayment,shipping_carrier:carrier,tracking_number:tracking}:x));
 }

 async function saveShippingSettings(e){
  e.preventDefault();
  if(!supabase)return;
  setShippingSaving(true); setMessage('');
  const payload={enabled:!!shippingSettings.enabled,standard_rate:Math.max(0,Number(shippingSettings.standard_rate)||0),vinyl_rate:Math.max(0,Number(shippingSettings.vinyl_rate)||0),free_shipping_threshold:shippingSettings.free_shipping_threshold===''?null:Math.max(0,Number(shippingSettings.free_shipping_threshold)||0)};
  const {data,error}=await supabase.rpc('admin_save_shipping_settings',{p_enabled:payload.enabled,p_standard_rate:payload.standard_rate,p_vinyl_rate:payload.vinyl_rate,p_free_shipping_threshold:payload.free_shipping_threshold});
  setShippingSaving(false);
  if(error){setMessage('Shipping settings failed: '+error.message);return}
  const saved=Array.isArray(data)?data[0]:data;
  setShippingSettings(saved?{enabled:saved.enabled,standard_rate:saved.standard_rate,vinyl_rate:saved.vinyl_rate,free_shipping_threshold:saved.free_shipping_threshold??''}:{...payload,free_shipping_threshold:payload.free_shipping_threshold??''});
  setMessage('Shipping settings saved.');
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

 return <section className="adminMain"><header className="adminTop"><div><span>SIDE:II / ADMINISTRATION</span><h1>Control <em>room.</em></h1></div><div className="topActions"><Link href="/">View storefront ↗</Link><a href="#new-merch">＋ New merch</a><a className="primaryAction" href="#new-release">＋ New release</a></div></header>
 <section id="overview" className="adminSection"><div className="sectionLabel"><span>01 / OVERVIEW</span><p>Live Supabase catalogue and commerce.</p></div>
 {message&&<p className="dbNotice">{message}</p>}<div className="metricGrid"><article><span>CATALOGUE</span><strong>{String(products.length).padStart(2,'0')}</strong><small>database releases</small></article><article><span>INVENTORY</span><strong>{String(stockUnits).padStart(2,'0')}</strong><small>{reservedUnits} units reserved</small></article><article><span>OPEN ORDERS</span><strong>{String(openOrders).padStart(2,'0')}</strong><small>live order records</small></article><article><span>REVENUE</span><strong>{revenue?money(revenue):'—'}</strong><small>paid orders</small></article></div></section>

 <section id="products" className="adminSection"><div className="sectionLabel"><span>02 / PRODUCTS</span><p>Physical editions from Supabase.</p></div><div className="adminPanel productPanel"><div className="tableHead"><span>EDITION</span><span>FORMAT</span><span>STATUS</span><span>PRICE</span><span>STOCK</span><span>ACTIONS</span></div>
 {loading?<div className="emptyNote">Loading catalogue…</div>:products.length===0?<div className="emptyNote">No database releases yet.</div>:products.map((p,i)=>{const v=p.product_variants?.[0],vc=p.product_variants?.length||0;return <div className="productRow" key={p.id}><div className="editionCell">{p.artwork_path?<img className="adminArtworkThumb" src={supabase.storage.from('release-artwork').getPublicUrl(p.artwork_path).data.publicUrl} alt=""/>:<b>{String(products.length-i).padStart(2,'0')}</b>}<div><strong>{p.title}</strong><small>{p.product_origin==='distributed'?(p.original_catalogue_no||p.catalogue_no):p.catalogue_no} · {p.product_origin==='distributed'?(p.original_label||'SELECTED'):(p.imprint==='lethargia'?'LETHARGIA':'SIDE:II')}</small></div></div><span className="formatPill">{p.product_type==='merch'?(p.merch_category?.toUpperCase()||'MERCH'):(vc>1?`${vc} EDITIONS`:(v?.format?.toUpperCase()||'—'))}</span><select className="statusSelect" value={p.status} disabled={statusSaving===p.id} onChange={e=>changeStatus(p,e.target.value)}><option value="draft">DRAFT</option><option value="forthcoming">FORTHCOMING</option><option value="active">AVAILABLE</option><option value="archived">ARCHIVED</option></select><span>{vc>1?'VARIES':(v?money(v.price,v.currency):'—')}</span><span>{(p.product_variants||[]).reduce((s,x)=>s+Number(x.stock_qty||0),0)}</span><div className="rowActions">{p.is_public&&<Link href={p.product_type==='merch'?(`/store/${p.slug}`):(`/releases/${p.slug}`)}>VIEW ↗</Link>}<button type="button" className="editReleaseButton" onClick={(e)=>{e.preventDefault();e.stopPropagation();if(p.product_type==='merch')setMerchProduct({...p});else setEditRelease({...p});}}>EDIT</button><a href="#inventory">STOCK</a>{p.product_type!=='merch'&&<button type="button" className={'selectedMiniButton '+(p.homepage_selected?'active':'')} onClick={()=>toggleHomepageSelected(p)}>{p.homepage_selected?'SELECTED ✓':'SELECT'}</button>}<button type="button" className="finishMiniButton" onClick={()=>toggleWrap(p)}>{p.has_shrinkwrap?'WRAP ✓':'WRAP'}</button><button type="button" className="deleteReleaseButton" disabled={deletingId===p.id} onClick={()=>deleteRelease(p)}>{deletingId===p.id?'DELETING…':'DELETE'}</button></div></div>})}
 <div className="panelAction"><a href="#new-release">＋ ADD PHYSICAL EDITION</a></div></div></section>

 <ReleaseWorkspace onCreated={load}/>
 <MerchWorkspace onCreated={load} onContinue={product=>{setMerchSetup(true);setMerchProduct(product)}}/>

 <section id="orders" className="adminSection twoCol"><div><div className="sectionLabel"><span>03 / ORDERS</span><p>Live orders, payment and fulfilment.</p></div><div className="adminPanel orderList">{orders.length?orders.map(o=><article className="orderRow" key={o.id} onClick={()=>{setSelectedOrder(o);setShippingEdit({carrier:o.shipping_carrier||'',tracking:o.tracking_number||''})}}><div><strong>#SII-{String(o.order_no).padStart(4,'0')}</strong><small>{o.email} · {o.fulfillment_type?.toUpperCase()}</small></div><span>{o.payment_status} / {o.status}</span><b>{money(o.total,o.currency)}</b></article>):<div className="emptyNote">No orders yet.</div>}</div></div>
 <div id="inventory"><div className="sectionLabel"><span>04 / INVENTORY</span><p>Production and stock readiness.</p></div><div className="adminPanel inventoryCard"><div className="inventoryRing"><strong>{stockUnits}</strong><span>UNITS</span></div><div><b>Live inventory connected.</b><p>{variants.length} physical variant · {reservedUnits} reserved.</p><a href="#inventory-list">MANAGE STOCK ↓</a></div></div></div></section>

 <section id="inventory-list" className="adminSection"><div className="sectionLabel"><span>04B / STOCK LEDGER</span><p>Adjust live stock without leaving Control Room.</p></div><div className="adminPanel inventoryList">
 {variants.length===0?<div className="emptyNote">Create a release to start inventory.</div>:variants.map(v=>{const edit=editing?.id===v.id?editing:null;return <div className="inventoryRow" key={v.id}><div><strong>{v.product.title}</strong><small>{v.sku} · {v.format.toUpperCase()}</small></div>{edit?<><label>STOCK<input type="number" min="0" value={edit.stock_qty} onChange={e=>setEditing({...edit,stock_qty:e.target.value})}/></label><label>RESERVED<input type="number" min="0" value={edit.reserved_qty} onChange={e=>setEditing({...edit,reserved_qty:e.target.value})}/></label><label>LOW AT<input type="number" min="0" value={edit.low_stock_threshold} onChange={e=>setEditing({...edit,low_stock_threshold:e.target.value})}/></label><button className="saveButton" onClick={()=>saveStock(edit)}>SAVE</button><button className="ghostButton" onClick={()=>setEditing(null)}>CANCEL</button></>:<><span>{Math.max(0,Number(v.stock_qty||0)-Number(v.reserved_qty||0))} AVAILABLE</span><span>{v.reserved_qty} RESERVED / {v.stock_qty} TOTAL</span><span>{Math.max(0,Number(v.stock_qty||0)-Number(v.reserved_qty||0))<=Number(v.low_stock_threshold)?'LOW STOCK':'READY'}</span><button className="ghostButton" onClick={()=>setEditing({...v,originalStock:v.stock_qty})}>ADJUST</button></>}</div>})}</div></section>

 <section id="customers" className="adminSection adminSectionStandalone"><div className="lowerGrid singleAdminCard"><article><span>05 / CUSTOMERS</span><h2>Audience,<br/><em>{customers.length?'connected.':'when ready.'}</em></h2><p>{customers.length?`${customers.length} customer record(s) in Supabase.`:'Customer records will appear here after commerce is enabled.'}</p></article></div></section><DiscountsPanel/>
<section id="settings" className="adminSection adminSectionStandalone"><div className="lowerGrid singleAdminCard"><article><span>07 / SETTINGS</span><h2>Shipping<br/><em>configuration.</em></h2><p>Carrier-independent rates. A contracted carrier/API can be connected later without changing checkout.</p><form className="shippingSettings" onSubmit={saveShippingSettings}><label className="shippingToggle"><input type="checkbox" checked={!!shippingSettings.enabled} onChange={e=>setShippingSettings({...shippingSettings,enabled:e.target.checked})}/><span>SHIPPING CALCULATION ACTIVE</span></label><div className="shippingFields"><label><span>CD / CASSETTE RATE · ₺</span><input type="number" min="0" step="0.01" inputMode="decimal" value={shippingSettings.standard_rate} onChange={e=>setShippingSettings({...shippingSettings,standard_rate:e.target.value})}/></label><label><span>VINYL RATE · ₺</span><input type="number" min="0" step="0.01" inputMode="decimal" value={shippingSettings.vinyl_rate} onChange={e=>setShippingSettings({...shippingSettings,vinyl_rate:e.target.value})}/></label><label><span>FREE SHIPPING FROM · ₺</span><input type="number" min="0" step="0.01" inputMode="decimal" placeholder="NO THRESHOLD" value={shippingSettings.free_shipping_threshold} onChange={e=>setShippingSettings({...shippingSettings,free_shipping_threshold:e.target.value})}/></label></div><button className="saveButton" disabled={shippingSaving}>{shippingSaving?'SAVING…':'SAVE SHIPPING'}</button></form></article></div></section>{selectedOrder&&<div className="orderOverlay" onMouseDown={e=>{if(e.target===e.currentTarget)setSelectedOrder(null)}}><section className="orderModal"><header><div><span>ORDER / #SII-{String(selectedOrder.order_no).padStart(4,'0')}</span><h2>{selectedOrder.shipping_name||selectedOrder.email}</h2></div><button onClick={()=>setSelectedOrder(null)}>CLOSE ×</button></header><div className="orderDetailGrid"><div><span>CUSTOMER</span><b>{selectedOrder.email}</b><p>{selectedOrder.shipping_phone||'—'}</p></div><div><span>FULFILMENT</span><b>{selectedOrder.fulfillment_type?.toUpperCase()}</b><p>{selectedOrder.shipping_address?Object.values(selectedOrder.shipping_address).filter(Boolean).join(' · '):'Digital delivery'}</p></div></div><div className="orderItems">{(selectedOrder.order_items||[]).map(i=><article key={i.id}><div><b>{i.title}</b><small>{i.sku} · {i.format.toUpperCase()} · QTY {i.quantity}</small></div><strong>{money(i.line_total,selectedOrder.currency)}</strong></article>)}</div><div className="orderTotal"><span>TOTAL</span><strong>{money(selectedOrder.total,selectedOrder.currency)}</strong></div><div className="orderControls"><label>PAYMENT<select value={selectedOrder.payment_status} disabled={orderSaving} onChange={e=>updateOrder(selectedOrder,null,e.target.value)}><option value="unpaid">UNPAID</option><option value="paid">PAID</option><option value="refunded">REFUNDED</option></select></label><label>ORDER STATUS<select value={selectedOrder.status} disabled={orderSaving||selectedOrder.status==='completed'} onChange={e=>updateOrder(selectedOrder,e.target.value,null,shippingEdit)}><option value="pending" disabled={selectedOrder.status!=='pending'}>PENDING</option><option value="preparing" disabled={selectedOrder.payment_status!=='paid'||!['pending','preparing'].includes(selectedOrder.status)}>PREPARING</option><option value="shipped" disabled={selectedOrder.status!=='preparing'||selectedOrder.payment_status!=='paid'||!shippingEdit.carrier||!shippingEdit.tracking.trim()}>SHIPPED</option><option value="completed" disabled={selectedOrder.status!=='shipped'||selectedOrder.payment_status!=='paid'}>COMPLETED</option><option value="cancelled" disabled={selectedOrder.status==='completed'}>CANCELLED</option><option value="refunded" disabled={selectedOrder.payment_status!=='paid'||selectedOrder.status==='completed'}>REFUNDED</option></select></label></div>{['shipping','mixed'].includes(selectedOrder.fulfillment_type)&&<div className="orderControls shippingTracking"><label>CARRIER<select value={shippingEdit.carrier} onChange={e=>setShippingEdit({...shippingEdit,carrier:e.target.value})}><option value="">SELECT CARRIER</option><option value="Yurtiçi Kargo">YURTİÇİ KARGO</option><option value="Aras Kargo">ARAS KARGO</option><option value="MNG Kargo">MNG KARGO</option><option value="Sürat Kargo">SÜRAT KARGO</option><option value="PTT Kargo">PTT KARGO</option><option value="Hepsijet">HEPSİJET</option><option value="Diğer">DİĞER</option></select></label><label>TRACKING NUMBER<input value={shippingEdit.tracking} placeholder="Required for SHIPPED" onChange={e=>setShippingEdit({...shippingEdit,tracking:e.target.value})}/></label><button type="button" className="saveButton" disabled={orderSaving} onClick={()=>updateOrder(selectedOrder,null,null,shippingEdit)}>SAVE SHIPPING</button></div>}{selectedOrder.shipped_at&&<p className="orderNotes">SHIPPED · {new Date(selectedOrder.shipped_at).toLocaleString('tr-TR')}</p>}{selectedOrder.notes&&<p className="orderNotes">{selectedOrder.notes}</p>}</section></div>}{editRelease&&<EditReleaseModal product={editRelease} onClose={()=>setEditRelease(null)} onSaved={load}/>} {merchProduct&&<MerchEditor key={merchProduct.id+':'+(merchProduct.updated_at||'')} product={merchProduct} setupMode={merchSetup} onClose={()=>{setMerchProduct(null);setMerchSetup(false)}} onSaved={async()=>{const keepId=merchProduct.id;const fresh=await load();setMerchProduct((fresh||[]).find(x=>x.id===keepId)||null)}}/>}<footer className="adminFooter"><span>SIDE:II CONTROL ROOM</span><span>SUPABASE / LIVE</span></footer></section>;
}
