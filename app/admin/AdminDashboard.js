'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import {isQaFixture, inventorySummary, updateStockSafely} from '../lib/adminSafety';
import useAdminDialog from './useAdminDialog';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
const ReleaseWorkspace=dynamic(()=>import('./ReleaseWorkspace'),{loading:()=> <p className="emptyNote" role="status">Loading workspace…</p>});
const EditReleaseModal=dynamic(()=>import('./EditReleaseModal'),{loading:()=> <p className="emptyNote" role="status">Loading workspace…</p>});
const MerchWorkspace=dynamic(()=>import('./MerchWorkspace'),{loading:()=> <p className="emptyNote" role="status">Loading workspace…</p>});
const MerchEditor=dynamic(()=>import('./MerchEditor'),{loading:()=> <p className="emptyNote" role="status">Loading workspace…</p>});
const DiscountsPanel=dynamic(()=>import('./DiscountsPanel'),{loading:()=> <p className="emptyNote" role="status">Loading workspace…</p>});
const CommerceOpsPanel=dynamic(()=>import('./CommerceOpsPanel'),{loading:()=> <p className="emptyNote" role="status">Loading workspace…</p>});
const CommerceExpansionPanel=dynamic(()=>import('./CommerceExpansionPanel'),{loading:()=> <p className="emptyNote" role="status">Loading workspace…</p>});
const ImpactPanel=dynamic(()=>import('./ImpactPanel'),{loading:()=> <p className="emptyNote" role="status">Loading workspace…</p>});
const CatalogueOpsPanel=dynamic(()=>import('./CatalogueOpsPanel'),{loading:()=> <p className="emptyNote" role="status">Loading workspace…</p>});
const MerchandisingPanel=dynamic(()=>import('./MerchandisingPanel'),{loading:()=> <p className="emptyNote" role="status">Loading workspace…</p>});
const ProductPreviewPanel=dynamic(()=>import('./ProductPreviewPanel'),{loading:()=> <p className="emptyNote" role="status">Loading workspace…</p>});
const SeoControlCenter=dynamic(()=>import('./SeoControlCenter'),{loading:()=> <p className="emptyNote" role="status">Loading workspace…</p>});
const EmailStudio=dynamic(()=>import('./EmailStudio'),{loading:()=> <p className="emptyNote" role="status">Loading workspace…</p>});
const GrowthOpsPanel=dynamic(()=>import('./GrowthOpsPanel'),{loading:()=> <p className="emptyNote" role="status">Loading workspace…</p>});
const ValueOpsPanel=dynamic(()=>import('./ValueOpsPanel'),{loading:()=> <p className="emptyNote" role="status">Loading workspace…</p>});
const LocalizationOpsPanel=dynamic(()=>import('./LocalizationOpsPanel'),{loading:()=> <p className="emptyNote" role="status">Loading workspace…</p>});
const FulfillmentMediaOpsPanel=dynamic(()=>import('./FulfillmentMediaOpsPanel'),{loading:()=> <p className="emptyNote" role="status">Loading workspace…</p>});
const LaunchReadinessPanel=dynamic(()=>import('./LaunchReadinessPanel'),{loading:()=> <p className="emptyNote" role="status">Loading workspace…</p>});
const AdminAnalyticsPanel=dynamic(()=>import('./AdminAnalyticsPanel'),{loading:()=> <p className="emptyNote" role="status">Loading workspace…</p>});
const FinanceAccountingPanel=dynamic(()=>import('./FinanceAccountingPanel'),{loading:()=> <p className="emptyNote" role="status">Loading workspace…</p>});
const WearOpsPanel=dynamic(()=>import('./WearOpsPanel'),{loading:()=> <p className="emptyNote" role="status">Loading workspace…</p>});
import MerchMockupPreview from '../components/MerchMockupPreview';
import {evaluateProductQa} from '../lib/productQa';

