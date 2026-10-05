'use client';
import {useEffect,useMemo,useState} from 'react';
import {supabase} from '../lib/supabase';

const emptyCollection={id:null,slug:'',name:'',kind:'drop',description:'',active:true,sort_order:0};
const emptyBundle={id:null,slug:'',name:'',description:'',discount_type:'percent',discount_value:'10',active:true};
const emptyCredit={id:null,product_id:'',person_name:'',role:'',sort_order:0};
const emptyRoyalty={id:null,product_id:'',payee_name:'',share_percent:'',active:true};
const money=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:2}).format(Number(n||0));

export default function GrowthOpsPanel({products=[]}){
 const [collections,setCollections]=useState([]),[bundles,setBundles]=useState([]),[credits,setCredits]=useState([]),[royalties,setRoyalties]=useState([]),[report,setReport]=useState([]),[wholesale,setWholesale]=useState([]),[audit,setAudit]=useState([]);
 const [collectionForm,setCollectionForm]=useState(emptyCollection),[bundleForm,setBundleForm]=useState(emptyBundle),[creditForm,setCreditForm]=useState(emptyCredit),[royaltyForm,setRoyaltyForm]=useState(emptyRoyalty);
 const [busy,setBusy]=useState(''),[message,setMessage]=useState('');
 const productMap=useMemo(()=>Object.fromEntries(products.map(p=>[p.id,p])),[products]);

 async function load(){
  if(!supabase)return;
  const [c,b,cr,rr,rp,w,a]=await Promise.all([
   supabase.rpc('admin_list_collections'),supabase.rpc('admin_list_bundles'),supabase.rpc('admin_list_product_credits'),
   supabase.rpc('admin_list_royalty_rules'),supabase.rpc('admin_royalty_report'),supabase.rpc('admin_list_wholesale_accounts'),
   supabase.rpc('admin_audit_feed',{p_limit:80})
  ]);
  if(c.error)return setMessage(c.error.message);
  setCollections(c.data||[]);setBundles(b.data||[]);setCredits(cr.data||[]);setRoyalties(rr.data||[]);setReport(rp.data||[]);setWholesale(w.data||[]);setAudit(a.data||[]);
 }
 useEffect(()=>{load()},[]);

 async function saveCollection(e){
  e.preventDefault();setBusy('collection');
  const {data,error}=await supabase.rpc('admin_save_collection',{p_id:collectionForm.id||null,p_slug:collectionForm.slug,p_name:collectionForm.name,p_kind:collectionForm.kind,p_description:collectionForm.description||null,p_active:collectionForm.active,p_starts_at:null,p_ends_at:null,p_sort_order:Number(collectionForm.sort_order)||0});
  setBusy('');if(error)return setMessage(error.message);setMessage('Collection saved.');setCollectionForm(emptyCollection);await load();
 }
 async function toggleCollectionProduct(collectionId,productId,enabled){
  setBusy('collection-item');const {error}=await supabase.rpc('admin_set_collection_item',{p_collection_id:collectionId,p_product_id:productId,p_enabled:enabled,p_sort_order:0,p_featured:false});setBusy('');if(error)return setMessage(error.message);await load();
 }
 async function saveBundle(e){
  e.preventDefault();setBusy('bundle');
  const {error}=await supabase.rpc('admin_save_bundle',{p_id:bundleForm.id||null,p_slug:bundleForm.slug,p_name:bundleForm.name,p_description:bundleForm.description||null,p_discount_type:bundleForm.discount_type,p_discount_value:Number(bundleForm.discount_value)||0,p_active:bundleForm.active,p_starts_at:null,p_ends_at:null});
  setBusy('');if(error)return setMessage(error.message);setMessage('Bundle saved.');setBundleForm(emptyBundle);await load();
 }
 async function toggleBundleProduct(bundleId,productId,enabled){
  setBusy('bundle-item');const {error}=await supabase.rpc('admin_set_bundle_item',{p_bundle_id:bundleId,p_product_id:productId,p_quantity:1,p_enabled:enabled});setBusy('');if(error)return setMessage(error.message);await load();
 }
 async function saveCredit(e){
  e.preventDefault();setBusy('credit');
  const {error}=await supabase.rpc('admin_save_product_credit',{p_id:creditForm.id||null,p_product_id:creditForm.product_id,p_person_name:creditForm.person_name,p_role:creditForm.role,p_sort_order:Number(creditForm.sort_order)||0});
  setBusy('');if(error)return setMessage(error.message);setCreditForm(emptyCredit);setMessage('Credit saved.');await load();
 }
 async function saveRoyalty(e){
  e.preventDefault();setBusy('royalty');
  const {error}=await supabase.rpc('admin_save_royalty_rule',{p_id:royaltyForm.id||null,p_product_id:royaltyForm.product_id,p_payee_name:royaltyForm.payee_name,p_share_percent:Number(royaltyForm.share_percent)||0,p_active:royaltyForm.active});
  setBusy('');if(error)return setMessage(error.message);setRoyaltyForm(emptyRoyalty);setMessage('Royalty rule saved.');await load();
 }
 async function wholesaleStatus(id,status){setBusy('wholesale');const {error}=await supabase.rpc('admin_update_wholesale_status',{p_id:id,p_status:status});setBusy('');if(error)return setMessage(error.message);await load()}

 return <section id="growth-ops" className="adminSection growthOps">
  <div className="sectionLabel"><span>11 / GROWTH OPS</span><p>Drops, bundles, credits, royalties, wholesale and audit.</p></div>
  {message&&<p className="dbNotice">{message}</p>}

  <div className="growthOpsGrid">
   <form className="adminPanel growthForm" onSubmit={saveCollection}><header><span>COLLECTION / DROP</span><small>CORE · DROP · ARTIST OBJECTS · ARCHIVE</small></header>
    <label><span>NAME</span><input required value={collectionForm.name} onChange={e=>setCollectionForm({...collectionForm,name:e.target.value})}/></label>
    <label><span>SLUG</span><input required value={collectionForm.slug} onChange={e=>setCollectionForm({...collectionForm,slug:e.target.value.toLowerCase().replace(/\s+/g,'-')})}/></label>
    <label><span>KIND</span><select value={collectionForm.kind} onChange={e=>setCollectionForm({...collectionForm,kind:e.target.value})}><option value="core">CORE</option><option value="drop">DROP</option><option value="artist_objects">ARTIST OBJECTS</option><option value="archive">ARCHIVE</option></select></label>
    <label><span>DESCRIPTION</span><textarea value={collectionForm.description} onChange={e=>setCollectionForm({...collectionForm,description:e.target.value})}/></label>
    <button className="saveButton" disabled={busy==='collection'}>SAVE COLLECTION</button>
   </form>

   <form className="adminPanel growthForm" onSubmit={saveBundle}><header><span>COLLECTOR BUNDLE</span><small>Backend-verified set saving.</small></header>
    <label><span>NAME</span><input required value={bundleForm.name} onChange={e=>setBundleForm({...bundleForm,name:e.target.value})}/></label>
    <label><span>SLUG</span><input required value={bundleForm.slug} onChange={e=>setBundleForm({...bundleForm,slug:e.target.value.toLowerCase().replace(/\s+/g,'-')})}/></label>
    <div className="growthSplit"><label><span>DISCOUNT</span><select value={bundleForm.discount_type} onChange={e=>setBundleForm({...bundleForm,discount_type:e.target.value})}><option value="percent">PERCENT</option><option value="fixed">FIXED TRY</option></select></label><label><span>VALUE</span><input type="number" min="0" step=".01" value={bundleForm.discount_value} onChange={e=>setBundleForm({...bundleForm,discount_value:e.target.value})}/></label></div>
    <label><span>DESCRIPTION</span><textarea value={bundleForm.description} onChange={e=>setBundleForm({...bundleForm,description:e.target.value})}/></label>
    <button className="saveButton" disabled={busy==='bundle'}>SAVE BUNDLE</button>
   </form>
  </div>

  <div className="growthOpsGrid">
   <article className="adminPanel growthList"><header><span>COLLECTION CONTENT</span><small>{collections.length} collection(s)</small></header>{collections.map(c=><div className="growthListBlock" key={c.id}><div><b>{c.name}</b><small>{c.kind.toUpperCase()} · /collections/{c.slug}</small></div><div className="growthProductChecks">{products.map(p=><label key={p.id}><input type="checkbox" checked={(c.product_ids||[]).includes(p.id)} onChange={e=>toggleCollectionProduct(c.id,p.id,e.target.checked)}/><span>{p.catalogue_no}</span></label>)}</div></div>)}</article>
   <article className="adminPanel growthList"><header><span>BUNDLE CONTENT</span><small>{bundles.length} bundle(s)</small></header>{bundles.map(b=><div className="growthListBlock" key={b.id}><div><b>{b.name}</b><small>{b.discount_type.toUpperCase()} · {b.discount_value}</small></div><div className="growthProductChecks">{products.map(p=><label key={p.id}><input type="checkbox" checked={(b.items||[]).some(x=>x.product_id===p.id)} onChange={e=>toggleBundleProduct(b.id,p.id,e.target.checked)}/><span>{p.catalogue_no}</span></label>)}</div></div>)}</article>
  </div>

  <div className="growthOpsGrid">
   <form className="adminPanel growthForm" onSubmit={saveCredit}><header><span>STRUCTURED CREDIT</span><small>Public release credits graph foundation.</small></header>
    <label><span>PRODUCT</span><select required value={creditForm.product_id} onChange={e=>setCreditForm({...creditForm,product_id:e.target.value})}><option value="">SELECT…</option>{products.map(p=><option value={p.id} key={p.id}>{p.catalogue_no} · {p.title}</option>)}</select></label>
    <label><span>PERSON</span><input required value={creditForm.person_name} onChange={e=>setCreditForm({...creditForm,person_name:e.target.value})}/></label>
    <label><span>ROLE</span><input required value={creditForm.role} onChange={e=>setCreditForm({...creditForm,role:e.target.value})} placeholder="Mastering / Artwork / Photography"/></label>
    <button className="saveButton" disabled={busy==='credit'}>SAVE CREDIT</button>
    <div className="growthMiniList">{credits.slice(0,10).map(x=><p key={x.id}>{productMap[x.product_id]?.catalogue_no||'—'} · {x.role} · <b>{x.person_name}</b></p>)}</div>
   </form>

   <form className="adminPanel growthForm" onSubmit={saveRoyalty}><header><span>ROYALTY / SHARE</span><small>Internal estimate, not a payout instruction.</small></header>
    <label><span>PRODUCT</span><select required value={royaltyForm.product_id} onChange={e=>setRoyaltyForm({...royaltyForm,product_id:e.target.value})}><option value="">SELECT…</option>{products.map(p=><option value={p.id} key={p.id}>{p.catalogue_no} · {p.title}</option>)}</select></label>
    <label><span>PAYEE</span><input required value={royaltyForm.payee_name} onChange={e=>setRoyaltyForm({...royaltyForm,payee_name:e.target.value})}/></label>
    <label><span>SHARE / %</span><input required type="number" min="0" max="100" step=".001" value={royaltyForm.share_percent} onChange={e=>setRoyaltyForm({...royaltyForm,share_percent:e.target.value})}/></label>
    <button className="saveButton" disabled={busy==='royalty'}>SAVE SHARE</button>
    <div className="growthMiniList">{report.slice(0,10).map((x,i)=><p key={i}>{x.catalogue_no} · {x.payee_name} · {x.share_percent}% <b>{money(x.estimated_royalty)}</b></p>)}</div>
   </form>
  </div>

  <div className="growthOpsGrid">
   <article className="adminPanel growthList"><header><span>WHOLESALE APPLICATIONS</span><small>{wholesale.length}</small></header>{wholesale.length===0?<p className="emptyNote">No trade applications yet.</p>:wholesale.slice(0,20).map(w=><div className="wholesaleAdminRow" key={w.id}><div><b>{w.company_name}</b><small>{w.email} · {w.country_code} · {w.status.toUpperCase()}</small></div><select value={w.status} disabled={busy==='wholesale'} onChange={e=>wholesaleStatus(w.id,e.target.value)}><option value="pending">PENDING</option><option value="approved">APPROVED</option><option value="rejected">REJECTED</option><option value="suspended">SUSPENDED</option></select></div>)}</article>
   <article className="adminPanel growthList"><header><span>AUDIT FEED</span><small>{audit.length} recent</small></header>{audit.length===0?<p className="emptyNote">No audit events yet.</p>:audit.slice(0,25).map(a=><div className="auditRow" key={a.id}><span>{a.event_type}</span><div><b>{a.entity_type}</b><small>{a.summary||a.entity_id||'—'}</small></div><time>{new Date(a.created_at).toLocaleString('tr-TR')}</time></div>)}</article>
  </div>
 </section>;
}
