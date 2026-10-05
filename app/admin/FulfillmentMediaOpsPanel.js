'use client';
import {useEffect,useMemo,useState} from 'react';
import {supabase} from '../lib/supabase';

const emptyLocation={id:null,name:'',location_type:'warehouse',notes:'',active:true};
const emptyPress={product_id:'',public_enabled:false,press_copy:''};
const emptyAsset={id:null,product_id:'',label:'',asset_url:'',asset_type:'other',sort_order:0};

export default function FulfillmentMediaOpsPanel({products=[]}){
 const [locations,setLocations]=useState([]),[stocks,setStocks]=useState([]),[variants,setVariants]=useState([]),[pressKits,setPressKits]=useState([]),[health,setHealth]=useState([]);
 const [locationForm,setLocationForm]=useState(emptyLocation),[pressForm,setPressForm]=useState(emptyPress),[assetForm,setAssetForm]=useState(emptyAsset);
 const [busy,setBusy]=useState(''),[message,setMessage]=useState('');
 const productMap=useMemo(()=>Object.fromEntries(products.map(p=>[p.id,p])),[products]);

 async function load(){
  if(!supabase)return;
  const [l,s,v,p,h]=await Promise.all([
   supabase.rpc('admin_list_stock_locations'),
   supabase.rpc('admin_list_location_stock'),
   supabase.from('product_variants').select('id,sku,format,stock_qty,reserved_qty,product_id,products(id,catalogue_no,title)').eq('active',true).order('created_at'),
   supabase.rpc('admin_list_press_kits'),
   supabase.rpc('admin_location_stock_health')
  ]);
  if(l.error)return setMessage(l.error.message);
  setLocations(l.data||[]);setStocks(s.data||[]);setVariants(v.data||[]);setPressKits(p.data||[]);setHealth(h.data||[]);
 }
 useEffect(()=>{load()},[]);

 async function saveLocation(e){
  e.preventDefault();setBusy('location');setMessage('');
  const {error}=await supabase.rpc('admin_save_stock_location',{p_id:locationForm.id||null,p_name:locationForm.name,p_location_type:locationForm.location_type,p_notes:locationForm.notes||null,p_active:locationForm.active});
  setBusy('');if(error)return setMessage(error.message);setLocationForm(emptyLocation);setMessage('Stock location saved.');load();
 }
 async function saveStock(locationId,variantId,value){
  setBusy('stock:'+locationId+':'+variantId);setMessage('');
  const {error}=await supabase.rpc('admin_set_location_stock',{p_location_id:locationId,p_variant_id:variantId,p_on_hand:Number(value)||0});
  setBusy('');if(error)return setMessage(error.message);setMessage('Location stock saved.');load();
 }
 async function savePress(e){
  e.preventDefault();setBusy('press');setMessage('');
  const {error}=await supabase.rpc('admin_save_press_kit',{p_product_id:pressForm.product_id,p_public_enabled:pressForm.public_enabled,p_press_copy:pressForm.press_copy||null});
  setBusy('');if(error)return setMessage(error.message);setPressForm(emptyPress);setMessage('Press kit saved.');load();
 }
 async function uploadPressAsset(file){
  if(!file||!assetForm.product_id){setMessage('Select a product before uploading.');return}
  setBusy('upload');setMessage('Uploading press asset…');
  const ext=file.name.split('.').pop()?.toLowerCase()||'bin';
  const path='press/'+assetForm.product_id+'/'+Date.now()+'-'+file.name.replace(/[^a-zA-Z0-9._-]+/g,'-');
  const {error}=await supabase.storage.from('release-artwork').upload(path,file,{upsert:false});
  if(error){setBusy('');setMessage(error.message);return}
  const {data}=supabase.storage.from('release-artwork').getPublicUrl(path);
  setAssetForm(v=>({...v,asset_url:data.publicUrl,label:v.label||file.name}));setBusy('');setMessage('Press asset uploaded. Save it to publish.');
 }
 async function saveAsset(e){
  e.preventDefault();setBusy('asset');setMessage('');
  const {error}=await supabase.rpc('admin_save_press_asset',{p_id:assetForm.id||null,p_product_id:assetForm.product_id,p_label:assetForm.label,p_asset_url:assetForm.asset_url,p_asset_type:assetForm.asset_type,p_sort_order:Number(assetForm.sort_order)||0});
  setBusy('');if(error)return setMessage(error.message);setAssetForm(emptyAsset);setMessage('Press asset saved.');load();
 }

 return <section id="fulfillment-media" className="adminSection fulfillmentMediaOps">
  <div className="sectionLabel"><span>14 / FULFILLMENT + MEDIA</span><p>Stock locations, consignment readiness and public press kits.</p></div>
  {message&&<p className="dbNotice">{message}</p>}

  <div className="fulfillmentMediaGrid">
   <form className="adminPanel growthForm" onSubmit={saveLocation}><header><span>STOCK LOCATION</span><small>Warehouse · Studio · Consignment</small></header>
    <label><span>NAME</span><input required value={locationForm.name} onChange={e=>setLocationForm({...locationForm,name:e.target.value})}/></label>
    <label><span>TYPE</span><select value={locationForm.location_type} onChange={e=>setLocationForm({...locationForm,location_type:e.target.value})}><option value="warehouse">WAREHOUSE</option><option value="studio">STUDIO</option><option value="consignment">CONSIGNMENT</option></select></label>
    <label><span>NOTES</span><textarea value={locationForm.notes} onChange={e=>setLocationForm({...locationForm,notes:e.target.value})}/></label>
    <label className="catalogueCheck"><input type="checkbox" checked={locationForm.active} onChange={e=>setLocationForm({...locationForm,active:e.target.checked})}/><span>ACTIVE</span></label>
    <button className="saveButton" disabled={busy==='location'}>SAVE LOCATION</button>
   </form>

   <article className="adminPanel locationSummary"><header><span>LOCATIONS</span><small>{locations.length}</small></header>
    {locations.length===0?<p className="emptyNote">No stock locations yet.</p>:locations.map(l=><div className="locationRow" key={l.id}><div><b>{l.name}</b><small>{l.location_type.toUpperCase()} · ON HAND {l.total_on_hand} · RESERVED {l.total_reserved}</small></div><button className="ghostButton" onClick={()=>setLocationForm({...l,notes:l.notes||''})}>EDIT</button></div>)}
   </article>
  </div>

  <article className="adminPanel locationHealth"><header><span>STOCK HEALTH</span><small>{health.filter(x=>x.status!=='ALIGNED').length} review item(s)</small></header>
   {health.length===0?<p className="emptyNote">No active variants.</p>:health.map(x=><div className="locationHealthRow" key={x.variant_id}>
    <div><b>{x.catalogue_no} · {x.sku}</b><small>{x.title}</small></div>
    <span>GLOBAL {x.global_on_hand}</span><span>LOCATIONS {x.location_on_hand}</span><span className={'locationHealthStatus '+String(x.status).toLowerCase()}>{x.status}</span>
   </div>)}
  </article>
  {locations.length>0&&<article className="adminPanel locationMatrix"><header><span>LOCATION STOCK</span><small>Operational location counts. Global sellable stock remains the checkout authority.</small></header>
   {variants.map(v=><div className="locationStockRow" key={v.id}><div><b>{v.products?.catalogue_no||'—'} · {v.sku}</b><small>{v.products?.title||''} · {String(v.format).toUpperCase()} · GLOBAL {v.stock_qty-v.reserved_qty}</small></div><div className="locationStockInputs">{locations.map(l=>{const row=stocks.find(s=>s.location_id===l.id&&s.variant_id===v.id);return <label key={l.id}><span>{l.name}</span><input type="number" min="0" defaultValue={row?.on_hand??0} onBlur={e=>saveStock(l.id,v.id,e.target.value)}/></label>})}</div></div>)}
  </article>}

  <div className="fulfillmentMediaGrid">
   <form className="adminPanel growthForm" onSubmit={savePress}><header><span>PRESS KIT</span><small>Public media-kit copy.</small></header>
    <label><span>PRODUCT</span><select required value={pressForm.product_id} onChange={e=>{const id=e.target.value;const existing=pressKits.find(x=>x.product_id===id);setPressForm(existing?{product_id:id,public_enabled:!!existing.public_enabled,press_copy:existing.press_copy||''}:{...emptyPress,product_id:id})}}><option value="">SELECT…</option>{products.filter(p=>p.product_type!=='merch').map(p=><option key={p.id} value={p.id}>{p.catalogue_no} · {p.title}</option>)}</select></label>
    <label><span>PRESS COPY</span><textarea value={pressForm.press_copy} onChange={e=>setPressForm({...pressForm,press_copy:e.target.value})}/></label>
    <label className="catalogueCheck"><input type="checkbox" checked={pressForm.public_enabled} onChange={e=>setPressForm({...pressForm,public_enabled:e.target.checked})}/><span>PUBLIC</span></label>
    <button className="saveButton" disabled={busy==='press'}>SAVE PRESS KIT</button>
   </form>

   <form className="adminPanel growthForm" onSubmit={saveAsset}><header><span>PRESS ASSET</span><small>Cover · Photo · Logo · Audio · Video · Document</small></header>
    <label><span>PRODUCT</span><select required value={assetForm.product_id} onChange={e=>setAssetForm({...assetForm,product_id:e.target.value})}><option value="">SELECT…</option>{products.filter(p=>p.product_type!=='merch').map(p=><option key={p.id} value={p.id}>{p.catalogue_no} · {p.title}</option>)}</select></label>
    <label><span>LABEL</span><input required value={assetForm.label} onChange={e=>setAssetForm({...assetForm,label:e.target.value})}/></label>
    <label><span>URL</span><input required value={assetForm.asset_url} onChange={e=>setAssetForm({...assetForm,asset_url:e.target.value})} placeholder="/media/... or https://..."/></label><label><span>UPLOAD FILE</span><input type="file" accept="image/*,audio/*,video/*,.pdf,.zip" onChange={e=>uploadPressAsset(e.target.files?.[0])}/></label>
    <label><span>TYPE</span><select value={assetForm.asset_type} onChange={e=>setAssetForm({...assetForm,asset_type:e.target.value})}><option value="cover">COVER</option><option value="photo">PHOTO</option><option value="logo">LOGO</option><option value="audio">AUDIO</option><option value="video">VIDEO</option><option value="document">DOCUMENT</option><option value="other">OTHER</option></select></label>
    <button className="saveButton" disabled={busy==='asset'||busy==='upload'}>{busy==='upload'?'UPLOADING…':'SAVE ASSET'}</button>
   </form>
  </div>

  <article className="adminPanel pressKitList"><header><span>PRESS KIT STATUS</span><small>{pressKits.filter(x=>x.public_enabled).length} public</small></header>
   {pressKits.map(k=>{const p=productMap[k.product_id];return <div className="pressKitRow" key={k.product_id}><div><b>{p?.catalogue_no||'—'} · {p?.title||'PRODUCT'}</b><small>{k.public_enabled?'PUBLIC':'PRIVATE'} · {(k.assets||[]).length} ASSET(S)</small></div>{p&&k.public_enabled&&<a href={'/press/'+p.slug} target="_blank" rel="noreferrer">OPEN ↗</a>}</div>})}
  </article>
 </section>;
}