function adminMockupProduct(p){
 const items=Array.isArray(p?.gallery_images)?p.gallery_images:[];
 const front=items.find(x=>x?.mockup?.side==='front')?.mockup||null;
 const back=items.find(x=>x?.mockup?.side==='back')?.mockup||null;
 return {...p,merchCategory:p?.merch_category,mockups:{front,back}};
}

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
 const [loadError,setLoadError]=useState('');
 const [orderCount,setOrderCount]=useState(0),[customerCount,setCustomerCount]=useState(0);
 const [stockSaving,setStockSaving]=useState(false);
 const [moreLoading,setMoreLoading]=useState(false);
 const [message,setMessage]=useState('');
 const [editing,setEditing]=useState(null);
 const [deletingId,setDeletingId]=useState(null);
 const [statusSaving,setStatusSaving]=useState(null);
 const [editRelease,setEditRelease]=useState(null);
 const [merchProduct,setMerchProduct]=useState(null),[merchSetup,setMerchSetup]=useState(false);
 const [selectedOrder,setSelectedOrder]=useState(null);
 const [orderSaving,setOrderSaving]=useState(false);
 const [iyziRef,setIyziRef]=useState('');
 const [shippingEdit,setShippingEdit]=useState({carrier:'',tracking:''});
 const [shippingSettings,setShippingSettings]=useState({enabled:true,international_enabled:false,standard_rate:0,vinyl_rate:0,free_shipping_threshold:''});
 const [shippingSaving,setShippingSaving]=useState(false);
 const [activeView,setActiveView]=useState('overview');
 const [productView,setProductView]=useState('all');
 const [productSearch,setProductSearch]=useState('');
 const [productStatusFilter,setProductStatusFilter]=useState('all');
 const [productTypeFilter,setProductTypeFilter]=useState('all');
 const [selectedProductIds,setSelectedProductIds]=useState([]);
 const [bulkSaving,setBulkSaving]=useState(false);
 const [previewProductId,setPreviewProductId]=useState(null);
 const [qaReport,setQaReport]=useState(null);

 const load=useCallback(async()=>{
  if(!supabase){setLoading(false);return;}
  setLoading(true); setLoadError('');
  try {
  const [p,o,c,s]=await Promise.all([
   supabase.from('products').select('id,catalogue_no,slug,title,artist_project,description,imprint,artwork_path,gallery_images,has_shrinkwrap,release_date,credits,tracklist,status,is_public,product_origin,original_label,original_catalogue_no,barcode,homepage_selected,storefront_config,seo_config,commerce_config,product_type,merch_category,created_at,updated_at,product_variants(id,sku,format,edition_name,edition_details,price,currency,manufactured_qty,stock_qty,reserved_qty,low_stock_threshold,active,digital_formats,audio_specs,vinyl_size,vinyl_speed,vinyl_weight_g,vinyl_color,option_size,option_color,option_style,weight_g,shipping_class,preorder_enabled,preorder_limit,preorder_target,preorder_deadline,edition_numbering_enabled,edition_total,next_edition_number,digital_download_url,iyzilink_url,iyzilink_amount)').order('created_at',{ascending:false}),
   supabase.from('orders').select('id,order_no,email,status,payment_status,subtotal,discount_total,promo_code,shipping_total,support_total,total,currency,shipping_name,shipping_phone,shipping_address,notes,fulfillment_type,shipping_carrier,tracking_number,shipped_at,created_at,invoice_type,invoice_company,invoice_tax_office,invoice_tax_number,invoice_address,is_gift,gift_message,hide_prices,gift_recipient_email,gift_delivery_at,gift_wrap,gift_notified_at,gift_public_token,order_items(id,sku,title,format,quantity,unit_price,line_total,support_amount,preorder,edition_numbers)',{count:'exact'}).order('created_at',{ascending:false}).limit(50),
   supabase.from('customers').select('id,email,full_name,created_at',{count:'exact'}).order('created_at',{ascending:false}).limit(50),
   supabase.from('shipping_settings').select('enabled,international_enabled,standard_rate,vinyl_rate,free_shipping_threshold').eq('id',1).maybeSingle()
  ]);
  const failures=[[p,'Catalogue'],[o,'Orders'],[c,'Customers'],[s,'Shipping']].filter(([result])=>result.error).map(([result,label])=>label+': '+result.error.message);
  setLoadError(failures.join(' · '));
  if(!p.error)setProducts(p.data||[]);
  setOrderCount(o.count||0);setCustomerCount(c.count||0);
  setOrders(o.error?[]:(o.data||[])); setCustomers(c.error?[]:(c.data||[])); if(!s.error&&s.data)setShippingSettings({...s.data,free_shipping_threshold:s.data.free_shipping_threshold??''}); setLoading(false);
  return p.error?[]:(p.data||[]);
  } catch(error){setLoadError('Could not load administration data: '+(error?.message||'Network error'));return [];}
  finally{setLoading(false);}
 },[]);
 async function loadMore(kind){
  setMoreLoading(true);
  try {
   const existing=kind==='orders'?orders:customers;
   const fields=kind==='orders'?'*,order_items(*)':'id,email,full_name,created_at';
   const {data,error}=await supabase.from(kind).select(fields).order('created_at',{ascending:false}).range(existing.length,existing.length+49);
   if(error)throw error;
   const merge=prev=>[...new Map([...prev,...(data||[])].map(row=>[row.id,row])).values()];
   if(kind==='orders')setOrders(merge);else setCustomers(merge);
  } catch(error){setLoadError(error.message||'Could not load more records.');}
  finally{setMoreLoading(false);}
 }

 useEffect(()=>{load()},[load]);
 const orderDialogRef=useAdminDialog(!!selectedOrder,()=>{if(!orderSaving)setSelectedOrder(null)});
 const qaDialogRef=useAdminDialog(!!qaReport,()=>setQaReport(null));
 useEffect(()=>{
  const allowed=new Set(['overview','products','preview','merchandising','orders','inventory','customers','commerce','catalogue','growth','impact','fulfillment','localization','settings','launch','seo','emails','finance']);
  const initial=String(window.location.hash||'').replace('#','');
  const remembered=window.localStorage.getItem('sideii-admin-last-view');
  const resolved=allowed.has(initial)?initial:allowed.has(remembered)?remembered:'overview';
  setActiveView(resolved);
  const onView=e=>{if(allowed.has(e?.detail)){setActiveView(e.detail);window.localStorage.setItem('sideii-admin-last-view',e.detail)}};
  window.addEventListener('sideii-admin-view',onView);
  return()=>window.removeEventListener('sideii-admin-view',onView);
 },[]);
 const openAdminView=(view,sub=null)=>{setActiveView(view);window.localStorage.setItem('sideii-admin-last-view',view);if(sub)setProductView(sub);history.replaceState(null,'','#'+view);window.dispatchEvent(new CustomEvent('sideii-admin-view',{detail:view}));window.scrollTo({top:0,behavior:'smooth'})};

 const variants=useMemo(()=>products.flatMap(p=>(p.product_variants||[]).map(v=>({...v,product:p}))),[products]);
 const inventory=useMemo(()=>inventorySummary(variants),[variants]);
 const {physical:physicalVariants,stock:stockUnits,reserved:reservedUnits,available:availableUnits,low:lowStockVariants}=inventory;
 const openOrders=orders.filter(o=>!['completed','cancelled','refunded'].includes(o.status)).length;
 const revenue=orders.filter(o=>o.payment_status==='paid'&&o.currency==='TRY').reduce((s,o)=>s+Number(o.total||0),0);
 const qaSummary=useMemo(()=>products.reduce((acc,p)=>{const qa=evaluateProductQa(p);acc[qa.state.toLowerCase()]++;acc.total++;return acc},{ready:0,warning:0,blocked:0,total:0}),[products]);
 const visibleProducts=useMemo(()=>products.filter(p=>{
  const q=productSearch.trim().toLowerCase();
  const text=[p.title,p.catalogue_no,p.original_catalogue_no,p.artist_project,p.merch_category,p.imprint].filter(Boolean).join(' ').toLowerCase();
  const searchOk=!q||text.includes(q);
  const statusOk=productStatusFilter==='all'||p.status===productStatusFilter;
  const typeOk=productTypeFilter==='all'||(productTypeFilter==='merch'?p.product_type==='merch':p.product_type!=='merch');
  return searchOk&&statusOk&&typeOk;
 }),[products,productSearch,productStatusFilter,productTypeFilter]);

 function openQa(product){setQaReport({product,qa:evaluateProductQa(product)})}

 async function bulkProductAction(action){
  const ids=selectedProductIds.filter(Boolean);
  if(!ids.length)return;
  setBulkSaving(true);setMessage('');
  try{
   if(['active','draft','archived','forthcoming'].includes(action)){
    if(action==='active'||action==='forthcoming'){
     const fixtures=products.filter(p=>ids.includes(p.id)&&isQaFixture(p));
     if(fixtures.length){setMessage('QA test products cannot be publicly published through bulk actions.');setBulkSaving(false);return}
     const blocked=products.filter(p=>ids.includes(p.id)).map(p=>({product:p,qa:evaluateProductQa(p,action)})).filter(x=>!x.qa.ready);
     if(blocked.length){setMessage(blocked.length+' selected product(s) blocked by QA. Run QA before publishing.');setQaReport(blocked[0]);setBulkSaving(false);return}
    }
    if((action==='active'||action==='forthcoming')&&!window.confirm('Publish '+ids.length+' selected products publicly?')){setBulkSaving(false);return}
    const isPublic=action==='active'||action==='forthcoming';
    const {error}=await supabase.from('products').update({status:action,is_public:isPublic}).in('id',ids);
    if(error)throw error;
   }else if(['google-on','google-off','store-on','store-off'].includes(action)){
    const key=action.startsWith('google')?'google':'store';
    const enabled=action.endsWith('on');
    for(const id of ids){
     const p=products.find(x=>x.id===id);
     const cfg=p?.storefront_config||{};
     const visibility={...(cfg.visibility||{}),[key]:enabled};
     const {error}=await supabase.from('products').update({storefront_config:{...cfg,visibility}}).eq('id',id);
     if(error)throw error;
    }
   }
   setMessage(ids.length+' product(s) updated.');
   setSelectedProductIds([]);
   await load();
  }catch(err){setMessage('Bulk update failed: '+(err?.message||'Unknown error'))}
  finally{setBulkSaving(false)}
 }

 async function changeStatus(p,status){
  if(status==='active'||status==='forthcoming'){
   if(isQaFixture(p)){setMessage('QA test fixtures must remain hidden from the public storefront.');return}
   const qa=evaluateProductQa(p,status);
   if(!qa.ready){setQaReport({product:p,qa});setMessage('Publish blocked: '+qa.blockers.length+' blocker(s) must be fixed.');return}
   if(!window.confirm('Publish '+p.title+' publicly as '+status.toUpperCase()+'?'+(qa.warnings.length?' '+qa.warnings.length+' warning(s) remain.':'')))return;
  }
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
  if(isQaFixture(p)){setMessage('QA test fixtures are retained for regression testing and cannot be deleted here.');return;}
  const ok=window.confirm(`Delete "${p.title}"? This permanently removes the release, its variants and artwork. This cannot be undone.`);
  if(!ok)return;
  setDeletingId(p.id); setMessage('');
  try{
   const {error}=await supabase.from('products').delete().eq('id',p.id);
   if(error) throw error;
   if(p.artwork_path){const {error:storageError}=await supabase.storage.from('release-artwork').remove([p.artwork_path]);if(storageError)setMessage('Product removed; artwork cleanup needs retry: '+storageError.message);else setMessage('Release deleted.');}else setMessage('Release deleted.');
   await load();
  }catch(err){
   setMessage(`Delete failed: ${err?.message||'Unknown error'}`);
  }finally{setDeletingId(null)}
 }

 async function updateOrder(order,status,paymentStatus,shipping=null){
  setOrderSaving(true);setMessage('');
  const carrier=shipping?.carrier??order.shipping_carrier??null,tracking=shipping?.tracking??order.tracking_number??null;
  const targetStatus=status??order.status;
  if(targetStatus==='shipped'&&['shipping','mixed'].includes(order.fulfillment_type)){
   if(!String(carrier||'').trim()||!String(tracking||'').trim()){
    setOrderSaving(false);
    setMessage('Enter carrier and tracking number before marking SHIPPED.');
    return;
   }
  }
  if(paymentStatus!==null&&paymentStatus!==undefined&&paymentStatus!==order.payment_status){setOrderSaving(false);setMessage('Payment status is provider-controlled. Use the verified payment flow.');return}
  const {error}=await supabase.rpc('admin_update_order_state',{p_order_id:order.id,p_status:status??null,p_shipping_carrier:carrier,p_tracking_number:tracking});
  setOrderSaving(false);
  if(error){setMessage(error.message);return}
  const nextStatus=status??order.status,nextPayment=order.payment_status;
  setMessage('Order #SII-'+String(order.order_no).padStart(4,'0')+' updated.');
  setSelectedOrder(prev=>prev?{...prev,status:nextStatus,payment_status:nextPayment,shipping_carrier:carrier,tracking_number:tracking,shipped_at:nextStatus==='shipped'?(prev.shipped_at||new Date().toISOString()):prev.shipped_at}:prev);
  setOrders(prev=>prev.map(x=>x.id===order.id?{...x,status:nextStatus,payment_status:nextPayment,shipping_carrier:carrier,tracking_number:tracking}:x));
  const mailType=(status&&['preparing','shipped','completed'].includes(nextStatus))?nextStatus:null;
  if(mailType){try{const {data:sessionData}=await supabase.auth.getSession();const token=sessionData.session?.access_token;if(token)fetch('/api/orders/notify-v2',{method:'POST',headers:{'content-type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({order_id:order.id,type:mailType})})}catch{}}
 }

 async function confirmIyziLink(order,action){
  const reference=iyziRef.trim();
  if(!reference){setMessage('Enter the iyzico transaction/reference first.');return}
  const label=action==='paid'?'confirm this iyzico Link payment':'confirm this iyzico Link refund';
  if(!window.confirm('Are you sure you want to '+label+'?'))return;
  setOrderSaving(true);setMessage('');
  const {data,error}=await supabase.rpc('admin_record_iyzilink_event',{p_order_id:order.id,p_action:action,p_reference:reference});
  setOrderSaving(false);
  if(error){setMessage(error.message);return}
  const nextPayment=data?.payment_status||(action==='paid'?'paid':'refunded');
  const nextStatus=data?.status||(action==='refunded'?'refunded':order.status);
  setSelectedOrder(prev=>prev?{...prev,payment_status:nextPayment,status:nextStatus}:prev);
  setOrders(prev=>prev.map(x=>x.id===order.id?{...x,payment_status:nextPayment,status:nextStatus}:x));
  setIyziRef('');
  setMessage(action==='paid'?'iyzico Link payment confirmed.':'iyzico Link refund confirmed.');
  if(action==='paid'){
   try{
    const {data:sessionData}=await supabase.auth.getSession();
    const token=sessionData.session?.access_token;
    if(token)fetch('/api/orders/notify-v2',{method:'POST',headers:{'content-type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({order_id:order.id,type:'paid'})});
   }catch{}
  }
 }

 async function saveShippingSettings(e){
  e.preventDefault();if(!supabase||shippingSaving)return;
  setShippingSaving(true);setMessage('');
  try{
   const values=[shippingSettings.standard_rate,shippingSettings.vinyl_rate,...(shippingSettings.free_shipping_threshold===''?[]:[shippingSettings.free_shipping_threshold])];
   if(values.some(v=>v===''||!Number.isFinite(Number(v))||Number(v)<0))throw new Error('Shipping rates must be non-negative numbers.');
   const payload={enabled:!!shippingSettings.enabled,international_enabled:!!shippingSettings.international_enabled,standard_rate:Number(shippingSettings.standard_rate),vinyl_rate:Number(shippingSettings.vinyl_rate),free_shipping_threshold:shippingSettings.free_shipping_threshold===''?null:Number(shippingSettings.free_shipping_threshold)};
   const {data,error}=await supabase.rpc('admin_save_shipping_settings',{p_enabled:payload.enabled,p_standard_rate:payload.standard_rate,p_vinyl_rate:payload.vinyl_rate,p_free_shipping_threshold:payload.free_shipping_threshold,p_international_enabled:payload.international_enabled});
   if(error)throw error;
   const saved=Array.isArray(data)?data[0]:data;
   setShippingSettings({...payload,...(saved||{}),free_shipping_threshold:saved?.free_shipping_threshold??payload.free_shipping_threshold??''});
   const rates=await Promise.all([
    supabase.rpc('admin_save_shipping_class_rate',{p_code:'standard',p_rate:payload.standard_rate,p_active:true}),
    supabase.rpc('admin_save_shipping_class_rate',{p_code:'vinyl',p_rate:payload.vinyl_rate,p_active:true})
   ]);
   const failures=rates.filter(x=>x.error);
   if(failures.length)throw new Error('Settings saved, but shipping class rates need a retry: '+failures.map(x=>x.error.message).join(' · '));
   setMessage('Shipping settings and class rates saved.');
  }catch(error){setMessage('Shipping settings: '+(error.message||'Save failed.'));}finally{setShippingSaving(false);}
 }

 async function saveStock(v){
  if(stockSaving)return;
  setStockSaving(true);setMessage('');
  try{
   const {stock,ledgerError}=await updateStockSafely(supabase,v);
   let notificationWarning='';
   if(stock>Number(v.originalStock)){try{const {data}=await supabase.auth.getSession();if(!data.session?.access_token)throw new Error('Session unavailable');const response=await fetch('/api/waitlist/notify',{method:'POST',headers:{'content-type':'application/json',Authorization:'Bearer '+data.session.access_token},body:JSON.stringify({variant_id:v.id})});if(!response.ok)throw new Error('Notification request failed');}catch{notificationWarning=' Back-in-stock notification could not be requested.';}}
   setEditing(null);
   setMessage((ledgerError?'Stock saved, but movement logging failed: '+ledgerError.message:'Inventory updated.')+notificationWarning);
   await load();
  }catch(error){setMessage(error.message||'Inventory update failed.');}
  finally{setStockSaving(false);}
 }

 return <section className="adminMain"><header className="adminTop"><div><span>SIDE:II / ADMINISTRATION · {activeView.toUpperCase()}</span><h1>Control <em>room.</em></h1></div><div className="topActions"><button type="button" onClick={()=>openAdminView('seo')}>SEO AUDIT ↗</button><Link href="/">View storefront ↗</Link><button type="button" onClick={()=>openAdminView('products','merch')}>+ New merch</button><button type="button" className="primaryAction" onClick={()=>openAdminView('products','release')}>+ New release</button></div></header>
 {loadError&&<p className="dbNotice" role="alert">{loadError} <button type="button" onClick={load} disabled={loading}>RETRY</button></p>}
 {message&&<p className="dbNotice" role="status">{message}</p>}
 {activeView==='overview'&&<section id="overview" className="adminSection adminViewSection"><div className="sectionLabel"><span>01 / OVERVIEW</span><p>Live Supabase catalogue and commerce.</p></div>
 <div className="metricGrid overviewMetricGrid"><article><span>CATALOGUE</span><strong>{String(products.length).padStart(2,'0')}</strong><small>database releases</small></article><article><span>INVENTORY</span><strong>{String(stockUnits).padStart(2,'0')}</strong><small>{reservedUnits} units reserved</small></article><article><span>LOADED OPEN ORDERS</span><strong>{String(openOrders).padStart(2,'0')}</strong><small>{orders.length} of {orderCount} orders loaded</small></article><article><span>LOADED PAID REVENUE</span><strong>{revenue?money(revenue):'—'}</strong><small>TRY · loaded orders; full report below</small></article></div><AdminAnalyticsPanel products={products}/><div className="dashboardPanels"><article><header><span>RECENT ORDERS</span><button type="button" onClick={()=>openAdminView('orders')}>VIEW ALL →</button></header>{orders.slice(0,4).map(o=><div className="dashboardLine" key={o.id}><div><b>#SII-{String(o.order_no).padStart(4,'0')}</b><small>{o.email}</small></div><span>{o.status?.toUpperCase()}</span><strong>{money(o.total,o.currency)}</strong></div>)}{orders.length===0&&<p className="emptyNote">No orders yet.</p>}</article><article><header><span>LOW STOCK</span><button type="button" onClick={()=>openAdminView('inventory')}>OPEN INVENTORY →</button></header>{lowStockVariants.slice(0,5).map(v=><div className="dashboardLine" key={v.id}><div><b>{v.product.title}</b><small>{v.sku}</small></div><span>LOW</span><strong>{Math.max(0,Number(v.stock_qty||0)-Number(v.reserved_qty||0))}</strong></div>)}{lowStockVariants.length===0&&<p className="dashboardHealthy">ALL ACTIVE STOCK ABOVE THRESHOLD</p>}</article></div></section>}

 {activeView==='products'&&<><section id="products" className="adminSection adminViewSection"><div className="adminSubnav"><button className={productView==='all'?'active':''} onClick={()=>setProductView('all')}>ALL PRODUCTS</button><button className={productView==='release'?'active':''} onClick={()=>setProductView('release')}>NEW RELEASE</button><button className={productView==='merch'?'active':''} onClick={()=>setProductView('merch')}>NEW MERCH</button></div><div className="sectionLabel"><span>02 / PRODUCTS</span><p>Catalogue, merch and storefront product controls.</p></div>{productView==='all'&&<><div className="qaSummaryBar"><div><span>QA READINESS</span><b>{qaSummary.total} PRODUCTS</b></div><strong className="ready">{qaSummary.ready} READY</strong><strong className="warning">{qaSummary.warning} WARNING</strong><strong className="blocked">{qaSummary.blocked} BLOCKED</strong></div><div className="productControlBar"><div className="productSearchWrap"><span>SEARCH</span><input value={productSearch} onChange={e=>setProductSearch(e.target.value)} aria-label="Search products" placeholder="Title, catalogue, artist…"/></div><select aria-label="Filter product status" value={productStatusFilter} onChange={e=>setProductStatusFilter(e.target.value)}><option value="all">ALL STATUS</option><option value="active">AVAILABLE</option><option value="forthcoming">FORTHCOMING</option><option value="draft">DRAFT</option><option value="archived">ARCHIVED</option></select><select aria-label="Filter product type" value={productTypeFilter} onChange={e=>setProductTypeFilter(e.target.value)}><option value="all">ALL TYPES</option><option value="release">RELEASES</option><option value="merch">MERCH</option></select><button type="button" onClick={()=>{setProductSearch('');setProductStatusFilter('all');setProductTypeFilter('all')}}>RESET</button><button type="button" onClick={()=>{const rows=visibleProducts.map(p=>({p,qa:evaluateProductQa(p)}));const blocked=rows.filter(x=>x.qa.state==='BLOCKED').length,warnings=rows.filter(x=>x.qa.state==='WARNING').length,ready=rows.filter(x=>x.qa.state==='READY').length;setMessage(`QA complete · ${ready} READY · ${warnings} WARNING · ${blocked} BLOCKED`);if(blocked||warnings)setQaReport((rows.find(x=>x.qa.state==='BLOCKED')||rows.find(x=>x.qa.state==='WARNING'))&&{product:(rows.find(x=>x.qa.state==='BLOCKED')||rows.find(x=>x.qa.state==='WARNING')).p,qa:(rows.find(x=>x.qa.state==='BLOCKED')||rows.find(x=>x.qa.state==='WARNING')).qa})}}>RUN QA FOR ALL</button></div>{selectedProductIds.length>0&&<div className="bulkActionBar"><span>{selectedProductIds.length} SELECTED</span><button disabled={bulkSaving} onClick={()=>bulkProductAction('active')}>PUBLISH</button><button disabled={bulkSaving} onClick={()=>bulkProductAction('draft')}>DRAFT</button><button disabled={bulkSaving} onClick={()=>bulkProductAction('archived')}>ARCHIVE</button><button disabled={bulkSaving} onClick={()=>bulkProductAction('store-on')}>STORE ON</button><button disabled={bulkSaving} onClick={()=>bulkProductAction('store-off')}>STORE OFF</button><button disabled={bulkSaving} onClick={()=>bulkProductAction('google-on')}>GOOGLE ON</button><button disabled={bulkSaving} onClick={()=>bulkProductAction('google-off')}>GOOGLE OFF</button><button type="button" onClick={()=>setSelectedProductIds([])}>CLEAR</button></div>}<div className="adminPanel productPanel"><div className="tableHead"><span className="productSelectHead"><input aria-label="Select all visible products" type="checkbox" checked={visibleProducts.length>0&&visibleProducts.every(p=>selectedProductIds.includes(p.id))} onChange={e=>setSelectedProductIds(e.target.checked?visibleProducts.map(p=>p.id):[])}/><b>EDITION</b></span><span>FORMAT</span><span>STATUS</span><span>PRICE</span><span>STOCK</span><span>ACTIONS</span></div>
 {loading?<div className="emptyNote">Loading catalogue…</div>:visibleProducts.length===0?<div className="emptyNote">No products match this view.</div>:visibleProducts.map((p,i)=>{const v=p.product_variants?.[0],vc=p.product_variants?.length||0,qa=evaluateProductQa(p);return <div className={"productRow "+(selectedProductIds.includes(p.id)?"selected":"")} key={p.id}><div className="editionCell"><input aria-label={"Select "+p.title} className="productSelectBox" type="checkbox" checked={selectedProductIds.includes(p.id)} onChange={e=>setSelectedProductIds(prev=>e.target.checked?[...new Set([...prev,p.id])]:prev.filter(id=>id!==p.id))}/>{p.product_type==='merch'&&(adminMockupProduct(p).mockups.front||adminMockupProduct(p).mockups.back)?<div className="adminMerchThumb"><MerchMockupPreview product={adminMockupProduct(p)} displayMode="thumb" raster/></div>:p.artwork_path?<img className="adminArtworkThumb" src={supabase.storage.from('release-artwork').getPublicUrl(p.artwork_path).data.publicUrl} alt=""/>:<b>{String(visibleProducts.length-i).padStart(2,'0')}</b>}<div><strong>{p.title}</strong><small>{p.product_origin==='distributed'?(p.original_catalogue_no||p.catalogue_no):p.catalogue_no} · {p.product_origin==='distributed'?(p.original_label||'SELECTED'):(p.imprint==='lethargia'?'LETHARGIA':'SIDE:II')}</small></div></div><span className="formatPill">{p.product_type==='merch'?(p.merch_category?.toUpperCase()||'MERCH'):(vc>1?`${vc} EDITIONS`:(v?.format?.toUpperCase()||'—'))}<button type="button" className={'qaBadge '+qa.state.toLowerCase()} onClick={()=>openQa(p)}>{qa.state} · {qa.score}</button></span><select aria-label={"Status for "+p.title} className="statusSelect" value={p.status} disabled={statusSaving===p.id} onChange={e=>changeStatus(p,e.target.value)}><option value="draft">DRAFT</option><option value="forthcoming">FORTHCOMING</option><option value="active">AVAILABLE</option><option value="archived">ARCHIVED</option></select><span>{vc>1?'VARIES':(v?money(v.price,v.currency):'—')}</span><span>{(p.product_variants||[]).reduce((s,x)=>s+Number(x.stock_qty||0),0)}</span><div className="rowActions">{p.is_public&&<Link href={p.product_type==='merch'?(`/store/${p.slug}`):(`/releases/${p.slug}`)}>VIEW ↗</Link>}<button type="button" className="editReleaseButton" onClick={(e)=>{e.preventDefault();e.stopPropagation();if(p.product_type==='merch')setMerchProduct({...p});else setEditRelease({...p});}}>EDIT</button><button type="button" className="rowNavButton" onClick={()=>openQa(p)}>RUN QA</button><button type="button" className="rowNavButton" onClick={()=>{setPreviewProductId(p.id);openAdminView('preview')}}>PREVIEW</button><button type="button" className="rowNavButton" onClick={()=>openAdminView('inventory')}>STOCK</button>{p.product_type!=='merch'&&<button type="button" className={'selectedMiniButton '+(p.homepage_selected?'active':'')} onClick={()=>toggleHomepageSelected(p)}>{p.homepage_selected?'SELECTED ✓':'SELECT'}</button>}<button type="button" className="finishMiniButton" onClick={()=>toggleWrap(p)}>{p.has_shrinkwrap?'WRAP ✓':'WRAP'}</button><button type="button" className="deleteReleaseButton" disabled={deletingId===p.id} onClick={()=>deleteRelease(p)}>{deletingId===p.id?'DELETING…':'DELETE'}</button></div></div>})}
 <div className="panelAction"><button type="button" onClick={()=>setProductView('release')}>+ ADD PHYSICAL EDITION</button></div></div></>}
 {productView==='release'&&<ReleaseWorkspace onCreated={async()=>{await load();setProductView('all')}}/>}
 {productView==='merch'&&<MerchWorkspace onCreated={load} onContinue={product=>{setMerchSetup(true);setMerchProduct(product)}}/>}
 </section></>}

 {activeView==='emails'&&<div className="adminModuleStack"><EmailStudio/></div>}

 {activeView==='seo'&&<div className="adminModuleStack"><SeoControlCenter products={products} onEdit={p=>{if(p.product_type==='merch')setMerchProduct({...p,__initialTab:'seo'});else setEditRelease({...p,__initialTab:'seo'})}}/></div>}

 {activeView==='preview'&&<div className="adminModuleStack"><ProductPreviewPanel products={products} preferredProductId={previewProductId} onEditProduct={(p,tab)=>{if(p.product_type==='merch'){setMerchSetup(false);setMerchProduct({...p,__initialTab:tab})}else setEditRelease({...p,__initialTab:tab})}}/></div>}

 {activeView==='merchandising'&&<div className="adminModuleStack"><MerchandisingPanel products={products}/><WearOpsPanel products={products} onChanged={load}/></div>}

 {activeView==='orders'&&<section id="orders" className="adminSection adminViewSection"><div className="sectionLabel"><span>03 / ORDERS</span><p>Live orders, payment and fulfilment.</p></div><div className="adminPanel orderList">{orders.length?orders.map(o=><article className="orderRow" key={o.id} role="button" tabIndex={0} aria-label={`Open order SII-${String(o.order_no).padStart(4,'0')}`} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelectedOrder(o);setIyziRef('');setShippingEdit({carrier:o.shipping_carrier||'',tracking:o.tracking_number||''})}}} onClick={()=>{setSelectedOrder(o);setIyziRef('');setShippingEdit({carrier:o.shipping_carrier||'',tracking:o.tracking_number||''})}}><div><strong>#SII-{String(o.order_no).padStart(4,'0')}</strong><small>{o.email} · {o.fulfillment_type?.toUpperCase()}</small></div><span className="orderStatusGroup"><small className={`orderStatusPill ${o.payment_status==='paid'?'isPaid':o.payment_status==='refunded'?'isRefunded':'isPending'}`}>{String(o.payment_status||'unknown').replaceAll('_',' ')}</small><small className="orderFulfillmentPill">{String(o.status||'unknown').replaceAll('_',' ')}</small>{Number(o.support_total||0)>0&&<em className="orderSupportBadge">WWYS +{money(o.support_total,o.currency)}</em>}</span><b>{money(o.total,o.currency)}</b></article>):<div className="emptyNote">{loading?'Loading orders…':'No orders yet.'}</div>}</div>{orders.length<orderCount&&<button className="ghostButton loadMoreButton" disabled={moreLoading} onClick={()=>loadMore('orders')}>LOAD MORE · {orders.length} / {orderCount}</button>}</section>}

 {activeView==='inventory'&&<><section id="inventory" className="adminSection adminViewSection"><div className="sectionLabel"><span>04 / INVENTORY</span><p>Production and stock readiness.</p></div><div className="adminPanel inventoryCard"><div className="inventoryRing"><strong>{stockUnits}</strong><span>UNITS</span></div><div><b>Live inventory connected.</b><p>{physicalVariants.length} physical variant · {reservedUnits} reserved.</p><small>{availableUnits} available units across active inventory.</small></div></div></section>
 <section id="inventory-list" className="adminSection adminViewSection"><div className="sectionLabel"><span>04B / STOCK LEDGER</span><p>Adjust live stock without leaving Control Room.</p></div><div className="adminPanel inventoryList">
 {physicalVariants.length===0?<div className="emptyNote">Create a release to start inventory.</div>:physicalVariants.map(v=>{const edit=editing?.id===v.id?editing:null;return <div className="inventoryRow" key={v.id}><div><strong>{v.product.title}</strong><small>{v.sku} · {v.format.toUpperCase()}</small></div>{edit?<><label>STOCK<input type="number" min="0" value={edit.stock_qty} onChange={e=>setEditing({...edit,stock_qty:e.target.value})}/></label><label>RESERVED<input type="number" value={edit.reserved_qty} readOnly aria-label="Reserved by orders"/></label><label>LOW AT<input type="number" min="0" value={edit.low_stock_threshold} onChange={e=>setEditing({...edit,low_stock_threshold:e.target.value})}/></label><button className="saveButton" disabled={stockSaving} onClick={()=>saveStock(edit)}>{stockSaving?'SAVING…':'SAVE'}</button><button className="ghostButton" onClick={()=>setEditing(null)}>CANCEL</button></>:<><span>{Math.max(0,Number(v.stock_qty||0)-Number(v.reserved_qty||0))} AVAILABLE</span><span>{v.reserved_qty} RESERVED / {v.stock_qty} TOTAL</span><span>{Math.max(0,Number(v.stock_qty||0)-Number(v.reserved_qty||0))<=Number(v.low_stock_threshold)?'LOW STOCK':'READY'}</span><button className="ghostButton" onClick={()=>setEditing({...v,originalStock:v.stock_qty})}>ADJUST</button></>}</div>})}</div></section></>}

 {activeView==='customers'&&<section id="customers" className="adminSection adminSectionStandalone adminViewSection"><div className="sectionLabel"><span>07 / CUSTOMERS</span><p>{customerCount} customer records</p></div><div className="adminPanel customerList">{customers.length?customers.map(c=><article key={c.id}><div><strong>{c.full_name||'Customer'}</strong><span>{c.email}</span></div><time dateTime={c.created_at}>{new Date(c.created_at).toLocaleDateString('tr-TR')}</time></article>):<p className="emptyNote">{loading?'Loading customers…':'Customers will appear here after their first order.'}</p>}</div>{customers.length<customerCount&&<button className="ghostButton loadMoreButton" disabled={moreLoading} onClick={()=>loadMore('customers')}>LOAD MORE · {customers.length} / {customerCount}</button>}</section>}
{activeView==='commerce'&&<div className="adminModuleStack"><DiscountsPanel/><CommerceOpsPanel products={products} onChanged={load}/><CommerceExpansionPanel products={products}/><ValueOpsPanel/></div>}
{activeView==='settings'&&<section id="settings" className="adminSection adminSectionStandalone"><div className="lowerGrid singleAdminCard"><article><span>08 / SETTINGS</span><h2>Store<br/><em>configuration.</em></h2><p>Shipping settings and server-side production application delivery.</p><form className="shippingSettings" onSubmit={saveShippingSettings}><label className="shippingToggle"><input type="checkbox" checked={!!shippingSettings.enabled} onChange={e=>setShippingSettings({...shippingSettings,enabled:e.target.checked})}/><span>SHIPPING CALCULATION ACTIVE</span></label><label className="shippingToggle internationalToggle"><input type="checkbox" checked={!!shippingSettings.international_enabled} onChange={e=>setShippingSettings({...shippingSettings,international_enabled:e.target.checked})}/><span>INTERNATIONAL SALES / SHIPPING</span></label><div className="shippingFields"><label><span>CD / CASSETTE RATE · ₺</span><input type="number" min="0" step="0.01" inputMode="decimal" value={shippingSettings.standard_rate} onChange={e=>setShippingSettings({...shippingSettings,standard_rate:e.target.value})}/></label><label><span>VINYL RATE · ₺</span><input type="number" min="0" step="0.01" inputMode="decimal" value={shippingSettings.vinyl_rate} onChange={e=>setShippingSettings({...shippingSettings,vinyl_rate:e.target.value})}/></label><label><span>FREE SHIPPING FROM · ₺</span><input type="number" min="0" step="0.01" inputMode="decimal" placeholder="NO THRESHOLD" value={shippingSettings.free_shipping_threshold} onChange={e=>setShippingSettings({...shippingSettings,free_shipping_threshold:e.target.value})}/></label></div><button className="saveButton" disabled={shippingSaving}>{shippingSaving?'SAVING…':'SAVE SHIPPING'}</button></form><div className="shippingSettings applicationNotificationSettings"><h3>PRODUCTION APPLICATIONS</h3><p>Application recipient is server-only. Configure <code>SIDEII_APPLICATION_TO</code> in the server environment and verify it in Launch Readiness.</p></div></article></div></section>}
{activeView==='impact'&&<div className="adminModuleStack"><ImpactPanel products={products}/></div>}
{activeView==='finance'&&<FinanceAccountingPanel products={products}/>}{activeView==='catalogue'&&<div className="adminModuleStack"><CatalogueOpsPanel products={products}/></div>}
{activeView==='growth'&&<div className="adminModuleStack"><GrowthOpsPanel products={products}/></div>}
{activeView==='localization'&&<div className="adminModuleStack"><LocalizationOpsPanel/></div>}
{activeView==='fulfillment'&&<div className="adminModuleStack"><FulfillmentMediaOpsPanel products={products}/></div>}
{activeView==='launch'&&<div className="adminModuleStack"><LaunchReadinessPanel/></div>}{qaReport&&<div className="orderOverlay qaOverlay" onMouseDown={e=>{if(e.target===e.currentTarget)setQaReport(null)}}><section ref={qaDialogRef} tabIndex={-1} className="orderModal qaModal" role="dialog" aria-label="Product readiness" aria-modal="true"><header><div><span>PRODUCT QA / {qaReport.qa.state}</span><h2>{qaReport.product.title}</h2></div><button onClick={()=>setQaReport(null)}>CLOSE ×</button></header><div className="qaScore"><strong>{qaReport.qa.score}</strong><span>/ 100 READINESS</span></div>{qaReport.qa.blockers.length>0&&<div className="qaIssueGroup"><h3>BLOCKERS</h3>{qaReport.qa.blockers.map(x=><button key={x.code} onClick={()=>{setQaReport(null);if(qaReport.product.product_type==='merch'){setMerchSetup(false);setMerchProduct({...qaReport.product,__initialTab:x.tab})}else setEditRelease({...qaReport.product,__initialTab:x.tab})}}><b>{x.label}</b><span>FIX → {String(x.tab).toUpperCase()}</span></button>)}</div>}{qaReport.qa.warnings.length>0&&<div className="qaIssueGroup warnings"><h3>WARNINGS</h3>{qaReport.qa.warnings.map(x=><button key={x.code} onClick={()=>{setQaReport(null);if(qaReport.product.product_type==='merch'){setMerchSetup(false);setMerchProduct({...qaReport.product,__initialTab:x.tab})}else setEditRelease({...qaReport.product,__initialTab:x.tab})}}><b>{x.label}</b><span>REVIEW → {String(x.tab).toUpperCase()}</span></button>)}</div>}{qaReport.qa.issues.length===0&&<div className="qaReady">READY TO PUBLISH</div>}</section></div>}{selectedOrder&&<div className="orderOverlay" onMouseDown={e=>{if(e.target===e.currentTarget)setSelectedOrder(null)}}><section ref={orderDialogRef} tabIndex={-1} className="orderModal" role="dialog" aria-modal="true" aria-label={'Order #SII-'+String(selectedOrder.order_no).padStart(4,'0')}><header><div><span>ORDER / #SII-{String(selectedOrder.order_no).padStart(4,'0')}</span><h2>{selectedOrder.shipping_name||selectedOrder.email}</h2></div><button onClick={()=>setSelectedOrder(null)}>CLOSE ×</button></header><div className="orderDetailGrid"><div><span>CUSTOMER</span><b>{selectedOrder.email}</b><p>{selectedOrder.shipping_phone||'—'}</p></div><div><span>FULFILMENT</span><b>{selectedOrder.fulfillment_type?.toUpperCase()}</b><p>{selectedOrder.shipping_address?Object.values(selectedOrder.shipping_address).filter(Boolean).join(' · '):'Digital delivery'}</p></div></div>{selectedOrder.invoice_type&&<div className="orderInvoice"><span>INVOICE</span><b>{selectedOrder.invoice_type==='company'?(selectedOrder.invoice_company||'COMPANY'):'INDIVIDUAL'}</b>{selectedOrder.invoice_type==='company'&&<p>{[selectedOrder.invoice_tax_office,selectedOrder.invoice_tax_number].filter(Boolean).join(' · ')}</p>}</div>}{selectedOrder.is_gift&&<div className="orderGiftOps"><span>GIFT FULFILMENT</span><b>{selectedOrder.gift_wrap?'WRAP REQUIRED':'STANDARD PACKING'}</b>{selectedOrder.hide_prices&&<p>HIDE PRICES</p>}{selectedOrder.gift_recipient_email&&<p>RECIPIENT · {selectedOrder.gift_recipient_email}</p>}{selectedOrder.gift_delivery_at&&<p>REVEAL AFTER · {new Date(selectedOrder.gift_delivery_at).toLocaleString('tr-TR')}</p>}{selectedOrder.gift_message&&<p>MESSAGE · {selectedOrder.gift_message}</p>}{selectedOrder.gift_notified_at&&<small>RECIPIENT NOTIFIED · {new Date(selectedOrder.gift_notified_at).toLocaleString('tr-TR')}</small>}{selectedOrder.gift_public_token&&<div className="orderGiftQr"><img src={'/api/gift-qr/'+selectedOrder.gift_public_token} alt="Gift portal QR"/><button type="button" onClick={()=>navigator.clipboard?.writeText(window.location.origin+'/gift/'+selectedOrder.gift_public_token)}>COPY GIFT LINK</button></div>}</div>}<div className="orderItems">{(selectedOrder.order_items||[]).map(i=><article key={i.id}><div><b>{i.title}</b><small>{i.sku} · {i.format.toUpperCase()} · QTY {i.quantity}{Number(i.support_amount||0)>0?' · WWYS SUPPORT':''}</small>{Number(i.support_amount||0)>0&&<em className="orderItemSupport">EXTRA SUPPORT · +{money(i.support_amount,selectedOrder.currency)}</em>}</div><strong>{money(i.line_total,selectedOrder.currency)}</strong></article>)}</div>{Number(selectedOrder.discount_total||0)>0&&<div className="orderPromo"><span>DISCOUNT · {selectedOrder.promo_code}</span><strong>−{money(selectedOrder.discount_total,selectedOrder.currency)}</strong></div>}{Number(selectedOrder.support_total||0)>0&&<div className="orderSupportTotal"><span>WWYS EXTRA SUPPORT</span><strong>+{money(selectedOrder.support_total,selectedOrder.currency)}</strong></div>}<div className="orderTotal"><span>TOTAL</span><strong>{money(selectedOrder.total,selectedOrder.currency)}</strong></div><div className="orderControls"><label>PAYMENT<select value={selectedOrder.payment_status} disabled><option value="unpaid">UNPAID</option><option value="paid">PAID</option><option value="refunded">REFUNDED</option></select><small>Provider controlled</small></label><label>ORDER STATUS<select value={selectedOrder.status} disabled={orderSaving||selectedOrder.status==='completed'} onChange={e=>updateOrder(selectedOrder,e.target.value,null,shippingEdit)}><option value="pending" disabled={selectedOrder.status!=='pending'}>PENDING</option><option value="preparing" disabled={selectedOrder.payment_status!=='paid'||!['pending','preparing'].includes(selectedOrder.status)}>PREPARING</option><option value="shipped" disabled={selectedOrder.status!=='preparing'||selectedOrder.payment_status!=='paid'}>SHIPPED</option><option value="completed" disabled={selectedOrder.status!=='shipped'||selectedOrder.payment_status!=='paid'}>COMPLETED</option><option value="cancelled" disabled={selectedOrder.status==='completed'||selectedOrder.payment_status==='paid'}>CANCELLED</option></select></label></div><div className="iyziManualConfirm"><div><span>IYZICO LINK / MANUAL RECONCILIATION</span><small>Confirm only after matching this order in the iyzico panel.</small></div><input value={iyziRef} placeholder="TRANSACTION / REFERENCE" onChange={e=>setIyziRef(e.target.value)} maxLength="160"/><div className="iyziManualActions">{selectedOrder.payment_status==='unpaid'&&<button type="button" disabled={orderSaving||iyziRef.trim().length<4} onClick={()=>confirmIyziLink(selectedOrder,'paid')}>CONFIRM PAID</button>}{selectedOrder.payment_status==='paid'&&<button type="button" disabled={orderSaving||iyziRef.trim().length<4} onClick={()=>confirmIyziLink(selectedOrder,'refunded')}>CONFIRM REFUND</button>}</div></div>{['shipping','mixed'].includes(selectedOrder.fulfillment_type)&&<div className="orderControls shippingTracking"><label>CARRIER<select value={shippingEdit.carrier} onChange={e=>setShippingEdit({...shippingEdit,carrier:e.target.value})}><option value="">SELECT CARRIER</option><option value="Yurtiçi Kargo">YURTİÇİ KARGO</option><option value="Aras Kargo">ARAS KARGO</option><option value="MNG Kargo">MNG KARGO</option><option value="Sürat Kargo">SÜRAT KARGO</option><option value="PTT Kargo">PTT KARGO</option><option value="Hepsijet">HEPSİJET</option><option value="Diğer">DİĞER</option></select></label><label>TRACKING NUMBER<input value={shippingEdit.tracking} placeholder="Required for SHIPPED" onChange={e=>setShippingEdit({...shippingEdit,tracking:e.target.value})}/></label><button type="button" className="saveButton" disabled={orderSaving} onClick={()=>updateOrder(selectedOrder,null,null,shippingEdit)}>SAVE SHIPPING</button>{selectedOrder.status==='preparing'&&selectedOrder.payment_status==='paid'&&<button type="button" className="saveButton shipNowButton" disabled={orderSaving||!shippingEdit.carrier||!shippingEdit.tracking.trim()} onClick={()=>updateOrder(selectedOrder,'shipped',null,shippingEdit)}>MARK SHIPPED</button>}</div>}{selectedOrder.shipped_at&&<p className="orderNotes">SHIPPED · {new Date(selectedOrder.shipped_at).toLocaleString('tr-TR')}</p>}{selectedOrder.notes&&<p className="orderNotes">{selectedOrder.notes}</p>}</section></div>}{editRelease&&<EditReleaseModal product={editRelease} onClose={()=>setEditRelease(null)} onSaved={load}/>} {merchProduct&&<MerchEditor key={merchProduct.id+':'+(merchProduct.updated_at||'')} product={merchProduct} setupMode={merchSetup} onClose={()=>{setMerchProduct(null);setMerchSetup(false)}} onSaved={async()=>{const keepId=merchProduct.id;const fresh=await load();setMerchProduct((fresh||[]).find(x=>x.id===keepId)||null)}}/>}<footer className="adminFooter"><span>SIDE:II CONTROL ROOM</span><span>SUPABASE / LIVE</span></footer></section>;
}
