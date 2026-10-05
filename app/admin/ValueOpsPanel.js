'use client';
import {useEffect,useMemo,useState} from 'react';
import {supabase} from '../lib/supabase';

const money=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:2}).format(Number(n||0));

export default function ValueOpsPanel(){
 const [brief,setBrief]=useState([]),[giftCards,setGiftCards]=useState([]),[prices,setPrices]=useState([]),[variants,setVariants]=useState([]),[accounts,setAccounts]=useState([]);
 const [gift,setGift]=useState({code:'',value:'',expires:''}),[credit,setCredit]=useState({user_id:'',amount:'',note:''}),[wholesale,setWholesale]=useState({product_id:'',min_quantity:'6',unit_price:''});
 const [milestones,setMilestones]=useState({}),[busy,setBusy]=useState(''),[message,setMessage]=useState('');
 const products=useMemo(()=>{const m=new Map();variants.forEach(v=>{if(v.products)m.set(v.products.id,v.products)});return [...m.values()]},[variants]);

 async function load(){
  const [b,g,w,v,a]=await Promise.all([
   supabase.rpc('admin_daily_brief'),
   supabase.rpc('admin_list_gift_cards'),
   supabase.rpc('admin_list_wholesale_prices'),
   supabase.from('product_variants').select('id,sku,format,preorder_enabled,preorder_target,preorder_deadline,product_id,products(id,catalogue_no,title)').eq('active',true).order('created_at'),
   supabase.from('customer_accounts').select('user_id,email,full_name').order('created_at',{ascending:false})
  ]);
  if(b.error)return setMessage(b.error.message);
  setBrief(b.data||[]);setGiftCards(g.data||[]);setPrices(w.data||[]);setVariants(v.data||[]);setAccounts(a.data||[]);
  const next={};(v.data||[]).forEach(x=>{next[x.id]={target:x.preorder_target??'',deadline:x.preorder_deadline?new Date(x.preorder_deadline).toISOString().slice(0,16):''}});setMilestones(next);
 }
 useEffect(()=>{load()},[]);

 async function issueGift(e){
  e.preventDefault();setBusy('gift');setMessage('');
  const {error}=await supabase.rpc('admin_issue_gift_card',{p_code:gift.code,p_value:Number(gift.value)||0,p_expires_at:gift.expires?new Date(gift.expires).toISOString():null});
  setBusy('');if(error)return setMessage(error.message);
  setGift({code:'',value:'',expires:''});setMessage('Gift card issued.');load();
 }
 async function adjustCredit(e){
  e.preventDefault();setBusy('credit');setMessage('');
  const {error}=await supabase.rpc('admin_adjust_store_credit',{p_user_id:credit.user_id,p_amount:Number(credit.amount)||0,p_note:credit.note||null});
  setBusy('');if(error)return setMessage(error.message);
  setCredit({user_id:'',amount:'',note:''});setMessage('Store credit adjusted.');
 }
 async function saveWholesale(e){
  e.preventDefault();setBusy('wholesale');setMessage('');
  const {error}=await supabase.rpc('admin_save_wholesale_price',{p_id:null,p_product_id:wholesale.product_id,p_min_quantity:Number(wholesale.min_quantity)||1,p_unit_price:Number(wholesale.unit_price)||0,p_active:true});
  setBusy('');if(error)return setMessage(error.message);
  setWholesale({product_id:'',min_quantity:'6',unit_price:''});setMessage('Wholesale price saved.');load();
 }
 async function saveMilestone(v){
  const d=milestones[v.id]||{};setBusy('m:'+v.id);setMessage('');
  const {error}=await supabase.rpc('admin_save_preorder_milestone',{p_variant_id:v.id,p_target:d.target===''?null:Number(d.target),p_deadline:d.deadline?new Date(d.deadline).toISOString():null});
  setBusy('');if(error)return setMessage(error.message);
  setMessage('Preorder milestone saved.');load();
 }

 return <section id="value-ops" className="adminSection valueOps">
  <div className="sectionLabel"><span>12 / VALUE OPS</span><p>Daily brief, preorder targets, store credit, gift cards and wholesale pricing.</p></div>
  {message&&<p className="dbNotice">{message}</p>}
  <div className="metricGrid valueBrief">{brief.map(x=><article key={x.metric}><span>{x.metric}</span><strong>{x.value}</strong><small>PRIORITY {x.priority}</small></article>)}</div>

  <div className="valueOpsGrid">
   <form className="adminPanel growthForm" onSubmit={issueGift}><header><span>GIFT CARD</span><small>Issue internal store value.</small></header>
    <label><span>CODE</span><input required value={gift.code} onChange={e=>setGift({...gift,code:e.target.value.toUpperCase()})}/></label>
    <label><span>VALUE · TRY</span><input required type="number" min="0" step=".01" value={gift.value} onChange={e=>setGift({...gift,value:e.target.value})}/></label>
    <label><span>EXPIRES</span><input type="datetime-local" value={gift.expires} onChange={e=>setGift({...gift,expires:e.target.value})}/></label>
    <button className="saveButton" disabled={busy==='gift'}>ISSUE GIFT CARD</button>
    <div className="growthMiniList">{giftCards.slice(0,8).map(x=><p key={x.id}>{x.code} · {money(x.remaining_value)} <b>{x.active?'ACTIVE':'OFF'}</b></p>)}</div>
   </form>

   <form className="adminPanel growthForm" onSubmit={adjustCredit}><header><span>STORE CREDIT</span><small>Adjust a signed-in customer balance.</small></header>
    <label><span>ACCOUNT</span><select required value={credit.user_id} onChange={e=>setCredit({...credit,user_id:e.target.value})}><option value="">SELECT…</option>{accounts.map(a=><option key={a.user_id} value={a.user_id}>{a.email} · {a.full_name||'ACCOUNT'}</option>)}</select></label>
    <label><span>AMOUNT · TRY</span><input required type="number" step=".01" value={credit.amount} onChange={e=>setCredit({...credit,amount:e.target.value})} placeholder="Positive or negative adjustment"/></label>
    <label><span>NOTE</span><input value={credit.note} onChange={e=>setCredit({...credit,note:e.target.value})}/></label>
    <button className="saveButton" disabled={busy==='credit'}>ADJUST CREDIT</button>
   </form>
  </div>

  <div className="valueOpsGrid">
   <form className="adminPanel growthForm" onSubmit={saveWholesale}><header><span>WHOLESALE PRICE</span><small>MOQ-based trade pricing.</small></header>
    <label><span>PRODUCT</span><select required value={wholesale.product_id} onChange={e=>setWholesale({...wholesale,product_id:e.target.value})}><option value="">SELECT…</option>{products.map(p=><option key={p.id} value={p.id}>{p.catalogue_no} · {p.title}</option>)}</select></label>
    <div className="growthSplit"><label><span>MIN QTY</span><input type="number" min="1" value={wholesale.min_quantity} onChange={e=>setWholesale({...wholesale,min_quantity:e.target.value})}/></label><label><span>UNIT PRICE</span><input type="number" min="0" step=".01" value={wholesale.unit_price} onChange={e=>setWholesale({...wholesale,unit_price:e.target.value})}/></label></div>
    <button className="saveButton" disabled={busy==='wholesale'}>SAVE WHOLESALE PRICE</button>
    <div className="growthMiniList">{prices.slice(0,10).map(x=><p key={x.id}>{products.find(p=>p.id===x.product_id)?.catalogue_no||'PRODUCT'} · MOQ {x.min_quantity}<b>{money(x.unit_price)}</b></p>)}</div>
   </form>

   <article className="adminPanel valueMilestones"><header><span>PREORDER MILESTONES</span><small>{variants.filter(v=>v.preorder_enabled).length} preorder edition(s)</small></header>
    {variants.filter(v=>v.preorder_enabled).length===0?<p className="emptyNote">No active preorder editions.</p>:variants.filter(v=>v.preorder_enabled).map(v=><div className="valueMilestoneRow" key={v.id}>
      <div><b>{v.products?.catalogue_no||'—'} · {v.sku}</b><small>{v.products?.title||''} · {String(v.format).toUpperCase()}</small></div>
      <input type="number" min="1" placeholder="TARGET" value={milestones[v.id]?.target??''} onChange={e=>setMilestones(x=>({...x,[v.id]:{...(x[v.id]||{}),target:e.target.value}}))}/>
      <input type="datetime-local" value={milestones[v.id]?.deadline??''} onChange={e=>setMilestones(x=>({...x,[v.id]:{...(x[v.id]||{}),deadline:e.target.value}}))}/>
      <button className="saveButton" disabled={busy==='m:'+v.id} onClick={()=>saveMilestone(v)}>SAVE</button>
    </div>)}
   </article>
  </div>
 </section>;
}