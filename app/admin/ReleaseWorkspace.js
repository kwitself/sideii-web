'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const statusMap = { DRAFT:'draft', 'IN PREPARATION':'draft', FORTHCOMING:'forthcoming', AVAILABLE:'active' };

function slugify(value){return value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}

export default function ReleaseWorkspace(){
 const [form,setForm]=useState({catalogue_no:'SIDEII—003',title:'Third Edition',format:'CD',status:'DRAFT',price:'',stock:'',artist_project:'',description:'',has_shrinkwrap:false});
 const [artwork,setArtwork]=useState(null); const [artworkPreview,setArtworkPreview]=useState('');
 const [saving,setSaving]=useState(false); const [message,setMessage]=useState('');
 const set=(k,v)=>setForm(p=>({...p,[k]:v}));

 useEffect(()=>()=>{if(artworkPreview)URL.revokeObjectURL(artworkPreview)},[artworkPreview]);

 function chooseArtwork(file){
  if(artworkPreview)URL.revokeObjectURL(artworkPreview);
  if(!file){setArtwork(null);setArtworkPreview('');return}
  if(!file.type.startsWith('image/')){setMessage('Artwork must be an image file.');return}
  if(file.size>10*1024*1024){setMessage('Artwork must be 10 MB or smaller.');return}
  setArtwork(file);setArtworkPreview(URL.createObjectURL(file));setMessage('');
 }

 async function save(draft=false){
  if(!supabase){setMessage('Supabase environment variables are missing.');return;}
  if(!form.catalogue_no.trim()||!form.title.trim()){setMessage('Catalogue no. and title are required.');return;}
  setSaving(true);setMessage('');
  const dbStatus=draft?'draft':(statusMap[form.status]||'draft');
  const slugBase=slugify(`${form.catalogue_no}-${form.title}`)||`release-${Date.now()}`;
  const {data:product,error:pErr}=await supabase.from('products').insert({catalogue_no:form.catalogue_no.trim(),slug:slugBase,title:form.title.trim(),artist_project:form.artist_project.trim()||null,description:form.description.trim()||null,has_shrinkwrap:form.has_shrinkwrap,status:dbStatus,is_public:dbStatus==='active'||dbStatus==='forthcoming'}).select('id').single();
  if(pErr){setSaving(false);setMessage(`Product: ${pErr.message}`);return;}
  const stock=Math.max(0,Number.parseInt(form.stock||'0',10)||0); const price=Math.max(0,Number.parseFloat(form.price||'0')||0);
  const sku=`${form.catalogue_no.trim()}-${form.format}`.replace(/\s+/g,'-');
  const {error:vErr}=await supabase.from('product_variants').insert({product_id:product.id,sku,format:form.format.toLowerCase()==='cassette'?'cassette':'cd',edition_name:form.title.trim(),price,currency:'TRY',manufactured_qty:stock,stock_qty:stock,reserved_qty:0,active:true});
  if(vErr){setSaving(false);setMessage(`Edition: ${vErr.message}`);return;}

  let artworkWarning='';
  if(artwork){
   const ext=(artwork.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'');
   const path=`${product.id}/cover.${ext}`;
   const {error:uploadErr}=await supabase.storage.from('release-artwork').upload(path,artwork,{cacheControl:'3600',upsert:true,contentType:artwork.type});
   if(uploadErr) artworkWarning=` Artwork upload failed: ${uploadErr.message}`;
   else {
    const {error:updateErr}=await supabase.from('products').update({artwork_path:path}).eq('id',product.id);
    if(updateErr) artworkWarning=` Artwork link failed: ${updateErr.message}`;
   }
  }
  setSaving(false);
  setMessage((draft?'Draft saved.':'Release created.')+artworkWarning);
  if(!artworkWarning)setTimeout(()=>window.location.reload(),700);
 }

 return <section id="new-release" className="adminSection releaseWorkspace"><div className="sectionLabel"><span>NEW / RELEASE WORKSPACE</span><p>Prepare the next physical object.</p></div><div className="releaseGrid"><div className="adminPanel releaseForm"><div className="formIntro"><span>DATABASE + STORAGE CONNECTED</span><h2>New <em>release.</em></h2><p>Release data and optional cover artwork are written to the live Side:II catalogue.</p></div><div className="formGrid">
 <label><span>CATALOGUE NO.</span><input value={form.catalogue_no} onChange={e=>set('catalogue_no',e.target.value)}/></label><label><span>EDITION TITLE</span><input value={form.title} onChange={e=>set('title',e.target.value)}/></label>
 <label><span>FORMAT</span><select value={form.format} onChange={e=>set('format',e.target.value)}><option>CD</option><option>CASSETTE</option></select></label><label><span>STATUS</span><select value={form.status} onChange={e=>set('status',e.target.value)}><option>DRAFT</option><option>IN PREPARATION</option><option>FORTHCOMING</option><option>AVAILABLE</option></select></label>
 <label><span>PRICE / TRY</span><input inputMode="decimal" value={form.price} onChange={e=>set('price',e.target.value)} placeholder="0"/></label><label><span>INITIAL STOCK</span><input inputMode="numeric" value={form.stock} onChange={e=>set('stock',e.target.value)} placeholder="0"/></label>
 <label className="wideField"><span>ARTIST / PROJECT</span><input value={form.artist_project} onChange={e=>set('artist_project',e.target.value)} placeholder="Artist or project name"/></label>
 <label className="wideField artworkField"><span>ALBUM ARTWORK · OPTIONAL</span><div className="artworkPicker"><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={e=>chooseArtwork(e.target.files?.[0]||null)}/><div><b>{artwork?artwork.name:'No artwork selected'}</b><small>JPG · PNG · WEBP · AVIF / max 10 MB</small></div></div></label>
 <label className="wideField wrapChoice"><span>PHYSICAL FINISH</span><div className="finishToggle"><input id="shrinkwrap" type="checkbox" checked={form.has_shrinkwrap} onChange={e=>set('has_shrinkwrap',e.target.checked)}/><label htmlFor="shrinkwrap"><b>SHRINKWRAP / CELLOPHANE</b><small>Add a restrained glossy reflection over the artwork.</small></label></div></label>
 <label className="wideField"><span>SHORT DESCRIPTION</span><textarea rows="4" value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Edition note, concept or production detail…"/></label></div>
 {message&&<p className="workspaceMessage">{message}</p>}<div className="formActions"><button type="button" className="ghostButton" disabled={saving} onClick={()=>save(true)}>SAVE DRAFT</button><button type="button" className="saveButton" disabled={saving} onClick={()=>save(false)}>{saving?'SAVING…':'CREATE RELEASE →'}</button></div></div>
 <aside className="releasePreview"><span>LIVE PREVIEW</span><div className="previewObject"><div className={`previewSleeve ${artworkPreview?'hasArtwork':''} ${form.has_shrinkwrap?'shrinkwrap':''}`}>{artworkPreview?<img src={artworkPreview} alt="Artwork preview"/>:<><small>{form.catalogue_no||'SIDEII—003'}</small><strong>side:II</strong><b>{(form.catalogue_no.match(/\d+/)||['03'])[0].slice(-2)}</b><em>{(form.title||'NEW EDITION').toUpperCase()}</em></>}</div><div className="previewDisc"><i/></div></div><div className="previewMeta"><small>PHYSICAL OBJECT</small><h3>{form.title||'New Edition'}<br/><em>Edition.</em></h3><p>{form.format} · {form.status}{artwork?' · ARTWORK READY':''}</p></div></aside></div></section>;
}
