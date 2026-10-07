'use client';
import {useEffect,useMemo,useState} from 'react';
import {supabase} from '../lib/supabase';

const empty={id:null,slug:'',name:'',kind:'core',description:'',active:true,starts_at:'',ends_at:'',sort_order:0};

const localDate=v=>{
 if(!v)return '';
 const d=new Date(v);if(Number.isNaN(d.getTime()))return '';
 const pad=n=>String(n).padStart(2,'0');
 return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes());
};
const iso=v=>v?new Date(v).toISOString():null;
const slugify=v=>String(v||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');

export default function MerchandisingPanel({products=[]}){
 const [collections,setCollections]=useState([]);
 const [items,setItems]=useState([]);
 const [selected,setSelected]=useState(null);
 const [form,setForm]=useState(empty);
 const [busy,setBusy]=useState('');
 const [message,setMessage]=useState('');
 const [query,setQuery]=useState('');

 async function load(preferId=null){
  if(!supabase)return;
  const [c,i]=await Promise.all([
   supabase.rpc('admin_list_collections'),
   supabase.rpc('admin_list_collection_items')
  ]);
  if(c.error){setMessage(c.error.message);return}
  if(i.error){setMessage(i.error.message);return}
  const rows=Array.isArray(c.data)?c.data:[];
  const itemRows=Array.isArray(i.data)?i.data:[];
  setCollections(rows);setItems(itemRows);
  const id=preferId||selected?.id||rows[0]?.id||null;
  const next=rows.find(x=>x.id===id)||rows[0]||null;
  if(next)pick(next);else{setSelected(null);setForm(empty)}
 }

 useEffect(()=>{load()},[]);

 function pick(c){
  setSelected(c);
  setForm({
   id:c.id,slug:c.slug||'',name:c.name||'',kind:c.kind||'core',description:c.description||'',
   active:c.active!==false,starts_at:localDate(c.starts_at),ends_at:localDate(c.ends_at),sort_order:c.sort_order??0
  });
  setMessage('');
 }

 function newCollection(){setSelected(null);setForm({...empty,sort_order:collections.length+1});setMessage('')}

 async function saveCollection(e){
  e.preventDefault();setBusy('collection');setMessage('');
  const slug=slugify(form.slug||form.name);
  if(!slug||!form.name.trim()){setMessage('Collection name and slug are required.');setBusy('');return}
  const {data,error}=await supabase.rpc('admin_save_collection',{
   p_id:form.id||null,p_slug:slug,p_name:form.name.trim(),p_kind:form.kind,
   p_description:form.description||'',p_active:!!form.active,
   p_starts_at:iso(form.starts_at),p_ends_at:iso(form.ends_at),p_sort_order:Number(form.sort_order)||0
  });
  setBusy('');
  if(error){setMessage(error.message);return}
  setMessage('Collection saved.');
  await load(data||form.id);
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
  await load(selected.id);
 }

 async function move(productId,dir){
  const ordered=[...selectedItems].sort((a,b)=>a.sort_order-b.sort_order);
  const idx=ordered.findIndex(x=>x.product_id===productId),swap=idx+dir;
  if(idx<0||swap<0||swap>=ordered.length)return;
  const a=ordered[idx],b=ordered[swap];
  setBusy('move:'+productId);
  const one=await supabase.rpc('admin_set_collection_item',{p_collection_id:selected.id,p_product_id:a.product_id,p_enabled:true,p_sort_order:b.sort_order,p_featured:!!a.featured});
  if(!one.error)await supabase.rpc('admin_set_collection_item',{p_collection_id:selected.id,p_product_id:b.product_id,p_enabled:true,p_sort_order:a.sort_order,p_featured:!!b.featured});
  setBusy('');await load(selected.id);
 }

 return <section className="adminSection merchandisingOps">
  <div className="sectionLabel"><span>MERCHANDISING</span><p>Collections, featured placement and product relationships.</p></div>
  {message&&<p className="dbNotice">{message}</p>}
  <div className="merchandisingLayout">
   <aside className="adminPanel collectionIndex">
    <header><span>COLLECTIONS</span><button type="button" onClick={newCollection}>＋ NEW</button></header>
    {collections.length===0?<p className="emptyNote">No collections yet.</p>:collections.map(c=><button type="button" key={c.id} className={selected?.id===c.id?'active':''} onClick={()=>pick(c)}><div><b>{c.name}</b><small>{String(c.kind).replaceAll('_',' ').toUpperCase()} · {(c.product_ids||[]).length} ITEMS</small></div><span>{c.active?'LIVE':'OFF'}</span></button>)}
   </aside>

   <div className="merchandisingMain">
    <form className="adminPanel collectionEditor" onSubmit={saveCollection}>
     <header><span>{form.id?'EDIT COLLECTION':'NEW COLLECTION'}</span><small>Manual curated collection</small></header>
     <div className="collectionFields">
      <label>NAME<input value={form.name} onChange={e=>setForm({...form,name:e.target.value,slug:form.id?form.slug:(form.slug||slugify(e.target.value))})}/></label>
      <label>SLUG<input value={form.slug} onChange={e=>setForm({...form,slug:slugify(e.target.value)})}/></label>
      <label>KIND<select value={form.kind} onChange={e=>setForm({...form,kind:e.target.value})}><option value="core">CORE</option><option value="drop">DROP</option><option value="artist_objects">ARTIST OBJECTS</option><option value="archive">ARCHIVE</option></select></label>
      <label>SORT<input type="number" value={form.sort_order} onChange={e=>setForm({...form,sort_order:e.target.value})}/></label>
      <label>STARTS<input type="datetime-local" value={form.starts_at} onChange={e=>setForm({...form,starts_at:e.target.value})}/></label>
      <label>ENDS<input type="datetime-local" value={form.ends_at} onChange={e=>setForm({...form,ends_at:e.target.value})}/></label>
      <label className="collectionWide">DESCRIPTION<textarea rows="3" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
      <label className="storefrontToggle"><input type="checkbox" checked={!!form.active} onChange={e=>setForm({...form,active:e.target.checked})}/><span>PUBLIC / ACTIVE</span></label>
     </div>
     <div className="formActions"><button type="button" className="ghostButton" onClick={newCollection}>RESET</button><button className="saveButton" disabled={busy==='collection'}>{busy==='collection'?'SAVING…':'SAVE COLLECTION'}</button></div>
    </form>

    {selected&&<article className="adminPanel collectionProducts">
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
  </div>
 </section>;
}
