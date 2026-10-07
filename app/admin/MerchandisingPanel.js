'use client';
import {useEffect,useMemo,useState} from 'react';
import {supabase} from '../lib/supabase';

const emptyCollection={
 id:null,slug:'',name:'',kind:'core',description:'',active:true,starts_at:'',ends_at:'',sort_order:0,
 collection_mode:'manual',rule_config:{product_type:'',imprint:'',merch_category:'',sort:'newest'}
};
const emptyBundle={id:null,slug:'',name:'',description:'',discount_type:'percent',discount_value:0,active:true,starts_at:'',ends_at:'',items:[]};

const localDate=v=>{
 if(!v)return '';
 const d=new Date(v);if(Number.isNaN(d.getTime()))return '';
 const pad=n=>String(n).padStart(2,'0');
 return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes());
};
const iso=v=>v?new Date(v).toISOString():null;
const slugify=v=>String(v||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');

export default function MerchandisingPanel({products=[]}){
 const [workspace,setWorkspace]=useState('collections');
 const [collections,setCollections]=useState([]);
 const [items,setItems]=useState([]);
 const [selected,setSelected]=useState(null);
 const [form,setForm]=useState(emptyCollection);
 const [bundles,setBundles]=useState([]);
 const [selectedBundle,setSelectedBundle]=useState(null);
 const [bundleForm,setBundleForm]=useState(emptyBundle);
 const [busy,setBusy]=useState('');
 const [message,setMessage]=useState('');
 const [query,setQuery]=useState('');

 async function load(preferCollectionId=null,preferBundleId=null){
  if(!supabase)return;
  const [c,i,b]=await Promise.all([
   supabase.rpc('admin_list_merchandising_collections'),
   supabase.rpc('admin_list_collection_items'),
   supabase.rpc('admin_list_bundles')
  ]);
  if(c.error){setMessage(c.error.message);return}
  if(i.error){setMessage(i.error.message);return}
  if(b.error){setMessage(b.error.message);return}
  const rows=Array.isArray(c.data)?c.data:[];
  const itemRows=Array.isArray(i.data)?i.data:[];
  const bundleRows=Array.isArray(b.data)?b.data:[];
  setCollections(rows);setItems(itemRows);setBundles(bundleRows);

  const cid=preferCollectionId||selected?.id||rows[0]?.id||null;
  const next=rows.find(x=>x.id===cid)||rows[0]||null;
  if(next)pick(next);else{setSelected(null);setForm(emptyCollection)}

  const bid=preferBundleId||selectedBundle?.id||bundleRows[0]?.id||null;
  const nextBundle=bundleRows.find(x=>x.id===bid)||bundleRows[0]||null;
  if(nextBundle)pickBundle(nextBundle);else{setSelectedBundle(null);setBundleForm(emptyBundle)}
 }

 useEffect(()=>{load()},[]);

 function pick(c){
  setSelected(c);
  setForm({
   id:c.id,slug:c.slug||'',name:c.name||'',kind:c.kind||'core',description:c.description||'',
   active:c.active!==false,starts_at:localDate(c.starts_at),ends_at:localDate(c.ends_at),sort_order:c.sort_order??0,
   collection_mode:c.collection_mode||'manual',
   rule_config:{product_type:'',imprint:'',merch_category:'',sort:'newest',...(c.rule_config||{})}
  });
  setMessage('');
 }
 function newCollection(){setSelected(null);setForm({...emptyCollection,rule_config:{...emptyCollection.rule_config},sort_order:collections.length+1});setMessage('')}

 async function saveCollection(e){
  e.preventDefault();setBusy('collection');setMessage('');
  const slug=slugify(form.slug||form.name);
  if(!slug||!form.name.trim()){setMessage('Collection name and slug are required.');setBusy('');return}
  const {data,error}=await supabase.rpc('admin_save_merchandising_collection',{
   p_id:form.id||null,p_slug:slug,p_name:form.name.trim(),p_kind:form.kind,
   p_description:form.description||'',p_active:!!form.active,
   p_starts_at:iso(form.starts_at),p_ends_at:iso(form.ends_at),p_sort_order:Number(form.sort_order)||0,
   p_collection_mode:form.collection_mode||'manual',p_rule_config:form.rule_config||{}
  });
  setBusy('');
  if(error){setMessage(error.message);return}
  setMessage('Collection saved.');
  await load(data||form.id,null);
 }

 const selectedItems=useMemo(()=>items.filter(x=>x.collection_id===selected?.id),[items,selected]);
 const itemMap=useMemo(()=>new Map(selectedItems.map(x=>[x.product_id,x])),[selectedItems]);
 const filteredProducts=useMemo(()=>{
  const q=query.trim().toLowerCase();
  return products.filter(p=>{
   if(!q)return true;
   return [p.title,p.catalogue_no,p.artist_project,p.merch_category,p.imprint].filter(Boolean).join(' ').toLowerCase().includes(q);
  });
 },[products,query]);
 const dynamicMatches=useMemo(()=>{
  const r=form.rule_config||{};
  const rows=products.filter(p=>{
   const type=coalesceType(p);
   if(r.product_type&&type!==r.product_type)return false;
   if(r.imprint&&p.imprint!==r.imprint)return false;
   if(r.merch_category&&p.merch_category!==r.merch_category)return false;
   if(p.is_public===false)return false;
   return ['active','forthcoming'].includes(p.status);
  });
  const sorted=[...rows];
  if(r.sort==='oldest')sorted.sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
  else if(r.sort==='title')sorted.sort((a,b)=>String(a.title).localeCompare(String(b.title)));
  else sorted.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  return sorted;
 },[products,form.rule_config]);

 async function setItem(product,patch){
  if(!selected?.id)return;
  const current=itemMap.get(product.id);
  const enabled=patch.enabled??!!current;
  const sort=patch.sort_order??current?.sort_order??selectedItems.length+1;
  const featured=patch.featured??current?.featured??false;
  setBusy('item:'+product.id);setMessage('');
  const {error}=await supabase.rpc('admin_set_collection_item',{
   p_collection_id:selected.id,p_product_id:product.id,p_enabled:enabled,
   p_sort_order:Number(sort)||0,p_featured:!!featured
  });
  setBusy('');
  if(error){setMessage(error.message);return}
  await load(selected.id,null);
 }

 async function move(productId,dir){
  const ordered=[...selectedItems].sort((a,b)=>a.sort_order-b.sort_order);
  const idx=ordered.findIndex(x=>x.product_id===productId),swap=idx+dir;
  if(idx<0||swap<0||swap>=ordered.length)return;
  const a=ordered[idx],b=ordered[swap];
  setBusy('move:'+productId);
  const one=await supabase.rpc('admin_set_collection_item',{p_collection_id:selected.id,p_product_id:a.product_id,p_enabled:true,p_sort_order:b.sort_order,p_featured:!!a.featured});
  if(!one.error)await supabase.rpc('admin_set_collection_item',{p_collection_id:selected.id,p_product_id:b.product_id,p_enabled:true,p_sort_order:a.sort_order,p_featured:!!b.featured});
  setBusy('');await load(selected.id,null);
 }

 function pickBundle(b){
  setSelectedBundle(b);
  setBundleForm({
   id:b.id,slug:b.slug||'',name:b.name||'',description:b.description||'',discount_type:b.discount_type||'percent',
   discount_value:Number(b.discount_value||0),active:b.active!==false,starts_at:localDate(b.starts_at),ends_at:localDate(b.ends_at),
   items:Array.isArray(b.items)?b.items.map(x=>({product_id:x.product_id,quantity:Number(x.quantity||1)})):[]
  });
  setMessage('');
 }
 function newBundle(){setSelectedBundle(null);setBundleForm({...emptyBundle,items:[]});setMessage('')}
 const bundleItemMap=useMemo(()=>new Map((bundleForm.items||[]).map(x=>[x.product_id,x])),[bundleForm.items]);

 function patchBundleProduct(productId,enabled){
  setBundleForm(prev=>{
   const current=prev.items||[];
   if(enabled){
    if(current.some(x=>x.product_id===productId))return prev;
    return {...prev,items:[...current,{product_id:productId,quantity:1}]};
   }
   return {...prev,items:current.filter(x=>x.product_id!==productId)};
  });
 }
 function patchBundleQty(productId,quantity){
  setBundleForm(prev=>({...prev,items:(prev.items||[]).map(x=>x.product_id===productId?{...x,quantity:Math.max(1,Number(quantity)||1)}:x)}));
 }

 async function saveBundle(e){
  e.preventDefault();setBusy('bundle');setMessage('');
  const slug=slugify(bundleForm.slug||bundleForm.name);
  if(!slug||!bundleForm.name.trim()){setMessage('Bundle name and slug are required.');setBusy('');return}
  if((bundleForm.items||[]).length<2){setMessage('A bundle needs at least two products.');setBusy('');return}
  const {data,error}=await supabase.rpc('admin_save_bundle',{
   p_id:bundleForm.id||null,p_slug:slug,p_name:bundleForm.name.trim(),p_description:bundleForm.description||'',
   p_discount_type:bundleForm.discount_type,p_discount_value:Number(bundleForm.discount_value)||0,p_active:!!bundleForm.active,
   p_starts_at:iso(bundleForm.starts_at),p_ends_at:iso(bundleForm.ends_at)
  });
  if(error){setBusy('');setMessage(error.message);return}
  const id=data||bundleForm.id;
  const previous=new Set((selectedBundle?.items||[]).map(x=>x.product_id));
  const current=new Set((bundleForm.items||[]).map(x=>x.product_id));
  for(const oldId of previous){
   if(!current.has(oldId)){
    const {error:removeError}=await supabase.rpc('admin_set_bundle_item',{p_bundle_id:id,p_product_id:oldId,p_quantity:1,p_enabled:false});
    if(removeError){setBusy('');setMessage(removeError.message);return}
   }
  }
  for(const item of bundleForm.items||[]){
   const {error:itemError}=await supabase.rpc('admin_set_bundle_item',{p_bundle_id:id,p_product_id:item.product_id,p_quantity:Math.max(1,Number(item.quantity)||1),p_enabled:true});
   if(itemError){setBusy('');setMessage(itemError.message);return}
  }
  setBusy('');setMessage('Bundle saved.');
  await load(null,id);
 }

 return <section className="adminSection merchandisingOps">
  <div className="sectionLabel"><span>MERCHANDISING</span><p>Collections, dynamic discovery, bundles and complete-the-set relationships.</p></div>
  <div className="adminSubnav merchandisingTabs"><button className={workspace==='collections'?'active':''} onClick={()=>setWorkspace('collections')}>COLLECTIONS</button><button className={workspace==='bundles'?'active':''} onClick={()=>setWorkspace('bundles')}>BUNDLES / COMPLETE THE SET</button></div>
  {message&&<p className="dbNotice">{message}</p>}

  {workspace==='collections'&&<div className="merchandisingLayout">
   <aside className="adminPanel collectionIndex">
    <header><span>COLLECTIONS</span><button type="button" onClick={newCollection}>＋ NEW</button></header>
    {collections.length===0?<p className="emptyNote">No collections yet.</p>:collections.map(c=><button type="button" key={c.id} className={selected?.id===c.id?'active':''} onClick={()=>pick(c)}><div><b>{c.name}</b><small>{String(c.kind).replaceAll('_',' ').toUpperCase()} · {(c.collection_mode||'manual').toUpperCase()}</small></div><span>{c.active?'LIVE':'OFF'}</span></button>)}
   </aside>

   <div className="merchandisingMain">
    <form className="adminPanel collectionEditor" onSubmit={saveCollection}>
     <header><span>{form.id?'EDIT COLLECTION':'NEW COLLECTION'}</span><small>{form.collection_mode==='dynamic'?dynamicMatches.length+' MATCHING PRODUCTS':'Manual curated collection'}</small></header>
     <div className="collectionFields">
      <label>NAME<input value={form.name} onChange={e=>setForm({...form,name:e.target.value,slug:form.id?form.slug:(form.slug||slugify(e.target.value))})}/></label>
      <label>SLUG<input value={form.slug} onChange={e=>setForm({...form,slug:slugify(e.target.value)})}/></label>
      <label>MODE<select value={form.collection_mode} onChange={e=>setForm({...form,collection_mode:e.target.value})}><option value="manual">MANUAL</option><option value="dynamic">DYNAMIC</option></select></label>
      <label>KIND<select value={form.kind} onChange={e=>setForm({...form,kind:e.target.value})}><option value="core">CORE</option><option value="drop">DROP</option><option value="artist_objects">ARTIST OBJECTS</option><option value="archive">ARCHIVE</option></select></label>
      <label>SORT ORDER<input type="number" value={form.sort_order} onChange={e=>setForm({...form,sort_order:e.target.value})}/></label>
      <label>STARTS<input type="datetime-local" value={form.starts_at} onChange={e=>setForm({...form,starts_at:e.target.value})}/></label>
      <label>ENDS<input type="datetime-local" value={form.ends_at} onChange={e=>setForm({...form,ends_at:e.target.value})}/></label>
      <label className="storefrontToggle"><input type="checkbox" checked={!!form.active} onChange={e=>setForm({...form,active:e.target.checked})}/><span>PUBLIC / ACTIVE</span></label>
      {form.collection_mode==='dynamic'&&<>
       <label>PRODUCT TYPE<select value={form.rule_config.product_type||''} onChange={e=>setForm({...form,rule_config:{...form.rule_config,product_type:e.target.value}})}><option value="">ANY</option><option value="release">RELEASE</option><option value="merch">MERCH</option></select></label>
       <label>IMPRINT<select value={form.rule_config.imprint||''} onChange={e=>setForm({...form,rule_config:{...form.rule_config,imprint:e.target.value}})}><option value="">ANY</option><option value="sideii">SIDE:II</option><option value="lethargia">LETHARGIA</option></select></label>
       <label>MERCH CATEGORY<input value={form.rule_config.merch_category||''} onChange={e=>setForm({...form,rule_config:{...form.rule_config,merch_category:e.target.value}})} placeholder="apparel / mug / ..."/></label>
       <label>DYNAMIC SORT<select value={form.rule_config.sort||'newest'} onChange={e=>setForm({...form,rule_config:{...form.rule_config,sort:e.target.value}})}><option value="newest">NEWEST</option><option value="oldest">OLDEST</option><option value="title">TITLE</option></select></label>
      </>}
      <label className="collectionWide">DESCRIPTION<textarea rows="3" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
     </div>
     {form.collection_mode==='dynamic'&&<div className="dynamicPreview"><span>DYNAMIC PREVIEW · {dynamicMatches.length} MATCHES</span><div>{dynamicMatches.slice(0,8).map(p=><b key={p.id}>{p.catalogue_no} · {p.title}</b>)}</div></div>}
     <div className="formActions"><button type="button" className="ghostButton" onClick={newCollection}>RESET</button><button className="saveButton" disabled={busy==='collection'}>{busy==='collection'?'SAVING…':'SAVE COLLECTION'}</button></div>
    </form>

    {selected&&form.collection_mode==='manual'&&<article className="adminPanel collectionProducts">
     <header><div><span>PRODUCT PLACEMENT</span><small>{selected.name} · featured + manual order</small></div><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search products…"/></header>
     <div className="collectionProductHead"><span>PRODUCT</span><span>IN COLLECTION</span><span>FEATURED</span><span>ORDER</span></div>
     {filteredProducts.map(p=>{const item=itemMap.get(p.id);const enabled=!!item;return <div className={"collectionProductRow "+(enabled?'included':'')} key={p.id}>
      <div><b>{p.title}</b><small>{p.catalogue_no} · {p.product_type==='merch'?(p.merch_category||'MERCH'):p.imprint}</small></div>
      <label className="miniSwitch"><input type="checkbox" checked={enabled} disabled={busy==='item:'+p.id} onChange={e=>setItem(p,{enabled:e.target.checked})}/><span>{enabled?'IN':'OUT'}</span></label>
      <label className="miniSwitch"><input type="checkbox" checked={!!item?.featured} disabled={!enabled||busy==='item:'+p.id} onChange={e=>setItem(p,{enabled:true,featured:e.target.checked})}/><span>{item?.featured?'FEATURED':'STANDARD'}</span></label>
      <div className="collectionOrder"><button type="button" disabled={!enabled} onClick={()=>move(p.id,-1)}>↑</button><b>{enabled?item.sort_order:'—'}</b><button type="button" disabled={!enabled} onClick={()=>move(p.id,1)}>↓</button></div>
     </div>})}
    </article>}
   </div>
  </div>}

  {workspace==='bundles'&&<div className="merchandisingLayout">
   <aside className="adminPanel collectionIndex">
    <header><span>BUNDLES</span><button type="button" onClick={newBundle}>＋ NEW</button></header>
    {bundles.length===0?<p className="emptyNote">No bundles yet.</p>:bundles.map(b=><button type="button" key={b.id} className={selectedBundle?.id===b.id?'active':''} onClick={()=>pickBundle(b)}><div><b>{b.name}</b><small>{(b.items||[]).length} PRODUCTS · {String(b.discount_type).toUpperCase()} {b.discount_value}</small></div><span>{b.active?'LIVE':'OFF'}</span></button>)}
   </aside>
   <div className="merchandisingMain">
    <form className="adminPanel collectionEditor bundleEditor" onSubmit={saveBundle}>
     <header><span>{bundleForm.id?'EDIT BUNDLE':'NEW BUNDLE'}</span><small>Cross-sell / complete-the-set</small></header>
     <div className="collectionFields">
      <label>NAME<input value={bundleForm.name} onChange={e=>setBundleForm({...bundleForm,name:e.target.value,slug:bundleForm.id?bundleForm.slug:(bundleForm.slug||slugify(e.target.value))})}/></label>
      <label>SLUG<input value={bundleForm.slug} onChange={e=>setBundleForm({...bundleForm,slug:slugify(e.target.value)})}/></label>
      <label>DISCOUNT TYPE<select value={bundleForm.discount_type} onChange={e=>setBundleForm({...bundleForm,discount_type:e.target.value})}><option value="percent">PERCENT</option><option value="fixed">FIXED AMOUNT</option></select></label>
      <label>DISCOUNT VALUE<input type="number" min="0" step=".01" value={bundleForm.discount_value} onChange={e=>setBundleForm({...bundleForm,discount_value:e.target.value})}/></label>
      <label>STARTS<input type="datetime-local" value={bundleForm.starts_at} onChange={e=>setBundleForm({...bundleForm,starts_at:e.target.value})}/></label>
      <label>ENDS<input type="datetime-local" value={bundleForm.ends_at} onChange={e=>setBundleForm({...bundleForm,ends_at:e.target.value})}/></label>
      <label className="storefrontToggle"><input type="checkbox" checked={!!bundleForm.active} onChange={e=>setBundleForm({...bundleForm,active:e.target.checked})}/><span>PUBLIC / ACTIVE</span></label>
      <label className="collectionWide">DESCRIPTION<textarea rows="3" value={bundleForm.description} onChange={e=>setBundleForm({...bundleForm,description:e.target.value})}/></label>
     </div>
     <div className="formActions"><button type="button" className="ghostButton" onClick={newBundle}>RESET</button><button className="saveButton" disabled={busy==='bundle'}>{busy==='bundle'?'SAVING…':'SAVE BUNDLE'}</button></div>
    </form>

    <article className="adminPanel collectionProducts bundleProducts">
     <header><div><span>BUNDLE PRODUCTS</span><small>Select at least two products and quantity.</small></div><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search products…"/></header>
     <div className="collectionProductHead bundleProductHead"><span>PRODUCT</span><span>IN BUNDLE</span><span>QTY</span><span>ROLE</span></div>
     {filteredProducts.map(p=>{const item=bundleItemMap.get(p.id);const enabled=!!item;return <div className={"collectionProductRow bundleProductRow "+(enabled?'included':'')} key={p.id}>
      <div><b>{p.title}</b><small>{p.catalogue_no} · {p.product_type==='merch'?(p.merch_category||'MERCH'):p.imprint}</small></div>
      <label className="miniSwitch"><input type="checkbox" checked={enabled} onChange={e=>patchBundleProduct(p.id,e.target.checked)}/><span>{enabled?'IN':'OUT'}</span></label>
      <input className="bundleQty" type="number" min="1" disabled={!enabled} value={item?.quantity||1} onChange={e=>patchBundleQty(p.id,e.target.value)}/>
      <span className="bundleRole">{enabled?'COMPLETE SET':'—'}</span>
     </div>})}
    </article>
   </div>
  </div>}
 </section>;
}

function coalesceType(p){return p?.product_type==='merch'?'merch':'release'}
