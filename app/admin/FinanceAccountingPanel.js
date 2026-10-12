'use client';
import {useEffect,useMemo,useState} from 'react';
import {supabase} from '../lib/supabase';
const tr=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(Number(n)||0);
const cats=['production','packaging','shipping','payment_fee','marketing','software','tax','refund','other'];
const netVat=(amount,rate,included)=>{const a=Number(amount)||0,r=(Number(rate)||0)/100;const net=included?a/(1+r):a;return {net,vat:net*r,gross:included?a:net*(1+r)}};
const inputStyle={minHeight:40,background:'#111015',border:'1px solid #443b46',padding:'9px 11px',color:'#e7dfe4',width:'100%',minWidth:0};
export default function FinanceAccountingPanel({products=[]}){
 const [data,setData]=useState({settings:{sales_vat_rate:0,shipping_vat_rate:0,prices_include_vat:true},expenses:[]});
 const [orders,setOrders]=useState([]),[costs,setCosts]=useState([]),[rules,setRules]=useState([]);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const [draft,setDraft]=useState({expense_date:new Date().toISOString().slice(0,10),category:'production',description:'',gross_amount:'',vat_rate:'0',vat_included:true,deductible_vat:false,product_id:'',reference:''});
 const [period,setPeriod]=useState('all');
 async function load(){
  if(!supabase)return;
  setLoading(true);setError('');
  const [f,o,c,r]=await Promise.all([
   supabase.rpc('admin_finance_read'),
   supabase.from('orders').select('id,order_no,created_at,payment_status,status,total,subtotal,shipping_total,support_total,currency,order_items(variant_id,quantity,line_total,support_amount)').order('created_at',{ascending:false}).limit(1000),
   supabase.rpc('admin_list_product_costs'),
   supabase.rpc('admin_list_royalty_rules')
  ]);
  if(f.error)setError('Finance: '+f.error.message);else setData(f.data);
  if(o.error)setError(v=>v||'Orders: '+o.error.message);else setOrders(o.data||[]);
  if(c.error)setError(v=>v||'Costs: '+c.error.message);else setCosts(c.data||[]);
  if(r.error)setError(v=>v||'Royalties: '+r.error.message);else setRules(r.data||[]);
  setLoading(false);
 }
 useEffect(()=>{load()},[]);
 const settings=data?.settings||{sales_vat_rate:0,shipping_vat_rate:0,prices_include_vat:true};
 const entries=data?.expenses||[];
 const filtered=useMemo(()=>{
  if(period==='all')return {sales:orders,expenses:entries};
  const since=new Date();since.setDate(since.getDate()-Number(period));
  const day=since.toISOString().slice(0,10);
  return {sales:orders.filter(o=>new Date(o.created_at)>=since),expenses:entries.filter(e=>e.expense_date>=day)};
 },[orders,entries,period]);
 const calculation=useMemo(()=>{
  const paid=filtered.sales.filter(o=>String(o.payment_status).toLowerCase()==='paid'&&!['refunded','cancelled'].includes(String(o.status).toLowerCase()));
  const variantProducts=new Map(products.flatMap(p=>(p.product_variants||[]).map(v=>[String(v.id),p.id])));
  const costMap=new Map(costs.map(c=>[String(c.product_id),Number(c.unit_cost||0)+Number(c.packaging_cost||0)+Number(c.handling_cost||0)]));
  const productRevenue=new Map(),productUnits=new Map();
  let salesNet=0,outputVat=0,shippingNet=0,shippingVat=0,unknownItems=0;
  paid.forEach(o=>{
   const salesBase=Number(o.total||0)-Number(o.shipping_total||0);
   const sr=netVat(Math.max(0,salesBase),settings.sales_vat_rate,settings.prices_include_vat);
   const sh=netVat(Number(o.shipping_total||0),settings.shipping_vat_rate,settings.prices_include_vat);
   salesNet+=sr.net;outputVat+=sr.vat;shippingNet+=sh.net;shippingVat+=sh.vat;
   const items=o.order_items||[];const base=items.reduce((s,i)=>s+Number(i.line_total||0),0);
   items.forEach(i=>{const productId=variantProducts.get(String(i.variant_id));if(!productId){unknownItems++;return;}const fraction=base>0?Number(i.line_total||0)/base:0;productRevenue.set(productId,(productRevenue.get(productId)||0)+sr.net*fraction);productUnits.set(productId,(productUnits.get(productId)||0)+Number(i.quantity||0))});
  });
  const cogs=[...productUnits].reduce((sum,[id,qty])=>sum+Number(costMap.get(id)||0)*qty,0);
  let expensesNet=0,inputVat=0;
  filtered.expenses.forEach(e=>{const n=netVat(e.gross_amount,e.vat_rate,e.vat_included);expensesNet+=Number(e.deductible_vat)?n.net:n.gross;if(e.deductible_vat)inputVat+=n.vat;});
  const operatingProfit=salesNet+shippingNet-cogs-expensesNet;
  const artistRows=rules.filter(r=>r.active).map(r=>{const gross=productRevenue.get(r.product_id)||0,qty=productUnits.get(r.product_id)||0;const base=Math.max(0,gross-(costMap.get(r.product_id)||0)*qty);return {...r,base,share:base*Number(r.share_percent||0)/100}});
  return {count:paid.length,salesNet,outputVat,shippingNet,shippingVat,cogs,expensesNet,inputVat,operatingProfit,vatBalance:outputVat+shippingVat-inputVat,artistRows,artistShare:artistRows.reduce((s,r)=>s+r.share,0),unknownItems};
 },[filtered,products,costs,rules,settings]);
 const saveSettings=async()=>{setBusy(true);setError('');const {error}=await supabase.rpc('admin_finance_save_settings',{p_sales_vat_rate:Number(settings.sales_vat_rate),p_shipping_vat_rate:Number(settings.shipping_vat_rate),p_prices_include_vat:!!settings.prices_include_vat});if(error)setError(error.message);else{setMessage('VAT settings saved. Estimates recalculated.');await load()}setBusy(false)};
 const addExpense=async(e)=>{e.preventDefault();setBusy(true);setError('');const {error}=await supabase.rpc('admin_finance_add_expense',{p_expense_date:draft.expense_date,p_category:draft.category,p_description:draft.description,p_gross_amount:Number(draft.gross_amount),p_vat_rate:Number(draft.vat_rate),p_vat_included:draft.vat_included,p_deductible_vat:draft.deductible_vat,p_product_id:draft.product_id||null,p_reference:draft.reference||null});if(error)setError(error.message);else{setDraft(v=>({...v,description:'',gross_amount:'',reference:''}));setMessage('Expense recorded.');await load()}setBusy(false)};
 const deleteExpense=async(id)=>{if(!window.confirm('Delete this accounting entry?'))return;setBusy(true);const {error}=await supabase.rpc('admin_finance_delete_expense',{p_id:id});if(error)setError(error.message);else await load();setBusy(false)};
 const control=(label,children)=><label style={{display:'grid',gap:7,fontSize:10,letterSpacing:'.11em',color:'#aaa0a8'}}>{label}{children}</label>;
 const field=(value,change,type='text',extra={})=><input style={inputStyle} type={type} value={value} onChange={e=>change(e.target.value)} {...extra}/>;
 const card=(label,value,sub)=><article className="financeKpi"><span>{label}</span><strong>{tr(value)}</strong>{sub&&<small>{sub}</small>}</article>;
 return <section className="adminSection adminViewSection financePanel">
  <div className="sectionLabel"><span>18 / FINANCE & ACCOUNTING</span><p>VAT, operating costs, profitability and artist allocation · estimates</p></div>
  {error&&<p className="dbNotice" role="alert">{error}</p>}{message&&<p className="dbNotice" role="status">{message}</p>}
  <div className="financeTop"><div><h2>Numbers, <em>with context.</em></h2><small>Prices and tax rates are configurable. Confirm tax classification and filings with your accountant.</small></div><select style={inputStyle} value={period} onChange={e=>setPeriod(e.target.value)}><option value="all">ALL AVAILABLE</option><option value="30">LAST 30 DAYS</option><option value="90">LAST 90 DAYS</option><option value="365">LAST 365 DAYS</option></select></div>
  <div className="financeKpis">{card('NET SALES (EST.)',calculation.salesNet,'excluding estimated VAT')}{card('OUTPUT VAT',calculation.outputVat+calculation.shippingVat,'sales and shipping')}{card('INPUT VAT (ELIGIBLE)',calculation.inputVat,'recorded expenses')}{card('VAT BALANCE (EST.)',calculation.vatBalance,'negative = potential credit')}{card('OPERATING RESULT',calculation.operatingProfit,'before tax and artist payments')}{card('ARTIST SHARE (EST.)',calculation.artistShare,'product profit basis')}</div>
  <div className="financeColumns">
   <section className="adminPanel financeBox"><h3>VAT SETTINGS</h3><p>Defaults for estimated reporting only. Not a tax invoice or e-ledger.</p><div className="financeFields">
    {control('SALES VAT %',field(settings.sales_vat_rate,v=>setData(d=>({...d,settings:{...d.settings,sales_vat_rate:v}})),'number',{min:0,max:100,step:.1}))}
    {control('SHIPPING VAT %',field(settings.shipping_vat_rate,v=>setData(d=>({...d,settings:{...d.settings,shipping_vat_rate:v}})),'number',{min:0,max:100,step:.1}))}
    <label className="financeCheck"><input type="checkbox" checked={!!settings.prices_include_vat} onChange={e=>setData(d=>({...d,settings:{...d.settings,prices_include_vat:e.target.checked}}))}/> PRICES INCLUDE VAT</label>
   </div><button className="saveButton" onClick={saveSettings} disabled={busy||loading}>SAVE VAT SETTINGS</button></section>
   <form className="adminPanel financeBox" onSubmit={addExpense}><h3>RECORD EXPENSE</h3><p>Expense VAT is deductible only when you explicitly mark it eligible.</p><div className="financeFields">
    {control('DATE',field(draft.expense_date,v=>setDraft(d=>({...d,expense_date:v})),'date',{required:true}))}
    {control('CATEGORY',<select style={inputStyle} value={draft.category} onChange={e=>setDraft(d=>({...d,category:e.target.value}))}>{cats.map(x=><option key={x} value={x}>{x.toUpperCase().replaceAll('_',' ')}</option>)}</select>)}
    {control('DESCRIPTION',field(draft.description,v=>setDraft(d=>({...d,description:v})),'text',{required:true,maxLength:300}))}
    {control('AMOUNT',field(draft.gross_amount,v=>setDraft(d=>({...d,gross_amount:v})),'number',{required:true,min:0,step:.01}))}
    {control('EXPENSE VAT %',field(draft.vat_rate,v=>setDraft(d=>({...d,vat_rate:v})),'number',{min:0,max:100,step:.1}))}
    {control('RELATED PRODUCT',<select style={inputStyle} value={draft.product_id} onChange={e=>setDraft(d=>({...d,product_id:e.target.value}))}><option value="">GENERAL / NONE</option>{products.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select>)}
    {control('INVOICE / REFERENCE',field(draft.reference,v=>setDraft(d=>({...d,reference:v})))}
    <label className="financeCheck"><input type="checkbox" checked={draft.vat_included} onChange={e=>setDraft(d=>({...d,vat_included:e.target.checked}))}/> AMOUNT INCLUDES VAT</label>
    <label className="financeCheck"><input type="checkbox" checked={draft.deductible_vat} onChange={e=>setDraft(d=>({...d,deductible_vat:e.target.checked}))}/> DEDUCTIBLE INPUT VAT</label>
   </div><button className="saveButton" disabled={busy||loading}>ADD EXPENSE</button></form>
  </div>
  <section className="adminPanel financeBox"><h3>PROFIT RECONCILIATION</h3><div className="financeRows">{[['Paid orders',calculation.count],['Sales net of estimated VAT',tr(calculation.salesNet)],['Shipping net',tr(calculation.shippingNet)],['COGS · unit / packaging / handling',tr(-calculation.cogs)],['Recorded expense cost',tr(-calculation.expensesNet)],['Operating result',tr(calculation.operatingProfit)],['Artist allocation estimate',tr(-calculation.artistShare)],['Remaining after artist allocation',tr(calculation.operatingProfit-calculation.artistShare)]].map(([a,b])=><div key={a}><span>{a}</span><strong>{b}</strong></div>)}</div>{calculation.unknownItems>0&&<p className="financeWarning">{calculation.unknownItems} order items could not be mapped to current product costs.</p>}<p className="financeWarning">Historical sales have no item-level VAT snapshots. These figures reconstruct tax using current default rates, and product costs are current values rather than historical cost snapshots. Do not use as a filed VAT return.</p></section>
  <section className="adminPanel financeBox"><h3>EXPENSE LEDGER</h3><div className="financeLedger">{filtered.expenses.length?filtered.expenses.map(e=><div key={e.id}><span>{e.expense_date} · {e.category.toUpperCase()}<small>{e.description}{e.reference?' · '+e.reference:''}</small></span><strong>{tr(e.gross_amount)} <small>VAT {e.vat_rate}%</small></strong><button disabled={busy} onClick={()=>deleteExpense(e.id)}>DELETE</button></div>):<p>No expense entries for this period.</p>}</div></section>
  <section className="adminPanel financeBox"><h3>ARTIST ROYALTY ESTIMATES</h3><div className="financeLedger">{calculation.artistRows.length?calculation.artistRows.map((r,i)=><div key={r.id||i}><span>{r.payee_name}<small>{products.find(p=>p.id===r.product_id)?.title||'PRODUCT'} · {r.share_percent}% of estimated product profit</small></span><strong>{tr(r.share)}</strong></div>):<p>No active artist royalty rules. Set them in Dashboard → Artist Profit Share.</p>}</div><p>Estimated obligations only; payout settlement and multi-party royalty allocation are not enabled in this version.</p></section>
 </section>;
}
