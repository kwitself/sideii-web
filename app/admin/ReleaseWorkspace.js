'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

const statusMap = { DRAFT:'draft', 'IN PREPARATION':'in_preparation', FORTHCOMING:'forthcoming', AVAILABLE:'active' };

function slugify(value){return value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}

export default function ReleaseWorkspace(){
 const [form,setForm]=useState({catalogue_no:'SIDEII—003',title:'Third Edition',format:'CD',status:'DRAFT',price:'',stock:'',artist_project:'',description:''});
 const [saving,setSaving]=useState(false); const [message,setMessage]=useState('');
 const set=(k,v)=>setForm(p=>({...p,[k]:v}));
 async function save(draft=false){
  if(!supabase){setMessage('Supabase environment variables are missing.');return;}
  if(!form.catalogue_no.trim()||!form.title.trim()){setMessage('Catalogue no. and title are required.');return;}
  setSaving(true);setMessage('');
  const dbStatus=draft?'draft':(statusMap[form.status]||'draft');
  const slugBase=slugify(`${form.catalogue_no}-${form.title}`)||`release-${Date.now()}`;
  const {data:product,error:pErr}=await supabase.from('products').insert({catalogue_no:form.catalogue_no.trim(),slug:slugBase,title:form.title.trim(),artist_project:form.artist_project.trim()||null,description:form.description.trim()||null,status:dbStatus,is_public:dbStatus==='active'||dbStatus==='forthcoming'}).select('id').single();
  if(pErr){setSaving(false);setMessage(`Product: ${pErr.message}`);return;}
  const stock=Math.max(0,Number.parseInt(form.stock||'0',10)||0); const price=Math.max(0,Number.parseFloat(form.price||'0')||0);
  const sku=`${form.catalogue_no.trim()}-${form.format}`.replace(/\s+/g,'-');
  const {error:vErr}=await supabase.from('product_variants').insert({product_id:product.id,sku,format:form.format.toLowerCase()==='cassette'?'cassette':'cd',edition_name:form.title.trim(),price,currency:'TRY',manufactured_qty:stock,stock_qty:stock,reserved_qty:0,active:true});
  setSaving(false);
  if(vErr){setMessage(`Edition: ${vErr.message}`);return;}
  setMessage(draft?'Draft saved.':'Release created.'); setTimeout(()=>window.location.reload(),700);
 }
 return <section id="new-release" className="adminSection releaseWorkspace"><div className="sectionLabel"><span>NEW / RELEASE WORKSPACE</span><p>Prepare the next physical object.</p></div><div className="releaseGrid"><div className="adminPanel releaseForm"><div className="formIntro"><span>DATABASE CONNECTED</span><h2>New <em>release.</em></h2><p>Products created here are now written to the Side:II Supabase catalogue.</p></div><div className="formGrid">
 <label><span>CATALOGUE NO.</span><input value={form.catalogue_no} onChange={e=>set('catalogue_no',e.target.value)}/></label><label><span>EDITION TITLE</span><input value={form.title} onChange={e=>set('title',e.target.value)}/></label>
 <label><span>FORMAT</span><select value={form.format} onChange={e=>set('format',e.target.value)}><option>CD</option><option>CASSETTE</option></select></label><label><span>STATUS</span><select value={form.status} onChange={e=>set('status',e.target.value)}><option>DRAFT</option><option>IN PREPARATION</option><option>FORTHCOMING</option><option>AVAILABLE</option></select></label>
 <label><span>PRICE / TRY</span><input inputMode="decimal" value={form.price} onChange={e=>set('price',e.target.value)} placeholder="0"/></label><label><span>INITIAL STOCK</span><input inputMode="numeric" value={form.stock} onChange={e=>set('stock',e.target.value)} placeholder="0"/></label>
 <label className="wideField"><span>ARTIST / PROJECT</span><input value={form.artist_project} onChange={e=>set('artist_project',e.target.value)} placeholder="Artist or project name"/></label><label className="wideField"><span>SHORT DESCRIPTION</span><textarea rows="4" value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Edition note, concept or production detail…"/></label></div>
 {message&&<p style={{fontSize:11,letterSpacing:'.08em',color:'#aaa69f',margin:'0 0 16px'}}>{message}</p>}<div className="formActions"><button type="button" className="ghostButton" disabled={saving} onClick={()=>save(true)}>SAVE DRAFT</button><button type="button" className="saveButton" disabled={saving} onClick={()=>save(false)}>{saving?'SAVING…':'CREATE RELEASE →'}</button></div></div>
 <aside className="releasePreview"><span>LIVE PREVIEW</span><div className="previewObject"><div className="previewSleeve"><small>{form.catalogue_no||'SIDEII—003'}</small><strong>side:II</strong><b>{(form.catalogue_no.match(/\d+/)||['03'])[0].slice(-2)}</b><em>{(form.title||'NEW EDITION').toUpperCase()}</em></div><div className="previewDisc"><i/></div></div><div className="previewMeta"><small>PHYSICAL OBJECT</small><h3>{form.title||'New Edition'}<br/><em>Edition.</em></h3><p>{form.format} · {form.status}</p></div></aside></div></section>;
}
