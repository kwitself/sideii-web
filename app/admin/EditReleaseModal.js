'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const STATUS=[['draft','DRAFT'],['forthcoming','FORTHCOMING'],['active','AVAILABLE'],['archived','ARCHIVED']];

export default function EditReleaseModal({product,onClose,onSaved}){
 const variant=product?.product_variants?.[0]||{};
 const [form,setForm]=useState({catalogue_no:product.catalogue_no||'',title:product.title||'',artist_project:product.artist_project||'',description:product.description||'',imprint:product.imprint||'sideii',status:product.status||'draft',price:String(variant.price??0),stock:String(variant.stock_qty??0),has_shrinkwrap:!!product.has_shrinkwrap,release_date:product.release_date||'',edition_details:variant.edition_details||'',credits:product.credits||'',tracklist:Array.isArray(product.tracklist)?product.tracklist.join('\n'):''});
 const [file,setFile]=useState(null); const [preview,setPreview]=useState(''); const [saving,setSaving]=useState(false); const [message,setMessage]=useState('');
 const set=(k,v)=>setForm(p=>({...p,[k]:v}));
 useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview)},[preview]);
 const current=product.artwork_path?supabase.storage.from('release-artwork').getPublicUrl(product.artwork_path).data.publicUrl:'';

 function pick(f){if(preview)URL.revokeObjectURL(preview);if(!f){setFile(null);setPreview('');return}if(!f.type.startsWith('image/')||f.size>10*1024*1024){setMessage('Use JPG, PNG, WEBP or AVIF up to 10 MB.');return}setFile(f);setPreview(URL.createObjectURL(f));setMessage('')}

 async function save(){
  setSaving(true);setMessage('');
  try{
   let artworkPath=product.artwork_path||null;
   if(file){
    const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'');
    const path=`${product.id}/cover.${ext}`;
    const {error:u}=await supabase.storage.from('release-artwork').upload(path,file,{upsert:true,contentType:file.type,cacheControl:'3600'});if(u)throw u;
    if(artworkPath&&artworkPath!==path)await supabase.storage.from('release-artwork').remove([artworkPath]);
    artworkPath=path;
   }
   const isPublic=['active','forthcoming'].includes(form.status);
   const {error:p}=await supabase.from('products').update({catalogue_no:form.catalogue_no.trim(),title:form.title.trim(),artist_project:form.artist_project.trim()||null,description:form.description.trim()||null,imprint:form.imprint,status:form.status,is_public:isPublic,has_shrinkwrap:form.has_shrinkwrap,release_date:form.release_date||null,credits:form.credits.trim()||null,tracklist:form.tracklist.split('\n').map(x=>x.trim()).filter(Boolean),artwork_path:artworkPath}).eq('id',product.id);if(p)throw p;
   if(variant.id){
    const stock=Math.max(0,parseInt(form.stock||'0',10)||0),price=Math.max(0,parseFloat(form.price||'0')||0);
    const {error:v}=await supabase.from('product_variants').update({price,stock_qty:stock,manufactured_qty:Math.max(stock+Number(variant.reserved_qty||0),Number(variant.manufactured_qty||0)),edition_name:form.title.trim(),edition_details:form.edition_details.trim()||null}).eq('id',variant.id);if(v)throw v;
   }
   await onSaved(); onClose();
  }catch(e){setMessage(e?.message||'Update failed.')}finally{setSaving(false)}
 }

 return <div className="editOverlay" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><section className="editModal"><header><div><span>EDIT / RELEASE</span><h2>{product.title}</h2></div><button onClick={onClose}>CLOSE ×</button></header><div className="editBody"><div className="editFields">
 <label>IMPRINT<select value={form.imprint} onChange={e=>set("imprint",e.target.value)}><option value="sideii">SIDE:II</option><option value="lethargia">LETHARGIA RECORDS</option></select></label><label>CATALOGUE NO.<input value={form.catalogue_no} onChange={e=>set('catalogue_no',e.target.value)}/></label><label>TITLE<input value={form.title} onChange={e=>set('title',e.target.value)}/></label>
 <label>STATUS<select value={form.status} onChange={e=>set('status',e.target.value)}>{STATUS.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label><label>PRICE / TRY<input type="number" min="0" step=".01" value={form.price} onChange={e=>set('price',e.target.value)}/></label>
 <label>RELEASE DATE<input type="date" value={form.release_date} onChange={e=>set('release_date',e.target.value)}/></label><label>EDITION / PRESSING<input value={form.edition_details} onChange={e=>set('edition_details',e.target.value)} placeholder="First pressing · 100 copies"/></label><label>STOCK<input type="number" min="0" value={form.stock} onChange={e=>set('stock',e.target.value)}/></label><label>ARTIST / PROJECT<input value={form.artist_project} onChange={e=>set('artist_project',e.target.value)}/></label>
 <label className="editWide">TRACKLIST · ONE TRACK PER LINE<textarea rows="6" value={form.tracklist} onChange={e=>set('tracklist',e.target.value)}/></label>
 <label className="editWide">CREDITS<textarea rows="5" value={form.credits} onChange={e=>set('credits',e.target.value)}/></label>
 <label className="editWide">DESCRIPTION<textarea rows="4" value={form.description} onChange={e=>set('description',e.target.value)}/></label>
 <label className="editWide">ARTWORK<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={e=>pick(e.target.files?.[0]||null)}/></label>
 <label className="editWide editCheck"><input type="checkbox" checked={form.has_shrinkwrap} onChange={e=>set('has_shrinkwrap',e.target.checked)}/><span>SHRINKWRAP / CELLOPHANE</span></label>
 </div><aside className="editArtwork">{(preview||current)?<img src={preview||current} alt=""/>:<div>NO ARTWORK</div>}<small>{file?'NEW ARTWORK':'CURRENT ARTWORK'}</small></aside></div>
 {message&&<p className="workspaceMessage">{message}</p>}<footer><button className="ghostButton" onClick={onClose}>CANCEL</button><button className="saveButton" disabled={saving} onClick={save}>{saving?'SAVING…':'SAVE CHANGES →'}</button></footer></section></div>
}
