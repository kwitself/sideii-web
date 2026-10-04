'use client';
import {useEffect,useMemo,useState} from 'react';
import {supabase} from '../lib/supabase';

const emptyCode={id:null,code:'',discount_type:'percent',value:'10',min_subtotal:'0',usage_limit:'',valid_until:'',active:true,scope_type:'all',scope_value:'',per_customer_limit:'',first_order_only:false,min_item_qty:'1'};
const emptyCampaign={id:null,name:'',campaign_type:'quantity_percent',value:'10',min_qty:'2',min_subtotal:'0',scope_type:'all',scope_value:'',usage_limit:'',valid_until:'',active:true};

function fmtDate(v){if(!v)return '';try{return new Date(v).toLocaleString('tr-TR')}catch{return v}}

function ScopeFields({form,setForm,products}){
 const categories=['apparel','mug','patch','accessory'];
 const formats=['merch','vinyl','cd','cassette','digital'];
 const imprints=['sideii','lethargia'];
 let options=[];
 if(form.scope_type==='product') options=products.map(p=>[p.id,p.title]);
 if(form.scope_type==='category') options=categories.map(x=>[x,x.toUpperCase()]);
 if(form.scope_type==='format') options=formats.map(x=>[x,x.toUpperCase()]);
 if(form.scope_type==='imprint') options=imprints.map(x=>[x,x.toUpperCase()]);
 return <>
  <label><span>SCOPE</span><select value={form.scope_type} onChange={e=>setForm({...form,scope_type:e.target.value,scope_value:''})}>
   <option value="all">ALL PRODUCTS</option><option value="product">SPECIFIC PRODUCT</option><option value="category">MERCH CATEGORY</option><option value="imprint">IMPRINT</option><option value="format">FORMAT</option>
  </select></label>
  {form.scope_type!=='all'&&<label><span>SCOPE VALUE</span><select required value={form.scope_value||''} onChange={e=>setForm({...form,scope_value:e.target.value})}><option value="">SELECT…</option>{options.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>}
 </>;
}

export default function DiscountsPanel(){
 const [codes,setCodes]=useState([]),[campaigns,setCampaigns]=useState([]),[products,setProducts]=useState([]);
 const [form,setForm]=useState(emptyCode),[campaign,setCampaign]=useState(emptyCampaign);
 const [busy,setBusy]=useState(false),[campaignBusy,setCampaignBusy]=useState(false),[message,setMessage]=useState('');

 async function load(){
  if(!supabase)return;
  const [d,c,p]=await Promise.all([
   supabase.rpc('admin_list_discount_codes'),
   supabase.rpc('admin_list_campaigns'),
   supabase.from('products').select('id,title,product_type,merch_category,imprint').order('title')
  ]);
  if(d.error)setMessage(d.error.message); else setCodes(d.data||[]);
  if(c.error)setMessage(c.error.message); else setCampaigns(c.data||[]);
  if(!p.error)setProducts(p.data||[]);
 }
 useEffect(()=>{load()},[]);

 async function saveCode(e){
  e.preventDefault();setBusy(true);setMessage('');
  const {error}=await supabase.rpc('admin_save_discount_code_v2',{
   p_id:form.id||null,p_code:form.code.trim().toUpperCase(),p_discount_type:form.discount_type,
   p_value:form.discount_type==='free_shipping'?0:Number(form.value||0),p_min_subtotal:Number(form.min_subtotal||0),
   p_usage_limit:form.usage_limit===''?null:Number(form.usage_limit),p_valid_until:form.valid_until?new Date(form.valid_until).toISOString():null,p_active:!!form.active,
   p_scope_type:form.scope_type,p_scope_value:form.scope_type==='all'?null:form.scope_value,
   p_per_customer_limit:form.per_customer_limit===''?null:Number(form.per_customer_limit),p_first_order_only:!!form.first_order_only,
   p_min_item_qty:Number(form.min_item_qty||1)
  });
  setBusy(false);if(error){setMessage(error.message);return}
  setMessage(form.id?'Code updated.':'Code created.');setForm(emptyCode);await load();
 }

 async function saveCampaign(e){
  e.preventDefault();setCampaignBusy(true);setMessage('');
  const {error}=await supabase.rpc('admin_save_campaign',{
   p_id:campaign.id||null,p_name:campaign.name.trim(),p_campaign_type:campaign.campaign_type,
   p_value:campaign.campaign_type==='free_shipping'?0:Number(campaign.value||0),
   p_min_qty:Number(campaign.min_qty||1),p_min_subtotal:Number(campaign.min_subtotal||0),
   p_scope_type:campaign.scope_type,p_scope_value:campaign.scope_type==='all'?null:campaign.scope_value,
   p_usage_limit:campaign.usage_limit===''?null:Number(campaign.usage_limit),
   p_valid_until:campaign.valid_until?new Date(campaign.valid_until).toISOString():null,p_active:!!campaign.active
  });
  setCampaignBusy(false);if(error){setMessage(error.message);return}
  setMessage(campaign.id?'Campaign updated.':'Campaign created.');setCampaign(emptyCampaign);await load();
 }

 async function toggleCode(row){const {error}=await supabase.rpc('admin_toggle_discount_code',{p_id:row.id,p_active:!row.active});if(error)setMessage(error.message);else load()}
 async function toggleCampaign(row){const {error}=await supabase.rpc('admin_toggle_campaign',{p_id:row.id,p_active:!row.active});if(error)setMessage(error.message);else load()}

 const scopeLabel=row=>row.scope_type==='all'?'ALL':(row.scope_type+' · '+(row.scope_value||'')).toUpperCase();

 return <section id="discounts" className="adminSection discountsSection">
  <div className="sectionLabel"><span>06 / DISCOUNTS & CAMPAIGNS</span><p>Codes, automatic rules and customer limits.</p></div>
  {message&&<p className="dbNotice">{message}</p>}

  <div className="discountLayout">
   <form className="adminPanel discountForm" onSubmit={saveCode}>
    <div className="discountIntro"><span>{form.id?'EDIT CODE':'NEW CODE'}</span><h2>{form.id?'Update':'Create'} <em>code.</em></h2></div>
    <div className="discountGrid">
     <label><span>CODE</span><input required value={form.code} placeholder="SIDEII10" onChange={e=>setForm({...form,code:e.target.value.toUpperCase().replace(/\s+/g,'')})}/></label>
     <label><span>TYPE</span><select value={form.discount_type} onChange={e=>setForm({...form,discount_type:e.target.value})}><option value="percent">PERCENT %</option><option value="fixed">FIXED TRY</option><option value="free_shipping">FREE SHIPPING</option></select></label>
     {form.discount_type!=='free_shipping'&&<label><span>{form.discount_type==='percent'?'VALUE / %':'VALUE / TRY'}</span><input type="number" min="0" step="0.01" value={form.value} onChange={e=>setForm({...form,value:e.target.value})}/></label>}
     <label><span>MINIMUM BASKET / TRY</span><input type="number" min="0" step="0.01" value={form.min_subtotal} onChange={e=>setForm({...form,min_subtotal:e.target.value})}/></label>
     <label><span>MIN ELIGIBLE ITEMS</span><input type="number" min="1" value={form.min_item_qty} onChange={e=>setForm({...form,min_item_qty:e.target.value})}/></label>
     <ScopeFields form={form} setForm={setForm} products={products}/>
     <label><span>GLOBAL USAGE LIMIT</span><input type="number" min="1" placeholder="UNLIMITED" value={form.usage_limit} onChange={e=>setForm({...form,usage_limit:e.target.value})}/></label>
     <label><span>PER CUSTOMER LIMIT</span><input type="number" min="1" placeholder="UNLIMITED" value={form.per_customer_limit} onChange={e=>setForm({...form,per_customer_limit:e.target.value})}/></label>
     <label><span>EXPIRES</span><input type="datetime-local" value={form.valid_until} onChange={e=>setForm({...form,valid_until:e.target.value})}/></label>
     <label className="discountToggle"><input type="checkbox" checked={form.first_order_only} onChange={e=>setForm({...form,first_order_only:e.target.checked})}/><span>FIRST ORDER ONLY</span></label>
     <label className="discountToggle"><input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})}/><span>ACTIVE</span></label>
    </div>
    <div className="formActions"><button type="button" className="ghostButton" onClick={()=>setForm(emptyCode)}>RESET</button><button className="saveButton" disabled={busy}>{busy?'SAVING…':form.id?'SAVE CODE':'CREATE CODE'}</button></div>
   </form>

   <div className="adminPanel discountList">
    <div className="discountListHead"><span>LIVE CODES</span><small>{codes.length} TOTAL</small></div>
    {codes.length===0?<div className="emptyNote">No promo codes yet.</div>:codes.map(row=><article key={row.id}>
      <div><strong>{row.code}</strong><small>{row.discount_type==='percent'?row.value+'% OFF':row.discount_type==='fixed'?'₺'+row.value+' OFF':'FREE SHIPPING'} · {scopeLabel(row)}</small></div>
      <div className="discountUsage"><b>{row.usage_count}{row.usage_limit?'/'+row.usage_limit:''}</b><small>USED</small></div>
      <div className="discountExpiry"><b>{row.per_customer_limit?row.per_customer_limit+' / CUSTOMER':'NO CUSTOMER LIMIT'}</b><small>{row.first_order_only?'FIRST ORDER':'REPEAT OK'}</small></div>
      <button type="button" className="ghostButton" onClick={()=>setForm({...row,value:String(row.value??0),min_subtotal:String(row.min_subtotal??0),usage_limit:row.usage_limit??'',per_customer_limit:row.per_customer_limit??'',min_item_qty:String(row.min_item_qty??1),valid_until:row.valid_until?new Date(row.valid_until).toISOString().slice(0,16):'',scope_value:row.scope_value||''})}>EDIT</button>
      <button type="button" className="ghostButton" onClick={()=>toggleCode(row)}>{row.active?'PAUSE':'ACTIVATE'}</button>
    </article>)}
   </div>
  </div>

  <div className="campaignDivider"><span>AUTOMATIC CAMPAIGNS</span><p>No code required. The best eligible campaign is applied automatically.</p></div>

  <div className="discountLayout">
   <form className="adminPanel discountForm" onSubmit={saveCampaign}>
    <div className="discountIntro"><span>{campaign.id?'EDIT CAMPAIGN':'NEW CAMPAIGN'}</span><h2>{campaign.id?'Update':'Create'} <em>rule.</em></h2></div>
    <div className="discountGrid">
     <label><span>NAME</span><input required value={campaign.name} placeholder="2 ITEMS / 10 OFF" onChange={e=>setCampaign({...campaign,name:e.target.value})}/></label>
     <label><span>RULE</span><select value={campaign.campaign_type} onChange={e=>setCampaign({...campaign,campaign_type:e.target.value})}><option value="quantity_percent">QUANTITY → PERCENT</option><option value="first_order_percent">FIRST ORDER → PERCENT</option><option value="free_shipping">FREE SHIPPING</option></select></label>
     {campaign.campaign_type!=='free_shipping'&&<label><span>VALUE / %</span><input type="number" min="1" max="100" value={campaign.value} onChange={e=>setCampaign({...campaign,value:e.target.value})}/></label>}
     <label><span>MIN ITEMS</span><input type="number" min="1" value={campaign.min_qty} onChange={e=>setCampaign({...campaign,min_qty:e.target.value})}/></label>
     <label><span>MINIMUM BASKET / TRY</span><input type="number" min="0" step="0.01" value={campaign.min_subtotal} onChange={e=>setCampaign({...campaign,min_subtotal:e.target.value})}/></label>
     <ScopeFields form={campaign} setForm={setCampaign} products={products}/>
     <label><span>USAGE LIMIT</span><input type="number" min="1" placeholder="UNLIMITED" value={campaign.usage_limit} onChange={e=>setCampaign({...campaign,usage_limit:e.target.value})}/></label>
     <label><span>EXPIRES</span><input type="datetime-local" value={campaign.valid_until} onChange={e=>setCampaign({...campaign,valid_until:e.target.value})}/></label>
     <label className="discountToggle"><input type="checkbox" checked={campaign.active} onChange={e=>setCampaign({...campaign,active:e.target.checked})}/><span>ACTIVE</span></label>
    </div>
    <div className="formActions"><button type="button" className="ghostButton" onClick={()=>setCampaign(emptyCampaign)}>RESET</button><button className="saveButton" disabled={campaignBusy}>{campaignBusy?'SAVING…':campaign.id?'SAVE CAMPAIGN':'CREATE CAMPAIGN'}</button></div>
   </form>

   <div className="adminPanel discountList campaignList">
    <div className="discountListHead"><span>LIVE CAMPAIGNS</span><small>{campaigns.length} TOTAL</small></div>
    {campaigns.length===0?<div className="emptyNote">No automatic campaigns yet.</div>:campaigns.map(row=><article key={row.id}>
      <div><strong>{row.name}</strong><small>{row.campaign_type.replaceAll('_',' ').toUpperCase()} · {scopeLabel(row)}</small></div>
      <div className="discountUsage"><b>{row.usage_count}{row.usage_limit?'/'+row.usage_limit:''}</b><small>USED</small></div>
      <div className="discountExpiry"><b>{row.campaign_type==='free_shipping'?'FREE SHIP':row.value+'%'}</b><small>MIN {row.min_qty} ITEM</small></div>
      <button type="button" className="ghostButton" onClick={()=>setCampaign({...row,value:String(row.value??0),min_qty:String(row.min_qty??1),min_subtotal:String(row.min_subtotal??0),usage_limit:row.usage_limit??'',valid_until:row.valid_until?new Date(row.valid_until).toISOString().slice(0,16):'',scope_value:row.scope_value||''})}>EDIT</button>
      <button type="button" className="ghostButton" onClick={()=>toggleCampaign(row)}>{row.active?'PAUSE':'ACTIVATE'}</button>
    </article>)}
   </div>
  </div>
 </section>
