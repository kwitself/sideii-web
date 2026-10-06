'use client';

import {useState} from 'react';
import {supabase} from '../lib/supabase';

const initial={title:'',category:'apparel',imprint:'sideii',description:'',status:'draft',price:'',stock:'',size:'',color:'BLACK',style:'',weight_g:'',sku:''};

export default function MerchWorkspace({onCreated,onContinue}){
 const [form,setForm]=useState(initial),[saving,setSaving]=useState(false),[message,setMessage]=useState('');
 const [imagePreview,setImagePreview]=useState('');
 const set=(k,v)=>setForm(p=>({...p,[k]:v}));
 async function save(){
  if(!form.title.trim()){setMessage('Product name is required.');return}
  setSaving(true);setMessage('');
  const {data:createdId,error}=await supabase.rpc('admin_create_merch',{
   p_title:form.title.trim(),p_category:form.category,p_imprint:form.imprint,p_description:form.description.trim()||null,p_status:form.status,
   p_price:Math.max(0,Number(form.price)||0),p_stock:Math.max(0,parseInt(form.stock||'0',10)||0),p_size:form.size.trim()||null,
   p_color:form.color.trim()||null,p_style:form.style.trim()||null,p_weight_g:form.weight_g?Math.max(0,parseInt(form.weight_g,10)||0):null,p_sku:form.sku.trim()||null
  });
  setSaving(false);if(error){setMessage(error.message);return}
  setMessage('Merch product created. Opening product studio…');
  let createdProduct=null;
  if(createdId){
   const {data}=await supabase.from('products').select('id,catalogue_no,slug,title,artist_project,description,imprint,artwork_path,gallery_images,status,is_public,product_origin,homepage_selected,product_type,merch_category,created_at,product_variants(id,sku,format,edition_name,price,currency,manufactured_qty,stock_qty,reserved_qty,active,option_size,option_color,option_style,weight_g,shipping_class)').eq('id',createdId).single();
   createdProduct=data||null;
  }
  setForm(initial);setImagePreview('');if(onCreated)await onCreated();if(createdProduct&&onContinue)onContinue(createdProduct);
 }
 return <section id="new-merch" className="adminSection merchWorkspace"><div className="sectionLabel"><span>NEW / MERCH WORKSPACE</span><p>Apparel, objects, patches and accessories.</p></div>
 <div className="adminPanel merchForm merchCreateV2">
  <div className="formIntro"><span>COMMERCE + INVENTORY CONNECTED</span><h2>New <em>merch.</em></h2><p>Create the base product, then continue directly into the same product studio for gallery, size × colour variants, stock and publishing.</p></div>
  <div className="merchCreateGrid">
   <aside className="merchImagePanel">
    {imagePreview?<img src={imagePreview} alt="New merch preview"/>:<div className="merchImageEmpty">PRODUCT PREVIEW</div>}
    <label className="uploadButton">CHOOSE PREVIEW<input type="file" accept="image/*" hidden onChange={e=>{const f=e.target.files?.[0];if(f)setImagePreview(URL.createObjectURL(f))}}/></label>
    <small>Preview only until the product is created. Permanent gallery images are managed in the editor.</small>
   </aside>
   <div className="formGrid">
    <label><span>PRODUCT NAME</span><input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="SIDE:II Logo T-Shirt"/></label>
    <label><span>CATEGORY</span><select value={form.category} onChange={e=>set('category',e.target.value)}><option value="apparel">APPAREL / T-SHIRT</option><option value="mug">MUG</option><option value="lighter">LIGHTER</option><option value="beanie">BEANIE</option><option value="patch">PATCH</option><option value="accessory">OTHER ACCESSORY</option></select></label>
    <label><span>IMPRINT</span><select value={form.imprint} onChange={e=>set('imprint',e.target.value)}><option value="sideii">SIDE:II</option><option value="lethargia">LETHARGIA RECORDS</option></select></label>
    <label><span>STATUS</span><select value={form.status} onChange={e=>set('status',e.target.value)}><option value="draft">DRAFT</option><option value="forthcoming">FORTHCOMING</option><option value="active">AVAILABLE</option></select></label>
    <label><span>PRICE / TRY</span><input type="number" min="0" step="0.01" inputMode="decimal" value={form.price} onChange={e=>set('price',e.target.value)} placeholder="0.00"/></label>
    <label><span>INITIAL STOCK</span><input type="number" min="0" value={form.stock} onChange={e=>set('stock',e.target.value)} placeholder="0"/></label>
    {form.category==='apparel'&&<label><span>SIZE</span><select value={form.size} onChange={e=>set('size',e.target.value)}><option value="">SELECT SIZE</option><option>S</option><option>M</option><option>L</option><option>XL</option><option>XXL</option></select></label>}
    <label><span>COLOR</span><input value={form.color} onChange={e=>set('color',e.target.value)} placeholder="BLACK"/></label>
    <label><span>STYLE / MODEL</span><input value={form.style} onChange={e=>set('style',e.target.value)} placeholder="Embroidered / Ceramic / Heavy Tee"/></label>
    <label><span>WEIGHT / G · OPTIONAL</span><input type="number" min="0" value={form.weight_g} onChange={e=>set('weight_g',e.target.value)}/></label>
    <label className="wideField"><span>SKU · OPTIONAL / AUTO IF EMPTY</span><input value={form.sku} onChange={e=>set('sku',e.target.value)} placeholder="SIDEII-TEE-BLK-L"/></label>
    <label className="wideField"><span>DESCRIPTION</span><textarea rows="4" value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Material, print, dimensions or object details…"/></label>
   </div>
  </div>
  {message&&<p className="workspaceMessage">{message}</p>}
  <div className="formActions"><button type="button" className="saveButton" disabled={saving} onClick={save}>{saving?'CREATING…':'CREATE & CONTINUE →'}</button></div>
 </div></section>;
}