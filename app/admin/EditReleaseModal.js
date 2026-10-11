'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import ProductPreviewPanel from './ProductPreviewPanel';
import {VINYL_PRESETS,VINYL_PRESET_GROUPS,getVinylPreset} from '../lib/vinylPresets';

const STATUS=[['draft','DRAFT'],['forthcoming','FORTHCOMING'],['active','AVAILABLE'],['archived','ARCHIVED']];
const FORMATS=['cd','cassette','vinyl','digital'];

const STOREFRONT_DEFAULTS={
 card:{image_fit:'contain',image_position:'center',crop_x:50,crop_y:50,secondary_hover:true,secondary_mobile:false,title_scale:'regular',stock_mode:'quantity',wishlist:true,quick_add:true,density:'regular',metadata:true,stock:true,edition_count:true,price_mode:'standard',cta:'auto',classic_cta:'inherit',editorial_cta:'inherit'},
 badge:{mode:'auto',text:'',tone:'neutral'},
 hover:{format:'auto',animation:'slide',scale:1,direction:'right',mobile:false},
 visibility:{store:true,homepage:true,wear:true,collections:true,search:true,archive:true,related:true,google:true,meta:true,pinterest:true,microsoft:true,tiktok:true},
 detail:{default_variant:'auto',default_side:'front',gallery_layout:'grid',facts:true,tracklist:true,credits:true,object_note:true,press_kit:true,listening_preview:true,related:true,sticky_buy:true}
};
function storefrontConfig(value={}){
 return {
  card:{...STOREFRONT_DEFAULTS.card,...(value.card||{})},
  badge:{...STOREFRONT_DEFAULTS.badge,...(value.badge||{})},
  hover:{...STOREFRONT_DEFAULTS.hover,...(value.hover||{})},
  visibility:{...STOREFRONT_DEFAULTS.visibility,...(value.visibility||{})},
  detail:{...STOREFRONT_DEFAULTS.detail,...(value.detail||{})}
 };
}

const COMMERCE_DEFAULTS={waitlist:true,back_in_stock:true,min_qty:1,max_qty:null,bundle_eligible:true,discount_eligible:true,free_shipping_eligible:true,store_credit_eligible:true};
function commerceConfig(value={}){return {...COMMERCE_DEFAULTS,...(value||{})}}

const SEO_DEFAULTS={title:'',description:'',canonical:'',og_image:'',structured_data:true,brand:'SIDE:II',gtin:'',mpn:'',google_category:'',condition:'new'};
function seoConfig(value={}){return {...SEO_DEFAULTS,...(value||{})}}

const cleanVariant=(v={})=>({id:v.id||null,sku:v.sku||'',format:v.format||'cd',price:String(v.price??0),stock:String(v.stock_qty??0),reserved_qty:Number(v.reserved_qty||0),manufactured_qty:Number(v.manufactured_qty||0),edition_name:v.edition_name||'',edition_details:v.edition_details||'',digital_formats:Array.isArray(v.digital_formats)?v.digital_formats.join(', '):'WAV, FLAC, MP3',audio_specs:v.audio_specs||'24 BIT / 44.1 kHz',vinyl_size:v.vinyl_size||'12 INCH',vinyl_speed:v.vinyl_speed||'33 RPM',vinyl_weight_g:String(v.vinyl_weight_g||180),vinyl_color:v.vinyl_color||'BLACK',shipping_class:v.shipping_class||'',weight_g:String(v.weight_g??''),low_stock_threshold:String(v.low_stock_threshold??0),preorder_enabled:!!v.preorder_enabled,preorder_limit:String(v.preorder_limit??''),preorder_target:String(v.preorder_target??''),preorder_deadline:v.preorder_deadline||'',edition_numbering_enabled:!!v.edition_numbering_enabled,edition_total:String(v.edition_total??''),active:v.active!==false,digital_download_url:v.digital_download_url||null});

function tracklistForEditor(value){
 if(!Array.isArray(value))return '';
 return value.map(item=>{
  if(typeof item==='string')return item==='[object Object]'?'':item;
  if(item&&typeof item==='object')return String(item.title??item.name??item.label??item.track_title??'');
  return '';
 }).filter(Boolean).join('\n');
}

