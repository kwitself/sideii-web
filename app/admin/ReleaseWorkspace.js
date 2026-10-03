'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const statusMap = { DRAFT:'draft', 'IN PREPARATION':'draft', FORTHCOMING:'forthcoming', AVAILABLE:'active' };

function slugify(value){return value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}

export default function ReleaseWorkspace({onCreated}){
 const [form,setForm]=useState({catalogue_no:'SIDEII—003',title:'Third Edition',format:'CD',status:'DRAFT',price:'',stock:'',artist_project:'',description:'',imprint:'sideii',has_shrinkwrap:false,release_date:'',edition_details:'',credits:'',tracklist:'',product_origin:'own',original_label:'',original_catalogue_no:'',barcode:'',vinyl_size:'12 INCH',vinyl_speed:'33 RPM',vinyl_weight_g:'180',vinyl_color:'BLACK',digital_formats:['WAV','FLAC'],audio_specs:'24 BIT / 44.1 kHz'});
 const [artwork,setArtwork]=useState(null); const [artworkPreview,setArtworkPreview]=useState('');
 const [saving,setSaving]=useState(false); const [message,setMessage]=useState('');
 const set=(k,v)=>setForm(p=>({...p,[k]:v}));

 useEffect(()=>{let live=true;(async()=>{if(!supabase||form.product_origin==='distributed')return;const {data}=await supabase.rpc('suggest_catalogue_no',{p_imprint:form.imprint});if(live&&data)set('catalogue_no',data)})();return()=>{live=false};},[form.imprint,form.product_origin]);
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
  if(!form.catalogue_no.trim()||!form.title.trim()){setMessage('Catalogue no. and title are required.');return;} if(form.product_origin==='distributed'&&!form.original_label.trim()){setMessage('Original label is required for Selected / Distribution.');return;}
  setSaving(true);setMessage('');
  const dbStatus=draft?'draft':(statusMap[form.status]||'draft');
  const slugBase=slugify(`${form.catalogue_no}-${form.title}`)||`release-${Date.now()}`;
  const {data:product,error:pErr}=await supabase.from('products').insert({catalogue_no:form.catalogue_no.trim(),slug:slugBase,title:form.title.trim(),artist_project:form.artist_project.trim()||null,description:form.description.trim()||null,imprint:form.imprint,has_shrinkwrap:form.has_shrinkwrap,release_date:form.release_date||null,credits:form.credits.trim()||null,tracklist:form.tracklist.split('\n').map(x=>x.trim()).filter(Boolean),status:dbStatus,is_public:dbStatus==='active'||dbStatus==='forthcoming',product_origin:form.product_origin,original_label:form.product_origin==='distributed'?form.original_label.trim():null,original_catalogue_no:form.product_origin==='distributed'?(form.original_catalogue_no.trim()||null):null,barcode:form.barcode.trim()||null}).select('id').single();
  if(pErr){setSaving(false);setMessage(`Product: ${pErr.message}`);return;}
  const stock=Math.max(0,Number.parseInt(form.stock||'0',10)||0); const price=Math.max(0,Number.parseFloat(form.price||'0')||0);
  const sku=`${form.catalogue_no.trim()}-${form.format}`.replace(/\s+/g,'-');
  const fmt=form.format.toLowerCase(); const {error:vErr}=await supabase.from('product_variants').insert({product_id:product.id,sku,format:fmt,edition_name:form.title.trim(),price,currency:'TRY',manufactured_qty:fmt==='digital'?0:stock,stock_qty:fmt==='digital'?0:stock,reserved_qty:0,edition_details:form.edition_details.trim()||null,active:true,digital_formats:fmt==='digital'?form.digital_formats:null,audio_specs:fmt==='digital'?(form.audio_specs.trim()||null):null,vinyl_size:fmt==='vinyl'?form.vinyl_size:null,vinyl_speed:fmt==='vinyl'?form.vinyl_speed:null,vinyl_weight_g:fmt==='vinyl'?(parseInt(form.vinyl_weight_g,10)||null):null,vinyl_color:fmt==='vinyl'?(form.vinyl_color.trim()||null):null});
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
  if(!artworkWarning){if(onCreated)await onCreated();setTimeout(()=>window.location.reload(),700);}
 }

 return <section id="new-release" className="adminSection releaseWorkspace"><div className="sectionLabel"><span>NEW / RELEASE WORKSPACE</span><p>Prepare the next physical object.</p></div><div className="releaseGrid"><div className="adminPanel releaseForm"><div className="formIntro"><span>DATABASE + STORAGE CONNECTED</span><h2>New <em>release.</em></h2><p>Release data and optional cover artwork are written to the selected live imprint catalogue.</p></div><div className="formGrid">
 <label><span>PRODUCT ORIGIN</span><select value={form.product_origin} onChange={e=>set('product_origin',e.target.value)}><option value="own">OWN RELEASE</option><option value="distributed">SELECTED / DISTRIBUTION</option></select></label><label><span>IMPRINT</span><select value={form.imprint} disabled={form.product_origin==='distributed'} onChange={e=>set("imprint",e.target.value)}><option value="sideii">SIDE:II</option><option value="lethargia">LETHARGIA RECORDS</option></select></label>{form.product_origin==='distributed'&&<><label><span>ORIGINAL LABEL</span><input value={form.original_label} onChange={e=>set('original_label',e.target.value)} placeholder="e.g. 4AD"/></label><label><span>ORIGINAL CATALOGUE NO.</span><input value={form.original_catalogue_no} onChange={e=>set('original_catalogue_no',e.target.value)} placeholder="e.g. CAD-001"/></label></>}<label><span>BARCODE / EAN</span><input value={form.barcode} onChange={e=>set('barcode',e.target.value)}/></label><label><span>CATALOGUE NO.</span><input value={form.catalogue_no} onChange={e=>set('catalogue_no',e.target.value)}/></label><label><span>EDITION TITLE</span><input value={form.title} onChange={e=>set('title',e.target.value)}/></label>
 <label><span>FORMAT</span><select value={form.format} onChange={e=>set('format',e.target.value)}><option>CD</option><option>CASSETTE</option><option>VINYL</option><option>DIGITAL</option></select></label><label><span>STATUS</span><select value={form.status} onChange={e=>set('status',e.target.value)}><option>DRAFT</option><option>IN PREPARATION</option><option>FORTHCOMING</option><option>AVAILABLE</option></select></label>
 <label><span>PRICE / TRY</span><input inputMode="decimal" value={form.price} onChange={e=>set('price',e.target.value)} placeholder="0"/></label>{form.format!=='DIGITAL'&&<label><span>INITIAL STOCK</span><input inputMode="numeric" value={form.stock} onChange={e=>set('stock',e.target.value)} placeholder="0"/></label>}
 <label><span>RELEASE DATE</span><input type="date" value={form.release_date} onChange={e=>set('release_date',e.target.value)}/></label><label><span>EDITION / PRESSING</span><input value={form.edition_details} onChange={e=>set('edition_details',e.target.value)} placeholder="First pressing · 100 copies"/></label>{form.format==='VINYL'&&<><label><span>VINYL SIZE</span><select value={form.vinyl_size} onChange={e=>set('vinyl_size',e.target.value)}><option>12 INCH</option><option>10 INCH</option><option>7 INCH</option></select></label><label><span>SPEED</span><select value={form.vinyl_speed} onChange={e=>set('vinyl_speed',e.target.value)}><option>33 RPM</option><option>45 RPM</option><option>78 RPM</option></select></label><label><span>WEIGHT / G</span><input inputMode="numeric" value={form.vinyl_weight_g} onChange={e=>set('vinyl_weight_g',e.target.value)}/></label><label><span>VINYL COLOR</span><input value={form.vinyl_color} onChange={e=>set('vinyl_color',e.target.value)}/></label></>}{form.format==='DIGITAL'&&<><label><span>DOWNLOAD FORMATS</span><input value={form.digital_formats.join(', ')} onChange={e=>set('digital_formats',e.target.value.split(',').map(x=>x.trim()).filter(Boolean))}/></label><label><span>AUDIO MASTER</span><input value={form.audio_specs} onChange={e=>set('audio_specs',e.target.value)}/></label></>}
 <label className="wideField"><span>ARTIST / PROJECT</span><input value={form.artist_project} onChange={e=>set('artist_project',e.target.value)} placeholder="Artist or project name"/></label>
 <label className="wideField artworkField"><span>ALBUM ARTWORK · OPTIONAL</span><div className="artworkPicker"><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={e=>chooseArtwork(e.target.files?.[0]||null)}/><div><b>{artwork?artwork.name:'No artwork selected'}</b><small>JPG · PNG · WEBP · AVIF / max 10 MB</small></div></div></label>
 {form.format!=='DIGITAL'&&<label className="wideField wrapChoice"><span>PHYSICAL FINISH</span><div className="finishToggle"><input id="shrinkwrap" type="checkbox" checked={form.has_shrinkwrap} onChange={e=>set('has_shrinkwrap',e.target.checked)}/><label htmlFor="shrinkwrap"><b>SHRINKWRAP / CELLOPHANE</b><small>Add a restrained glossy reflection over the artwork.</small></label></div></label>}
 <label className="wideField"><span>TRACKLIST · ONE TRACK PER LINE</span><textarea rows="6" value={form.tracklist} onChange={e=>set('tracklist',e.target.value)} placeholder={'Track One\nTrack Two\nTrack Three'}/></label>
 <label className="wideField"><span>CREDITS</span><textarea rows="5" value={form.credits} onChange={e=>set('credits',e.target.value)} placeholder="Written by… · Recorded by… · Artwork by…"/></label>
 <label className="wideField"><span>SHORT DESCRIPTION</span><textarea rows="4" value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Edition note, concept or production detail…"/></label></div>
 {message&&<p className="workspaceMessage">{message}</p>}<div className="formActions"><button type="button" className="ghostButton" disabled={saving} onClick={()=>save(true)}>SAVE DRAFT</button><button type="button" className="saveButton" disabled={saving} onClick={()=>save(false)}>{saving?'SAVING…':'CREATE RELEASE →'}</button></div></div>
 <aside className="releasePreview"><span>LIVE PREVIEW</span><div className="previewObject"><div className={`previewSleeve ${artworkPreview?'hasArtwork':''} ${form.has_shrinkwrap?'shrinkwrap':''}`}>{artworkPreview?<img src={artworkPreview} alt="Artwork preview"/>:<><small>{form.catalogue_no||'SIDEII—003'}</small><strong>side:II</strong><b>{(form.catalogue_no.match(/\d+/)||['03'])[0].slice(-2)}</b><em>{(form.title||'NEW EDITION').toUpperCase()}</em></>}</div><div className="previewDisc"><i/></div></div><div className="previewMeta"><small>PHYSICAL OBJECT</small><h3>{form.title||'New Edition'}<br/><em>Edition.</em></h3><p>{form.format} · {form.status}{artwork?' · ARTWORK READY':''}</p></div></aside></div></section>;
}
