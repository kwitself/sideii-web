'use client';
import {useEffect,useMemo,useState} from 'react';
import {supabase} from '../lib/supabase';

const money=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:2}).format(Number(n||0));
const emptyOwner={id:null,product_id:'',title:'',content_type:'link',content_url:'',note:'',active:true,sort_order:0};

export default function CatalogueOpsPanel({products=[]}){
 const [alerts,setAlerts]=useState([]),[owner,setOwner]=useState([]),[costs,setCosts]=useState([]),[depth,setDepth]=useState([]);
 const [ownerForm,setOwnerForm]=useState(emptyOwner),[busy,setBusy]=useState(''),[message,setMessage]=useState('');
 const [costDraft,setCostDraft]=useState({}),[depthDraft,setDepthDraft]=useState({});
 const [expandedProducts,setExpandedProducts]=useState({});
 const productMap=useMemo(()=>Object.fromEntries(products.map(p=>[p.id,p])),[products]);

 async function load(){
  if(!supabase)return;
  const [a,o,c,d]=await Promise.all([
   supabase.rpc('admin_get_control_room_alerts'),
   supabase.rpc('admin_list_owner_content'),
   supabase.rpc('admin_list_product_costs'),
   supabase.rpc('admin_list_catalogue_depth')
  ]);
  if(a.error)return setMessage(a.error.message);
  setAlerts(a.data||[]);setOwner(o.data||[]);setCosts(c.data||[]);setDepth(d.data||[]);
 }
 useEffect(()=>{load()},[]);

 async function saveOwner(e){
  e.preventDefault();setBusy('owner');setMessage('');
  const {error}=await supabase.rpc('admin_save_owner_content',{
   p_id:ownerForm.id||null,p_product_id:ownerForm.product_id,p_title:ownerForm.title,
   p_content_type:ownerForm.content_type,p_content_url:ownerForm.content_url||null,
   p_note:ownerForm.note||null,p_active:!!ownerForm.active,p_sort_order:Number(ownerForm.sort_order)||0
  });
  setBusy('');if(error)return setMessage(error.message);
  setOwnerForm(emptyOwner);setMessage('Owner content saved.');load();
 }

 async function saveCost(productId){
  const base=costs.find(x=>x.product_id===productId)||{};
  const d={...base,...(costDraft[productId]||{})};setBusy('cost:'+productId);setMessage('');
  const {error}=await supabase.rpc('admin_save_product_cost',{
   p_product_id:productId,p_unit_cost:Number(d.unit_cost)||0,p_packaging_cost:Number(d.packaging_cost)||0,
   p_handling_cost:Number(d.handling_cost)||0,p_notes:d.notes||null
  });
  setBusy('');if(error)return setMessage(error.message);
  setMessage('Product cost saved.');load();
 }

 async function saveDepth(productId){
  const base=depth.find(x=>x.product_id===productId)||{};
  const d={...base,...(depthDraft[productId]||{})};setBusy('depth:'+productId);setMessage('');
  const {error}=await supabase.rpc('admin_update_catalogue_depth',{
   p_product_id:productId,p_archive_visible:!!d.archive_visible,p_pressing_generation:Number(d.pressing_generation)||1,
   p_pressing_label:d.pressing_label||'FIRST PRESSING',p_listening_preview_url:d.listening_preview_url||null,
   p_digital_booklet_url:d.digital_booklet_url||null
  });
  setBusy('');if(error)return setMessage(error.message);
  setMessage('Catalogue depth saved.');load();
 }

 return <section id="catalogue-ops" className="adminSection catalogueOps">
  <div className="sectionLabel"><span>10 / CATALOGUE OPS</span><p>Collector content, archive, pressing data, margins and alerts.</p></div>
  {message&&<p className="dbNotice">{message}</p>}

  <article className="adminPanel catalogueAlerts">
   <header><span>SMART ALERTS</span><small>{alerts.length} items need attention</small></header>
   {alerts.length===0?<p className="emptyNote">Nothing urgent right now.</p>:alerts.slice(0,12).map((a,i)=><div className="catalogueAlertRow" key={a.alert_type+':'+a.entity_id+':'+i}><span>{String(a.alert_type).toUpperCase()}</span><div><b>{a.title}</b><small>{a.detail}</small></div><em>P{a.priority}</em></div>)}
  </article>

  <div className="catalogueOpsGrid">
   <form className="adminPanel ownerContentForm" onSubmit={saveOwner}>
    <header><span>OWNER-ONLY CONTENT</span><small>Unlocked only after a paid order.</small></header>
    <label><span>PRODUCT</span><select required value={ownerForm.product_id} onChange={e=>setOwnerForm({...ownerForm,product_id:e.target.value})}><option value="">SELECT…</option>{products.filter(p=>p.product_type!=='merch').map(p=><option key={p.id} value={p.id}>{p.catalogue_no} · {p.title}</option>)}</select></label>
    <label><span>TITLE</span><input required value={ownerForm.title} onChange={e=>setOwnerForm({...ownerForm,title:e.target.value})} placeholder="Alternate mix / booklet / artwork"/></label>
    <div className="catalogueSplit"><label><span>TYPE</span><select value={ownerForm.content_type} onChange={e=>setOwnerForm({...ownerForm,content_type:e.target.value})}><option value="link">LINK</option><option value="audio">AUDIO</option><option value="video">VIDEO</option><option value="booklet">BOOKLET</option><option value="artwork">ARTWORK</option><option value="note">NOTE</option></select></label><label><span>SORT</span><input type="number" value={ownerForm.sort_order} onChange={e=>setOwnerForm({...ownerForm,sort_order:e.target.value})}/></label></div>
    <label><span>URL</span><input value={ownerForm.content_url} onChange={e=>setOwnerForm({...ownerForm,content_url:e.target.value})} placeholder="/downloads/... or https://..."/></label>
    <label><span>NOTE</span><textarea value={ownerForm.note} onChange={e=>setOwnerForm({...ownerForm,note:e.target.value})}/></label>
    <label className="catalogueCheck"><input type="checkbox" checked={ownerForm.active} onChange={e=>setOwnerForm({...ownerForm,active:e.target.checked})}/><span>ACTIVE</span></label>
    <div className="formActions"><button type="button" className="ghostButton" onClick={()=>setOwnerForm(emptyOwner)}>RESET</button><button className="saveButton" disabled={busy==='owner'}>{busy==='owner'?'SAVING…':'SAVE CONTENT'}</button></div>
   </form>

   <article className="adminPanel ownerContentList">
    <header><span>OWNER CONTENT LIBRARY</span><small>{owner.length} item(s)</small></header>
    {owner.length===0?<p className="emptyNote">No owner-only content yet.</p>:owner.map(x=><div className="ownerContentRow" key={x.id}><div><b>{x.title}</b><small>{productMap[x.product_id]?.catalogue_no||'PRODUCT'} · {String(x.content_type).toUpperCase()}</small></div><span>{x.active?'ACTIVE':'HIDDEN'}</span><button className="ghostButton" onClick={()=>setOwnerForm({...x,content_url:x.content_url||'',note:x.note||''})}>EDIT</button></div>)}
   </article>
  </div>

  <article className="adminPanel catalogueProductOps">
   <header><span>CATALOGUE / ARCHIVE / PRESSING / COST</span><small>Archive visibility, repress generations, media links and internal cost basis.</small></header>
   {products.map(p=>{
    const dep={...(depth.find(x=>x.product_id===p.id)||{}),...(depthDraft[p.id]||{})};
    const cost={...(costs.find(x=>x.product_id===p.id)||{}),...(costDraft[p.id]||{})};
    const price=Number(p.product_variants?.[0]?.price||0),baseCost=Number(cost.unit_cost||0)+Number(cost.packaging_cost||0)+Number(cost.handling_cost||0);
    const margin=price-baseCost;
    const open=!!expandedProducts[p.id];
    return <div className={'catalogueProductRow '+(open?'open':'')} key={p.id}>
      <button type="button" className="catalogueProductTitle catalogueProductToggle" onClick={()=>setExpandedProducts(x=>({...x,[p.id]:!x[p.id]}))} aria-expanded={open}><span><b>{p.title}</b><small>{p.catalogue_no} · {p.status?.toUpperCase()}</small></span><em>{price?('PRICE '+money(price)+' · EST. MARGIN '+money(margin)):'NO PRICE'}</em><i>{open?'−':'+'}</i></button>
      {open&&<><div className="catalogueDepthFields">
       <label><span>PRESSING #</span><input type="number" min="1" value={dep.pressing_generation??1} onChange={e=>setDepthDraft(x=>({...x,[p.id]:{...(x[p.id]||{}),pressing_generation:e.target.value}}))}/></label>
       <label><span>PRESSING LABEL</span><input value={dep.pressing_label||'FIRST PRESSING'} onChange={e=>setDepthDraft(x=>({...x,[p.id]:{...(x[p.id]||{}),pressing_label:e.target.value}}))}/></label>
       <label><span>LISTENING PREVIEW</span><input value={dep.listening_preview_url||''} onChange={e=>setDepthDraft(x=>({...x,[p.id]:{...(x[p.id]||{}),listening_preview_url:e.target.value}}))}/></label>
       <label><span>DIGITAL BOOKLET</span><input value={dep.digital_booklet_url||''} onChange={e=>setDepthDraft(x=>({...x,[p.id]:{...(x[p.id]||{}),digital_booklet_url:e.target.value}}))}/></label>
       <label className="catalogueCheck"><input type="checkbox" checked={!!dep.archive_visible} onChange={e=>setDepthDraft(x=>({...x,[p.id]:{...(x[p.id]||{}),archive_visible:e.target.checked}}))}/><span>SHOW IN ARCHIVE</span></label>
       <button className="saveButton" disabled={busy==='depth:'+p.id} onClick={()=>saveDepth(p.id)}>SAVE CATALOGUE</button>
      </div>
      <div className="catalogueCostFields">
       <label><span>UNIT COST</span><input type="number" min="0" step=".01" value={cost.unit_cost??0} onChange={e=>setCostDraft(x=>({...x,[p.id]:{...(x[p.id]||{}),unit_cost:e.target.value}}))}/></label>
       <label><span>PACKAGING</span><input type="number" min="0" step=".01" value={cost.packaging_cost??0} onChange={e=>setCostDraft(x=>({...x,[p.id]:{...(x[p.id]||{}),packaging_cost:e.target.value}}))}/></label>
       <label><span>HANDLING</span><input type="number" min="0" step=".01" value={cost.handling_cost??0} onChange={e=>setCostDraft(x=>({...x,[p.id]:{...(x[p.id]||{}),handling_cost:e.target.value}}))}/></label>
       <label><span>NOTES</span><input value={cost.notes||''} onChange={e=>setCostDraft(x=>({...x,[p.id]:{...(x[p.id]||{}),notes:e.target.value}}))}/></label>
       <button className="saveButton" disabled={busy==='cost:'+p.id} onClick={()=>saveCost(p.id)}>SAVE COST</button>
      </div></>}
    </div>
   })}
  </article>
 </section>
}