export default function EditReleaseModal({product,onClose,onSaved}){
 const initialVariants=(product?.product_variants||[]).map(cleanVariant);
 const [tab,setTab]=useState(product.__initialTab||'release');
 const [form,setForm]=useState({catalogue_no:product.catalogue_no||'',title:product.title||'',artist_project:product.artist_project||'',description:product.description||'',imprint:product.imprint||'sideii',status:product.status||'draft',has_shrinkwrap:!!product.has_shrinkwrap,release_date:product.release_date||'',credits:product.credits||'',tracklist:tracklistForEditor(product.tracklist),product_origin:product.product_origin||'own',original_label:product.original_label||'',original_catalogue_no:product.original_catalogue_no||'',barcode:product.barcode||''});
 const [storefront,setStorefront]=useState(()=>storefrontConfig(product.storefront_config));
 const [seo,setSeo]=useState(()=>seoConfig(product.seo_config));
 const [commerce,setCommerce]=useState(()=>commerceConfig(product.commerce_config));
 const [variants,setVariants]=useState(initialVariants.length?initialVariants:[cleanVariant({sku:`${product.catalogue_no||'SIDEII'}-CD`})]);
 const [removedVariants,setRemovedVariants]=useState([]);
 const initialGallery=(Array.isArray(product.gallery_images)?product.gallery_images:[]).map(x=>typeof x==='string'?x:(x?.path||x?.url||'')).filter(x=>x&&!/^https?:\/\//i.test(x));
 const [file,setFile]=useState(null); const [preview,setPreview]=useState(''); const [gallery,setGallery]=useState(initialGallery); const [galleryFiles,setGalleryFiles]=useState([]);
 const [digitalZipFiles,setDigitalZipFiles]=useState({}); const [backImageFile,setBackImageFile]=useState(null); const [saving,setSaving]=useState(false); const [message,setMessage]=useState(''); const [dirty,setDirty]=useState(false);
 const set=(k,v)=>{setDirty(true);setForm(p=>({...p,[k]:v}))};
 const setStore=(section,key,value)=>{setDirty(true);setStorefront(p=>({...p,[section]:{...p[section],[key]:value}}))};
 const setSeoValue=(key,value)=>{setDirty(true);setSeo(p=>({...p,[key]:value}))};
 const setCommerceValue=(key,value)=>{setDirty(true);setCommerce(p=>({...p,[key]:value}))};
 useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview);galleryFiles.forEach(x=>URL.revokeObjectURL(x.preview))},[preview,galleryFiles]);
 useEffect(()=>{const before=e=>{if(!dirty)return;e.preventDefault();e.returnValue=''};window.addEventListener('beforeunload',before);return()=>window.removeEventListener('beforeunload',before)},[dirty]);
 const safeClose=()=>{if(dirty&&!window.confirm('You have unsaved changes. Close without saving?'))return;onClose()};
 const publicUrl=path=>supabase.storage.from('release-artwork').getPublicUrl(path).data.publicUrl;
 const current=product.artwork_path?publicUrl(product.artwork_path):'';
 const existingGallery=useMemo(()=>gallery.map((path,i)=>({kind:'existing',path,preview:publicUrl(path),name:`Gallery ${i+1}`})),[gallery]);
 const livePreviewProduct=useMemo(()=>({
  ...product,
  catalogue_no:form.catalogue_no,
  title:form.title,
  artist_project:form.artist_project,
  description:form.description,
  imprint:form.imprint,
  status:form.status,
  barcode:form.barcode,
  storefront_config:storefront,
  seo_config:seo,
  preview_cover_url:preview||current||null,
  gallery_images:[
   ...existingGallery.map(x=>({url:x.preview})),
   ...galleryFiles.map(x=>({url:x.preview}))
  ],
  product_variants:variants.map(v=>({
   ...v,
   price:Number(v.price||0),
   stock_qty:Number(v.stock||0),
   reserved_qty:Number(v.reserved_qty||0),
   preorder_enabled:!!v.preorder_enabled
  }))
 }),[product,form,storefront,seo,preview,current,existingGallery,galleryFiles,variants]);
 const feedBlockers=[
  storefront.visibility.google===false?'GOOGLE CHANNEL IS OFF':null,
  storefront.visibility.store===false?'STORE VISIBILITY IS OFF':null,
  !form.title.trim()?'TITLE IS MISSING':null,
  !(preview||current)?'PRIMARY PRODUCT IMAGE IS MISSING':null,
  !variants.some(v=>v.price!==''&&Number(v.price)>=0)?'NO PRICED VARIANT':null,
  form.status!=='active'&&!variants.some(v=>v.preorder_enabled)?'PRODUCT IS NOT ACTIVE OR PRE-ORDERABLE':null
 ].filter(Boolean);
 const feedWarnings=[
  !(seo.gtin||form.barcode||seo.mpn)?'NO GTIN / BARCODE / MPN — IDENTIFIER_EXISTS=NO':null,
  !seo.google_category?'GOOGLE PRODUCT CATEGORY NOT SET':null
 ].filter(Boolean);

 function validImage(f){return f&&f.type.startsWith('image/')&&f.size<=10*1024*1024}
 function pick(f){setDirty(true);if(preview)URL.revokeObjectURL(preview);if(!f){setFile(null);setPreview('');return}if(!validImage(f)){setMessage('Use JPG, PNG, WEBP or AVIF up to 10 MB.');return}setFile(f);setPreview(URL.createObjectURL(f));setMessage('')}
 function addGallery(files){setDirty(true);const next=[...files].filter(validImage).map(f=>({file:f,preview:URL.createObjectURL(f),name:f.name}));if(next.length!==files.length)setMessage('Some files were skipped. Images must be 10 MB or smaller.');setGalleryFiles(p=>[...p,...next])}
 function removeExisting(path){setDirty(true);setGallery(p=>p.filter(x=>x!==path))}
 function removeNew(i){setDirty(true);setGalleryFiles(p=>{URL.revokeObjectURL(p[i].preview);return p.filter((_,n)=>n!==i)})}
 function moveExisting(i,dir){setDirty(true);setGallery(p=>{const n=[...p],j=i+dir;if(j<0||j>=n.length)return p;[n[i],n[j]]=[n[j],n[i]];return n})}
 function updateVariant(i,k,v){setDirty(true);setVariants(p=>p.map((x,n)=>n===i?{...x,[k]:v}:x))}
 function addVariant(){setDirty(true);const format=!variants.some(v=>v.format==='cd')?'cd':!variants.some(v=>v.format==='cassette')?'cassette':!variants.some(v=>v.format==='vinyl')?'vinyl':'digital';setVariants(p=>[...p,cleanVariant({sku:`${form.catalogue_no||'SIDEII'}-${format==='cd'?'CD':format==='cassette'?'CS':format==='vinyl'?'LP':'DIG'}-${p.length+1}`,format,edition_name:form.title})])}
 function removeVariant(i){setDirty(true);const v=variants[i];if(v.id)setRemovedVariants(p=>[...p,v.id]);setVariants(p=>p.filter((_,n)=>n!==i))}

 async function save(){
  if(form.tracklist.split('\n').some(x=>x.trim()==='[object Object]')){setMessage('Tracklist contains invalid [object Object] entries. Replace them with track titles.');setTab('release');return}
  if(!variants.length){setMessage('Keep at least one edition.');setTab('media');return}
  setSaving(true);setMessage('');
  try{
   let artworkPath=product.artwork_path||null;
   if(file){const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'');const path=`${product.id}/cover.${ext}`;const {error:u}=await supabase.storage.from('release-artwork').upload(path,file,{upsert:true,contentType:file.type,cacheControl:'3600'});if(u)throw u;if(artworkPath&&artworkPath!==path)await supabase.storage.from('release-artwork').remove([artworkPath]);artworkPath=path}
   let backImagePath=storefront.detail?.back_cover_image||null;
   if(backImageFile){const ext=(backImageFile.name.split('.').pop()||'png').toLowerCase().replace(/[^a-z0-9]/g,'');const path=`${product.id}/back-cover-${Date.now()}.${ext}`;const {error}=await supabase.storage.from('release-artwork').upload(path,backImageFile,{upsert:false,contentType:backImageFile.type,cacheControl:'3600'});if(error)throw error;backImagePath=path}
   const savedStorefront={...storefront,detail:{...storefront.detail,back_cover_image:backImagePath}};
   const uploaded=[];
   for(const item of galleryFiles){const ext=(item.file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'');const path=`${product.id}/gallery/${Date.now()}-${uploaded.length}.${ext}`;const {error}=await supabase.storage.from('release-artwork').upload(path,item.file,{upsert:false,contentType:item.file.type,cacheControl:'3600'});if(error)throw error;uploaded.push(path)}
   const removed=initialGallery.filter(x=>!gallery.includes(x));if(removed.length)await supabase.storage.from('release-artwork').remove(removed);
   const galleryPaths=[...gallery,...uploaded];
   const isPublic=['active','forthcoming'].includes(form.status);
   const {error:p}=await supabase.from('products').update({catalogue_no:form.catalogue_no.trim(),title:form.title.trim(),artist_project:form.artist_project.trim()||null,description:form.description.trim()||null,imprint:form.imprint,status:form.status,is_public:isPublic,has_shrinkwrap:form.has_shrinkwrap,release_date:form.release_date||null,credits:form.credits.trim()||null,tracklist:form.tracklist.split('\n').map(x=>x.trim()).filter(Boolean),product_origin:form.product_origin,original_label:form.product_origin==='distributed'?(form.original_label.trim()||null):null,original_catalogue_no:form.product_origin==='distributed'?(form.original_catalogue_no.trim()||null):null,barcode:form.barcode.trim()||null,storefront_config:savedStorefront,seo_config:seo,commerce_config:commerce,artwork_path:artworkPath,gallery_images:galleryPaths}).eq('id',product.id);if(p)throw p;
   for(const id of removedVariants){const {error}=await supabase.from('product_variants').delete().eq('id',id);if(error)throw error}
   for(const [i,v] of variants.entries()){let digitalPath=v.digital_download_url||null;const zip=digitalZipFiles[i];if(v.format==='digital'&&zip){const safe=zip.name.replace(/[^a-zA-Z0-9._-]/g,'_');const path=`${product.id}/${v.id||'new-'+i}/${Date.now()}-${safe}`;const {error:uploadError}=await supabase.storage.from('digital-delivery').upload(path,zip,{upsert:false,contentType:'application/zip'});if(uploadError)throw uploadError;digitalPath='storage-private://'+path}const stock=Math.max(0,parseInt(v.stock||'0',10)||0),price=Math.max(0,parseFloat(v.price||'0')||0);const payload={product_id:product.id,sku:v.sku.trim()||`${form.catalogue_no}-${v.format.toUpperCase()}-${i+1}`,format:v.format,price,currency:'TRY',stock_qty:stock,manufactured_qty:Math.max(stock+Number(v.reserved_qty||0),Number(v.manufactured_qty||0)),reserved_qty:Number(v.reserved_qty||0),edition_name:v.edition_name.trim()||form.title.trim(),edition_details:v.edition_details.trim()||null,digital_formats:v.format==='digital'?v.digital_formats.split(',').map(x=>x.trim().toUpperCase()).filter(Boolean):[],audio_specs:v.format==='digital'?(v.audio_specs.trim()||null):null,vinyl_size:v.format==='vinyl'?v.vinyl_size:null,vinyl_speed:v.format==='vinyl'?v.vinyl_speed:null,vinyl_weight_g:v.format==='vinyl'?(parseInt(v.vinyl_weight_g||'0',10)||null):null,vinyl_color:v.format==='vinyl'?(v.vinyl_color.trim()||null):null,shipping_class:v.shipping_class.trim()||null,weight_g:v.weight_g===''?null:Math.max(0,parseInt(v.weight_g||'0',10)||0),low_stock_threshold:Math.max(0,parseInt(v.low_stock_threshold||'0',10)||0),preorder_enabled:!!v.preorder_enabled,preorder_limit:v.preorder_limit===''?null:Math.max(1,parseInt(v.preorder_limit||'1',10)||1),preorder_target:v.preorder_target===''?null:Math.max(1,parseInt(v.preorder_target||'1',10)||1),preorder_deadline:v.preorder_deadline||null,edition_numbering_enabled:!!v.edition_numbering_enabled,edition_total:v.edition_total===''?null:Math.max(1,parseInt(v.edition_total||'1',10)||1),active:v.active,digital_download_url:v.format==='digital'?digitalPath:null};const q=v.id?supabase.from('product_variants').update(payload).eq('id',v.id):supabase.from('product_variants').insert(payload);const {error}=await q;if(error)throw error}
   setDirty(false);await onSaved();onClose();
  }catch(e){setMessage(e?.message||'Update failed.')}finally{setSaving(false)}
 }

 return createPortal(<div className="editOverlay" onMouseDown={e=>{if(e.target===e.currentTarget)safeClose()}}><section className="editModal releaseV2Modal"><header><div><span>EDIT / RELEASE V2</span><h2>{product.title}</h2></div><button onClick={safeClose}>CLOSE ×</button></header>
 <nav className="editTabs">{[['release','RELEASE'],['media',`MEDIA · ${variants.length}`],['gallery',`GALLERY · ${gallery.length+galleryFiles.length}`],['storefront','STOREFRONT'],['commerce','COMMERCE'],['seo','SEO / FEEDS']].map(([v,l])=><button key={v} className={tab===v?'active':''} onClick={()=>setTab(v)}>{l}</button>)}</nav>
 {tab==='release'&&<div className="editBody"><div className="editFields">
 <label>PRODUCT ORIGIN<select value={form.product_origin} onChange={e=>set('product_origin',e.target.value)}><option value="own">OWN RELEASE</option><option value="distributed">SELECTED / DISTRIBUTION</option></select></label><label>IMPRINT<select value={form.imprint} onChange={e=>set('imprint',e.target.value)} disabled={form.product_origin==='distributed'}><option value="sideii">SIDE:II</option><option value="lethargia">LETHARGIA RECORDS</option></select></label>{form.product_origin==='distributed'&&<><label>ORIGINAL LABEL<input required value={form.original_label} onChange={e=>set('original_label',e.target.value)} placeholder="e.g. 4AD"/></label><label>ORIGINAL CATALOGUE NO.<input value={form.original_catalogue_no} onChange={e=>set('original_catalogue_no',e.target.value)}/></label></>}<label>BARCODE / EAN<input value={form.barcode} onChange={e=>set('barcode',e.target.value)}/></label><label>CATALOGUE NO.<input value={form.catalogue_no} onChange={e=>set('catalogue_no',e.target.value)}/></label><label>TITLE<input value={form.title} onChange={e=>set('title',e.target.value)}/></label><label>STATUS<select value={form.status} onChange={e=>set('status',e.target.value)}>{STATUS.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label><label>RELEASE DATE<input type="date" value={form.release_date} onChange={e=>set('release_date',e.target.value)}/></label><label>ARTIST / PROJECT<input value={form.artist_project} onChange={e=>set('artist_project',e.target.value)}/></label>
 <label className="editWide">TRACKLIST · ONE TRACK PER LINE<textarea rows="6" value={form.tracklist} onChange={e=>set('tracklist',e.target.value)}/></label><label className="editWide">BACK COVER / TRACKLIST IMAGE<input type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={e=>{const f=e.target.files?.[0]||null;if(f&&(!f.type.startsWith("image/")||f.size>8*1024*1024)){setMessage("Choose an image under 8 MB.");return}setBackImageFile(f);setDirty(true)}}/><small>Optional: uploaded artwork replaces the generated rear tracklist. Saved with this release.</small>{(backImageFile||storefront.detail?.back_cover_image)&&<small>{backImageFile?backImageFile.name:"BACK COVER SAVED"} <button type="button" onClick={()=>{setBackImageFile(null);setStore("detail","back_cover_image",null)}}>REMOVE BACK IMAGE</button></small>}</label><label className="editWide">CREDITS<textarea rows="5" value={form.credits} onChange={e=>set('credits',e.target.value)}/></label><label className="editWide">DESCRIPTION<textarea rows="4" value={form.description} onChange={e=>set('description',e.target.value)}/></label><label className="editWide">PRIMARY ARTWORK<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={e=>pick(e.target.files?.[0]||null)}/></label><label className="editWide editCheck"><input type="checkbox" checked={form.has_shrinkwrap} onChange={e=>set('has_shrinkwrap',e.target.checked)}/><span>SHRINKWRAP / CELLOPHANE</span></label>
 </div><aside className="editArtwork">{(preview||current)?<img src={preview||current} alt=""/>:<div>NO ARTWORK</div>}<small>{file?'NEW ARTWORK':'CURRENT ARTWORK'}</small></aside></div>}
 {tab==='media'&&<div className="editionManager"><div className="editionManagerHead"><div><span>EDITIONS / MEDIA</span><p>CD, cassette, vinyl and digital editions with independent SKU, price and availability.</p></div><button onClick={addVariant}>＋ ADD EDITION</button></div>{variants.map((v,i)=><article className="editionEditor" key={v.id||`new-${i}`}><header><strong>{String(i+1).padStart(2,'0')} / {v.format.toUpperCase()}</strong><button onClick={()=>removeVariant(i)} disabled={variants.length===1}>REMOVE</button></header><div><label>FORMAT<select value={v.format} onChange={e=>updateVariant(i,'format',e.target.value)}>{FORMATS.map(x=><option key={x} value={x}>{x.toUpperCase()}</option>)}</select></label><label>SKU<input value={v.sku} onChange={e=>updateVariant(i,'sku',e.target.value)}/></label><label>PRICE / TRY<input type="number" min="0" step=".01" value={v.price} onChange={e=>updateVariant(i,'price',e.target.value)}/></label>{v.format==='digital'?<label>AVAILABILITY<input value="UNLIMITED" disabled/></label>:<label>STOCK<input type="number" min="0" value={v.stock} onChange={e=>updateVariant(i,'stock',e.target.value)}/></label>}{v.format==='vinyl'&&<><label>VINYL SIZE<select value={v.vinyl_size} onChange={e=>updateVariant(i,'vinyl_size',e.target.value)}><option>12 INCH</option><option>10 INCH</option><option>7 INCH</option></select></label><label>SPEED<select value={v.vinyl_speed} onChange={e=>updateVariant(i,'vinyl_speed',e.target.value)}><option>33 RPM</option><option>45 RPM</option><option>78 RPM</option></select></label><label>WEIGHT / G<input type="number" min="0" value={v.vinyl_weight_g} onChange={e=>updateVariant(i,'vinyl_weight_g',e.target.value)}/></label><label>VINYL COLOUR / EFFECT<select value={VINYL_PRESETS.some(p=>p.name===String(v.vinyl_color||'').toUpperCase())?String(v.vinyl_color||'BLACK').toUpperCase():'__CUSTOM__'} onChange={e=>{if(e.target.value!=='__CUSTOM__')updateVariant(i,'vinyl_color',e.target.value)}}>{VINYL_PRESET_GROUPS.map(([group,families])=><optgroup key={group} label={group}>{VINYL_PRESETS.filter(p=>families.includes(p.family)).map(p=><option key={p.name} value={p.name}>{p.name}</option>)}</optgroup>)}<option value="__CUSTOM__">CUSTOM…</option></select></label>{!VINYL_PRESETS.some(p=>p.name===String(v.vinyl_color||'').toUpperCase())&&<label>CUSTOM VINYL COLOUR<input value={v.vinyl_color} onChange={e=>updateVariant(i,'vinyl_color',e.target.value)} placeholder="CUSTOM"/></label>}<div className="vinylPresetPreview" style={{'--vp-a':getVinylPreset(v.vinyl_color).primary,'--vp-b':getVinylPreset(v.vinyl_color).secondary}} data-family={getVinylPreset(v.vinyl_color).family}><i/><span>{getVinylPreset(v.vinyl_color).family.toUpperCase()}</span></div></>}{v.format==='digital'&&<><label className="editionWide">DOWNLOAD FORMATS<input value={v.digital_formats} onChange={e=>updateVariant(i,'digital_formats',e.target.value)} placeholder="WAV, FLAC, MP3"/></label><label className="editionWide">AUDIO MASTER<input value={v.audio_specs} onChange={e=>updateVariant(i,'audio_specs',e.target.value)} placeholder="24 BIT / 44.1 kHz"/></label><label className="editionWide">DIGITAL DELIVERY · PRIVATE ZIP<input type="file" accept=".zip,application/zip,application/x-zip-compressed" onChange={e=>{const file=e.target.files?.[0]||null;if(file&&(file.size>200*1024*1024||!file.name.toLowerCase().endsWith('.zip'))){setMessage('ZIP files only, maximum 200 MB.');e.target.value='';return}setDigitalZipFiles(prev=>({...prev,[i]:file}));setDirty(true)}}/><small>{digitalZipFiles[i]?'READY TO UPLOAD: '+digitalZipFiles[i].name:v.digital_download_url?'PRIVATE DOWNLOAD FILE SAVED':'NO DOWNLOAD FILE — upload ZIP and save to enable delivery'}</small>{v.digital_download_url&&<button type="button" onClick={()=>updateVariant(i,'digital_download_url',null)}>REMOVE SAVED DOWNLOAD</button>}</label></>}<label className="editionWide">EDITION / PRESSING<input value={v.edition_details} onChange={e=>updateVariant(i,'edition_details',e.target.value)} placeholder="First pressing · 100 copies"/></label><label className="editionActive"><input type="checkbox" checked={v.active} onChange={e=>updateVariant(i,'active',e.target.checked)}/> ACTIVE EDITION</label></div></article>)}</div>}
 {tab==='gallery'&&<div className="galleryManager"><div className="galleryManagerHead"><div><span>OBJECT / GALLERY</span><p>Back cover, booklet, disc face and product photography. Order is preserved.</p></div><label>＋ ADD IMAGES<input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" onChange={e=>{addGallery(e.target.files||[]);e.target.value=''}}/></label></div><div className="galleryAdminGrid">{existingGallery.map((g,i)=><article key={g.path}><img src={g.preview} alt=""/><div><span>{String(i+1).padStart(2,'0')}</span><button disabled={i===0} onClick={()=>moveExisting(i,-1)}>↑</button><button disabled={i===gallery.length-1} onClick={()=>moveExisting(i,1)}>↓</button><button onClick={()=>removeExisting(g.path)}>REMOVE</button></div></article>)}{galleryFiles.map((g,i)=><article key={g.preview} className="galleryNew"><img src={g.preview} alt=""/><div><span>NEW</span><button onClick={()=>removeNew(i)}>REMOVE</button></div></article>)}{gallery.length+galleryFiles.length===0&&<div className="galleryEmpty">NO GALLERY IMAGES YET<br/><small>Primary artwork remains the catalogue cover.</small></div>}</div></div>}
 {tab==='storefront'&&<div className="storefrontEditor"><ProductPreviewPanel products={[livePreviewProduct]} preferredProductId={livePreviewProduct.id} embedded initialMode="classic"/>
  <section className="storefrontBlock"><header><span>CARD / PRESENTATION</span><p>Control how this product is presented in catalogue and store cards.</p></header><div className="storefrontGrid">
   <label>IMAGE FIT<select value={storefront.card.image_fit} onChange={e=>setStore('card','image_fit',e.target.value)}><option value="contain">CONTAIN</option><option value="cover">COVER</option></select></label>
   <label>IMAGE POSITION<select value={storefront.card.image_position} onChange={e=>setStore('card','image_position',e.target.value)}><option value="center">CENTER</option><option value="top">TOP</option><option value="bottom">BOTTOM</option><option value="left">LEFT</option><option value="right">RIGHT</option><option value="custom">CUSTOM X / Y</option></select></label>
   {storefront.card.image_position==='custom'&&<><label>CROP X %<input type="number" min="0" max="100" value={storefront.card.crop_x??50} onChange={e=>setStore('card','crop_x',Math.max(0,Math.min(100,Number(e.target.value)||0)))}/></label><label>CROP Y %<input type="number" min="0" max="100" value={storefront.card.crop_y??50} onChange={e=>setStore('card','crop_y',Math.max(0,Math.min(100,Number(e.target.value)||0)))}/></label></>}
   <label>CARD DENSITY<select value={storefront.card.density} onChange={e=>setStore('card','density',e.target.value)}><option value="regular">REGULAR</option><option value="compact">COMPACT</option></select></label>
   <label>TITLE SCALE<select value={storefront.card.title_scale||'regular'} onChange={e=>setStore('card','title_scale',e.target.value)}><option value="small">SMALL</option><option value="regular">REGULAR</option><option value="large">LARGE</option></select></label>
   <label>STOCK DISPLAY<select value={storefront.card.stock_mode||'quantity'} onChange={e=>setStore('card','stock_mode',e.target.value)}><option value="quantity">QUANTITY</option><option value="status">STATUS ONLY</option><option value="hidden">HIDDEN</option></select></label>
   <label>PRICE MODE<select value={storefront.card.price_mode} onChange={e=>setStore('card','price_mode',e.target.value)}><option value="standard">STANDARD</option><option value="from">FROM PRICE</option><option value="hidden">HIDDEN</option></select></label>
   <label>CTA<select value={storefront.card.cta} onChange={e=>setStore('card','cta',e.target.value)}><option value="auto">AUTO</option><option value="add">ADD TO BAG</option><option value="options">SELECT OPTIONS</option><option value="view">VIEW PRODUCT</option></select></label>
   <label>CLASSIC CTA<select value={storefront.card.classic_cta||'inherit'} onChange={e=>setStore('card','classic_cta',e.target.value)}><option value="inherit">INHERIT</option><option value="add">ADD / PRE-ORDER</option><option value="options">SELECT OPTIONS</option><option value="view">VIEW PRODUCT</option></select></label>
   <label>EDITORIAL CTA<select value={storefront.card.editorial_cta||'inherit'} onChange={e=>setStore('card','editorial_cta',e.target.value)}><option value="inherit">INHERIT</option><option value="quick">QUICK ACTION</option><option value="view">VIEW PRODUCT</option></select></label>
   <label className="storefrontToggle"><input type="checkbox" checked={storefront.card.secondary_hover!==false} onChange={e=>setStore('card','secondary_hover',e.target.checked)}/><span>SECOND IMAGE HOVER</span></label>
   <label className="storefrontToggle"><input type="checkbox" checked={!!storefront.card.secondary_mobile} onChange={e=>setStore('card','secondary_mobile',e.target.checked)}/><span>SECONDARY HOVER ON MOBILE</span></label>
   <label className="storefrontToggle"><input type="checkbox" checked={!!storefront.card.wishlist} onChange={e=>setStore('card','wishlist',e.target.checked)}/><span>SHOW WISHLIST</span></label>
   <label className="storefrontToggle"><input type="checkbox" checked={!!storefront.card.quick_add} onChange={e=>setStore('card','quick_add',e.target.checked)}/><span>ALLOW QUICK ADD</span></label>
   <label className="storefrontToggle"><input type="checkbox" checked={!!storefront.card.metadata} onChange={e=>setStore('card','metadata',e.target.checked)}/><span>SHOW METADATA</span></label>
  </div></section>

  <section className="storefrontBlock"><header><span>BADGE</span><p>Use automatic stock/status badges or override them per product.</p></header><div className="storefrontGrid">
   <label>BADGE MODE<select value={storefront.badge.mode} onChange={e=>setStore('badge','mode',e.target.value)}><option value="auto">AUTO</option><option value="manual">MANUAL</option><option value="none">NONE</option></select></label>
   <label>BADGE TONE<select value={storefront.badge.tone} onChange={e=>setStore('badge','tone',e.target.value)}><option value="neutral">NEUTRAL</option><option value="warm">WARM</option><option value="alert">ALERT</option><option value="muted">MUTED</option></select></label>
   <label className="storefrontWide">MANUAL BADGE TEXT<input maxLength="28" value={storefront.badge.text||''} onChange={e=>setStore('badge','text',e.target.value)} placeholder="EXCLUSIVE / DROP / RESTOCKED"/></label>
  </div></section>

  <section className="storefrontBlock"><header><span>HOVER / MOTION</span><p>Choose the physical object and how strongly it moves behind the cover.</p></header><div className="storefrontGrid">
   <label>HOVER OBJECT<select value={storefront.hover.format} onChange={e=>setStore('hover','format',e.target.value)}><option value="auto">AUTO · MATCH EDITION</option><option value="vinyl">VINYL</option><option value="cd">CD</option><option value="cassette">CASSETTE</option><option value="none">NONE</option></select></label>
   <label>ANIMATION<select value={storefront.hover.animation} onChange={e=>setStore('hover','animation',e.target.value)}><option value="slide">SLIDE</option><option value="rotate">ROTATE</option><option value="subtle">SUBTLE</option><option value="reveal">REVEAL</option><option value="none">NONE</option></select></label>
   <label>DIRECTION<select value={storefront.hover.direction} onChange={e=>setStore('hover','direction',e.target.value)}><option value="right">RIGHT</option><option value="left">LEFT</option></select></label>
   <label>SCALE<input type="number" min=".7" max="1.35" step=".05" value={storefront.hover.scale} onChange={e=>setStore('hover','scale',Math.max(.7,Math.min(1.35,Number(e.target.value)||1)))}/></label>
   <label className="storefrontToggle"><input type="checkbox" checked={!!storefront.hover.mobile} onChange={e=>setStore('hover','mobile',e.target.checked)}/><span>ENABLE HOVER MOTION ON TOUCH / MOBILE</span></label>
  </div></section>

  <section className="storefrontBlock"><header><span>VISIBILITY</span><p>Control which surfaces are allowed to list this product.</p></header><div className="storefrontToggleGrid">
   {Object.entries({store:'STORE',homepage:'HOMEPAGE',wear:'WEAR',collections:'COLLECTIONS',search:'SEARCH',archive:'ARCHIVE',related:'RELATED PRODUCTS',google:'GOOGLE FEED',meta:'META FEED',pinterest:'PINTEREST',microsoft:'MICROSOFT',tiktok:'TIKTOK'}).map(([k,l])=><label className="storefrontToggle" key={k}><input type="checkbox" checked={storefront.visibility[k]!==false} onChange={e=>setStore('visibility',k,e.target.checked)}/><span>{l}</span></label>)}
  </div></section>

  <section className="storefrontBlock"><header><span>PRODUCT DETAIL</span><p>Choose which content modules are visible on the product page.</p></header><div className="storefrontGrid">
   <label>DEFAULT VARIANT<select value={storefront.detail.default_variant} onChange={e=>setStore('detail','default_variant',e.target.value)}><option value="auto">AUTO</option>{variants.map(v=><option key={v.id||v.sku} value={v.id||v.sku}>{v.format.toUpperCase()} · {v.sku||'VARIANT'}</option>)}</select></label>
   <label>DEFAULT SIDE<select value={storefront.detail.default_side} onChange={e=>setStore('detail','default_side',e.target.value)}><option value="front">FRONT</option><option value="back">BACK</option></select></label>
   <label>GALLERY LAYOUT<select value={storefront.detail.gallery_layout} onChange={e=>setStore('detail','gallery_layout',e.target.value)}><option value="grid">GRID</option><option value="strip">STRIP</option><option value="masonry">MASONRY</option></select></label>
   {Object.entries({facts:'FACTS',tracklist:'TRACKLIST',credits:'CREDITS',object_note:'THE OBJECT',press_kit:'PRESS KIT',listening_preview:'LISTENING PREVIEW',related:'RELATED PRODUCTS',sticky_buy:'STICKY BUY PANEL'}).map(([k,l])=><label className="storefrontToggle" key={k}><input type="checkbox" checked={storefront.detail[k]!==false} onChange={e=>setStore('detail',k,e.target.checked)}/><span>{l}</span></label>)}
  </div></section>
 </div>}
 {tab==='commerce'&&<div className="storefrontEditor commerceEditor">
  <section className="storefrontBlock"><header><span>PRODUCT COMMERCE</span><p>Sales eligibility and quantity behaviour shared across all editions of this product.</p></header><div className="storefrontGrid">
   <label>MIN QTY<input type="number" min="1" value={commerce.min_qty??1} onChange={e=>setCommerceValue('min_qty',Math.max(1,parseInt(e.target.value||'1',10)||1))}/></label>
   <label>MAX QTY<input type="number" min="1" value={commerce.max_qty??''} onChange={e=>setCommerceValue('max_qty',e.target.value===''?null:Math.max(1,parseInt(e.target.value,10)||1))} placeholder="NO LIMIT"/></label>
   <label className="storefrontToggle"><input type="checkbox" checked={commerce.waitlist!==false} onChange={e=>setCommerceValue('waitlist',e.target.checked)}/><span>WAITLIST ENABLED</span></label>
   <label className="storefrontToggle"><input type="checkbox" checked={commerce.back_in_stock!==false} onChange={e=>setCommerceValue('back_in_stock',e.target.checked)}/><span>BACK-IN-STOCK EMAIL</span></label>
   <label className="storefrontToggle"><input type="checkbox" checked={commerce.bundle_eligible!==false} onChange={e=>setCommerceValue('bundle_eligible',e.target.checked)}/><span>BUNDLE ELIGIBLE</span></label>
   <label className="storefrontToggle"><input type="checkbox" checked={commerce.discount_eligible!==false} onChange={e=>setCommerceValue('discount_eligible',e.target.checked)}/><span>DISCOUNT ELIGIBLE</span></label>
   <label className="storefrontToggle"><input type="checkbox" checked={commerce.free_shipping_eligible!==false} onChange={e=>setCommerceValue('free_shipping_eligible',e.target.checked)}/><span>FREE SHIPPING ELIGIBLE</span></label>
   <label className="storefrontToggle"><input type="checkbox" checked={commerce.store_credit_eligible!==false} onChange={e=>setCommerceValue('store_credit_eligible',e.target.checked)}/><span>STORE CREDIT ELIGIBLE</span></label>
  </div></section>

  <section className="storefrontBlock"><header><span>VARIANT COMMERCE</span><p>Pre-order, fulfilment and edition rules are stored on the actual sellable variant.</p></header><div className="commerceVariantList">
   {variants.map((v,i)=><article key={v.id||`commerce-${i}`} className="commerceVariantCard"><header><b>{v.format.toUpperCase()}</b><small>{v.sku||'NO SKU'}</small></header><div className="storefrontGrid">
    <label>SHIPPING CLASS<input value={v.shipping_class||''} onChange={e=>updateVariant(i,'shipping_class',e.target.value)} placeholder={v.format==='vinyl'?'vinyl':'standard'}/></label>
    <label>WEIGHT / G<input type="number" min="0" value={v.weight_g} onChange={e=>updateVariant(i,'weight_g',e.target.value)}/></label>
    <label>LOW STOCK AT<input type="number" min="0" value={v.low_stock_threshold} onChange={e=>updateVariant(i,'low_stock_threshold',e.target.value)}/></label>
    <label className="storefrontToggle"><input type="checkbox" checked={!!v.preorder_enabled} onChange={e=>updateVariant(i,'preorder_enabled',e.target.checked)}/><span>PRE-ORDER ENABLED</span></label>
    <label>PRE-ORDER LIMIT<input type="number" min="1" value={v.preorder_limit} onChange={e=>updateVariant(i,'preorder_limit',e.target.value)} placeholder="NO LIMIT"/></label>
    <label>PRODUCTION TARGET<input type="number" min="1" value={v.preorder_target} onChange={e=>updateVariant(i,'preorder_target',e.target.value)} placeholder="OPTIONAL"/></label>
    <label>PRE-ORDER DEADLINE<input type="date" value={v.preorder_deadline||''} onChange={e=>updateVariant(i,'preorder_deadline',e.target.value)}/></label>
    <label className="storefrontToggle"><input type="checkbox" checked={!!v.edition_numbering_enabled} onChange={e=>updateVariant(i,'edition_numbering_enabled',e.target.checked)}/><span>NUMBERED EDITION</span></label>
    <label>EDITION TOTAL<input type="number" min="1" value={v.edition_total} onChange={e=>updateVariant(i,'edition_total',e.target.value)} placeholder="OPTIONAL"/></label>
   </div></article>)}
  </div></section>
 </div>}
 {tab==='seo'&&<div className="storefrontEditor seoEditor"><ProductPreviewPanel products={[livePreviewProduct]} preferredProductId={livePreviewProduct.id} embedded initialMode="google"/>
  <section className="storefrontBlock"><header><span>SEO / SEARCH</span><p>Override product metadata only when needed. Blank fields fall back to catalogue data.</p></header><div className="storefrontGrid">
   <label className="storefrontWide">SEO TITLE<input maxLength="70" value={seo.title||''} onChange={e=>setSeoValue('title',e.target.value)} placeholder={form.title||'Product title'}/></label>
   <label className="storefrontWide">META DESCRIPTION<textarea rows="3" value={seo.description||''} onChange={e=>setSeoValue('description',e.target.value)} placeholder={form.description||'Product description'}/></label>
   <label className="storefrontWide">CANONICAL URL<input value={seo.canonical||''} onChange={e=>setSeoValue('canonical',e.target.value)} placeholder="https://domain.com/releases/..."/></label>
   <label className="storefrontWide">OG IMAGE URL<input value={seo.og_image||''} onChange={e=>setSeoValue('og_image',e.target.value)} placeholder="Leave blank to use product cover"/></label>
   <label className="storefrontToggle"><input type="checkbox" checked={seo.structured_data!==false} onChange={e=>setSeoValue('structured_data',e.target.checked)}/><span>STRUCTURED DATA / PRODUCT SCHEMA</span></label>
  </div></section>

  <section className="storefrontBlock"><header><span>PRODUCT IDENTIFIERS</span><p>Shared by Google Shopping and future commerce feeds.</p></header><div className="storefrontGrid">
   <label>BRAND<input value={seo.brand||''} onChange={e=>setSeoValue('brand',e.target.value)} placeholder="SIDE:II"/></label>
   <label>GTIN / EAN<input value={seo.gtin||''} onChange={e=>setSeoValue('gtin',e.target.value)} placeholder={form.barcode||'Barcode / EAN'}/></label>
   <label>MPN<input value={seo.mpn||''} onChange={e=>setSeoValue('mpn',e.target.value)} placeholder={form.catalogue_no||'Catalogue / manufacturer part no.'}/></label>
   <label className="storefrontWide">GOOGLE PRODUCT CATEGORY<input value={seo.google_category||''} onChange={e=>setSeoValue('google_category',e.target.value)} placeholder="e.g. Media > Music & Sound Recordings"/></label>
   <label>CONDITION<select value={seo.condition||'new'} onChange={e=>setSeoValue('condition',e.target.value)}><option value="new">NEW</option><option value="used">USED</option><option value="refurbished">REFURBISHED</option></select></label>
  </div></section>

  <section className="storefrontBlock feedReadiness"><header><span>GOOGLE FEED READINESS</span><p>Live eligibility check against the generated Merchant Center feed.</p></header><div className="feedReadinessBody"><div className={"feedReadinessState "+(feedBlockers.length?'blocked':'ready')}><b>{feedBlockers.length?'NOT READY':'READY FOR FEED'}</b><span>{feedBlockers.length?feedBlockers.length+' blocking issue(s)':'Variant data can be exported.'}</span></div>{feedBlockers.map(x=><p className="feedIssue blocker" key={x}>{x}</p>)}{feedWarnings.map(x=><p className="feedIssue warning" key={x}>{x}</p>)}<a href="/feeds/google.xml" target="_blank" rel="noreferrer">OPEN GOOGLE XML FEED ↗</a></div></section>

  <section className="storefrontBlock"><header><span>CHANNELS</span><p>These switches will control inclusion in each generated product feed.</p></header><div className="storefrontToggleGrid">
   {Object.entries({google:'GOOGLE SHOPPING',meta:'META CATALOG',pinterest:'PINTEREST',microsoft:'MICROSOFT',tiktok:'TIKTOK'}).map(([k,l])=><label className="storefrontToggle" key={k}><input type="checkbox" checked={storefront.visibility[k]!==false} onChange={e=>setStore('visibility',k,e.target.checked)}/><span>{l}</span></label>)}
  </div></section>
 </div>}
 {message&&<p className="workspaceMessage">{message}</p>}<footer>{dirty&&<span className="unsavedFlag">UNSAVED CHANGES</span>}<button className="ghostButton" onClick={safeClose}>CANCEL</button><button className="saveButton" disabled={saving} onClick={save}>{saving?'SAVING…':'SAVE RELEASE V2 →'}</button></footer></section></div>, document.body)
}
