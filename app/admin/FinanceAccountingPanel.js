'use client';
import {useEffect,useMemo,useState} from 'react';
import {supabase} from '../lib/supabase';
const tr=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(Number(n)||0);
const financeGroups=[{name:'WORKSPACE',tabs:[['overview','OVERVIEW'],['profit','ORDER PROFIT'],['reports','REPORTS']]},{name:'ACCOUNTING',tabs:[['vat','VAT'],['expenses','EXPENSES'],['costs','PRODUCT COSTS'],['artists','ARTIST ROYALTIES']]},{name:'PAYMENTS',tabs:[['reconcile','RECONCILIATION'],['settlements','SETTLEMENTS'],['refunds','REFUNDS']]},{name:'CONTROLS',tabs:[['audit','ORDER AUDIT'],['periods','PERIOD CLOSE'],['integrity','DATA INTEGRITY']]}];
const cats=['production','packaging','shipping','payment_fee','marketing','software','tax','refund','other'];
const netVat=(amount,rate,included)=>{const a=Number(amount)||0,r=(Number(rate)||0)/100;const net=included?a/(1+r):a;return {net,vat:net*r,gross:included?a:net*(1+r)}};
const inputStyle={minHeight:40,background:'#0e0e0f',border:'1px solid #363638',padding:'9px 11px',color:'#e5e2de',width:'100%',minWidth:0};
export default function FinanceAccountingPanel({products=[]}){
 const [data,setData]=useState({settings:{sales_vat_rate:0,shipping_vat_rate:0,prices_include_vat:true},expenses:[]});
 const [orders,setOrders]=useState([]),[costs,setCosts]=useState([]),[rules,setRules]=useState([]);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const [draft,setDraft]=useState({expense_date:new Date().toISOString().slice(0,10),category:'production',description:'',gross_amount:'',vat_rate:'0',vat_included:true,deductible_vat:false,product_id:'',reference:''});
 const [period,setPeriod]=useState('all');
 const [financeTab,setFinanceTab]=useState('overview');
 const [artistPayments,setArtistPayments]=useState([]);
 const [artistAccruals,setArtistAccruals]=useState([]);
 const [accrualDraft,setAccrualDraft]=useState({rule_id:'',month:'',base:'',reference:''});
 const [snapshotStatus,setSnapshotStatus]=useState(null);
 const [orderAudit,setOrderAudit]=useState([]);
 const [integrityRows,setIntegrityRows]=useState([]);
 const [integrityFilter,setIntegrityFilter]=useState('issues');
 const [paymentAudit,setPaymentAudit]=useState([]);
 const [settlements,setSettlements]=useState([]);
 const [refunds,setRefunds]=useState([]);
 const [closures,setClosures]=useState([]);
 const [periodVariances,setPeriodVariances]=useState([]);
 const [closeMonth,setCloseMonth]=useState('');
 const [closeNotes,setCloseNotes]=useState('');
 const [refundDraft,setRefundDraft]=useState({order_id:'',refund_date:new Date().toISOString().slice(0,10),amount:'',reason:'',provider_reference:''});
 const [settleDraft,setSettleDraft]=useState({order_id:'',settlement_date:new Date().toISOString().slice(0,10),gross_amount:'',fee_amount:'0',provider:'other',reference:''});
 const [paymentFilter,setPaymentFilter]=useState('exceptions');
 const [auditFilter,setAuditFilter]=useState('all');
 const [profitFilter,setProfitFilter]=useState('review');
 const [payDraft,setPayDraft]=useState({royalty_rule_id:'',payment_date:new Date().toISOString().slice(0,10),amount:'',payment_method:'bank_transfer',reference:'',notes:''});
 const [costDraft,setCostDraft]=useState({product_id:'',unit_cost:'0',packaging_cost:'0',handling_cost:'0',notes:''});
 async function load(){
  if(!supabase)return;
  setLoading(true);setError('');
  const [f,o,c,r,ap,snap,audit,recon,settle,refundRows,periodRows,varianceRows,accrualRows,integrity]=await Promise.all([
   supabase.rpc('admin_finance_read'),
   supabase.from('orders').select('id,order_no,created_at,payment_status,status,total,subtotal,shipping_total,support_total,currency,order_items(variant_id,quantity,line_total,support_amount)').order('created_at',{ascending:false}).limit(1000),
   supabase.rpc('admin_list_product_costs'),
   supabase.rpc('admin_list_royalty_rules'),
   supabase.rpc('admin_finance_list_artist_payments'),
   supabase.rpc('admin_finance_snapshot_status'),
   supabase.rpc('admin_finance_order_audit',{p_limit:200}),
   supabase.rpc('admin_finance_payment_reconciliation',{p_limit:200}),
   supabase.rpc('admin_finance_list_settlements'),
   supabase.rpc('admin_finance_list_refunds'),
   supabase.rpc('admin_finance_list_closures'),
   supabase.rpc('admin_finance_period_variances'),
   supabase.rpc('admin_finance_list_artist_accruals'),
   supabase.rpc('admin_finance_order_integrity',{p_limit:200})
  ]);
  if(f.error)setError('Finance: '+f.error.message);else setData(f.data);
  if(o.error)setError(v=>v||'Orders: '+o.error.message);else setOrders(o.data||[]);
  if(c.error)setError(v=>v||'Costs: '+c.error.message);else setCosts(c.data||[]);
  if(r.error)setError(v=>v||'Royalties: '+r.error.message);else setRules(r.data||[]);
  if(ap.error)setError(v=>v||'Artist payments: '+ap.error.message);else setArtistPayments(ap.data||[]);
  if(snap.error)setError(v=>v||'Snapshots: '+snap.error.message);else setSnapshotStatus(snap.data);
  if(audit.error)setError(v=>v||'Audit: '+audit.error.message);else setOrderAudit(audit.data||[]);
  if(recon.error)setError(v=>v||'Payments audit: '+recon.error.message);else setPaymentAudit(recon.data||[]);
  if(settle.error)setError(v=>v||'Settlement ledger: '+settle.error.message);else setSettlements(settle.data||[]);
  if(refundRows.error)setError(v=>v||'Refunds: '+refundRows.error.message);else setRefunds(refundRows.data||[]);
  if(periodRows.error)setError(v=>v||'Period closures: '+periodRows.error.message);else setClosures(periodRows.data||[]);
  if(varianceRows.error)setError(v=>v||'Period variance: '+varianceRows.error.message);else setPeriodVariances(varianceRows.data||[]);
  if(accrualRows.error)setError(v=>v||'Artist accruals: '+accrualRows.error.message);else setArtistAccruals(accrualRows.data||[]);
  if(integrity.error)setError(v=>v||'Integrity: '+integrity.error.message);else setIntegrityRows(integrity.data||[]);
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
 const monthly=useMemo(()=>{
  const rows=new Map();
  const get=(month)=>{if(!rows.has(month))rows.set(month,{month,orders:0,salesNet:0,outputVat:0,inputVat:0,expenses:0,shippingNet:0});return rows.get(month)};
  filtered.sales.filter(o=>o.payment_status==='paid'&&!['refunded','cancelled'].includes(String(o.status).toLowerCase())).forEach(o=>{
   const m=String(o.created_at||'').slice(0,7);if(!m)return;
   const r=get(m),sale=netVat(Math.max(0,Number(o.total||0)-Number(o.shipping_total||0)),settings.sales_vat_rate,settings.prices_include_vat),shipping=netVat(o.shipping_total,settings.shipping_vat_rate,settings.prices_include_vat);
   r.orders++;r.salesNet+=sale.net;r.shippingNet+=shipping.net;r.outputVat+=sale.vat+shipping.vat;
  });
  filtered.expenses.forEach(e=>{
   const m=String(e.expense_date||'').slice(0,7);if(!m)return;
   const r=get(m),n=netVat(e.gross_amount,e.vat_rate,e.vat_included);
   r.expenses+=e.deductible_vat?n.net:n.gross;if(e.deductible_vat)r.inputVat+=n.vat;
  });
  return [...rows.values()].sort((a,b)=>b.month.localeCompare(a.month));
 },[filtered,settings]);
 const exportCsv=(filename,head,rows)=>{
  const safe=value=>{let v=String(value??'');if(/^[\\s]*[=+@-]/.test(v))v="'"+v;return '"'+v.replaceAll('"','""')+'"'};
  const content='\\uFEFF'+[head,...rows].map(row=>row.map(safe).join(';')).join('\\r\\n');
  const url=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 const downloadExpenses=()=>exportCsv('sideii-expenses.csv',['Date','Category','Description','Amount','VAT rate','VAT included','Deductible VAT','Product ID','Reference'],filtered.expenses.map(e=>[e.expense_date,e.category,e.description,e.gross_amount,e.vat_rate,e.vat_included,e.deductible_vat,e.product_id,e.reference]));
 const downloadMonthly=()=>exportCsv('sideii-monthly-estimates.csv',['Month','Paid orders','Sales net est.','Shipping net est.','Output VAT est.','Input VAT eligible est.','VAT balance est.','Recorded expense est.'],monthly.map(r=>[r.month,r.orders,r.salesNet.toFixed(2),r.shippingNet.toFixed(2),r.outputVat.toFixed(2),r.inputVat.toFixed(2),(r.outputVat-r.inputVat).toFixed(2),r.expenses.toFixed(2)]));
 const pickCostProduct=id=>{
  const cost=costs.find(x=>x.product_id===id);
  setCostDraft({product_id:id,unit_cost:String(cost?.unit_cost??0),packaging_cost:String(cost?.packaging_cost??0),handling_cost:String(cost?.handling_cost??0),notes:cost?.notes||''});
 };
 const saveCost=async(e)=>{
  e.preventDefault();if(!costDraft.product_id)return;
  setBusy(true);setError('');
  const {error}=await supabase.rpc('admin_save_product_cost',{p_product_id:costDraft.product_id,p_unit_cost:Number(costDraft.unit_cost),p_packaging_cost:Number(costDraft.packaging_cost),p_handling_cost:Number(costDraft.handling_cost),p_notes:costDraft.notes});
  if(error)setError(error.message);else{setMessage('Product unit cost updated.');await load()}
  setBusy(false);
 };
 const addArtistPayment=async(e)=>{
  e.preventDefault();setBusy(true);setError('');
  const {error}=await supabase.rpc('admin_finance_add_artist_payment',{p_royalty_rule_id:payDraft.royalty_rule_id,p_payment_date:payDraft.payment_date,p_amount:Number(payDraft.amount),p_payment_method:payDraft.payment_method,p_reference:payDraft.reference||null,p_notes:payDraft.notes||null});
  if(error)setError(error.message);else{setMessage('Payment recorded.');setPayDraft(d=>({...d,amount:'',reference:'',notes:''}));await load()}
  setBusy(false);
 };
 const settlement=useMemo(()=>{
  const paidByRule=new Map();
  artistPayments.forEach(p=>paidByRule.set(p.royalty_rule_id,(paidByRule.get(p.royalty_rule_id)||0)+Number(p.amount||0)));
  return calculation.artistRows.map(r=>({...r,paidAmount:paidByRule.get(r.id)||0,estimatedRemaining:r.share-(paidByRule.get(r.id)||0)}));
 },[calculation.artistRows,artistPayments]);
 const saveSettlement=async(e)=>{e.preventDefault();setBusy(true);setError('');const {error}=await supabase.rpc('admin_finance_add_settlement',{p_order_id:settleDraft.order_id,p_settlement_date:settleDraft.settlement_date,p_gross_amount:Number(settleDraft.gross_amount),p_fee_amount:Number(settleDraft.fee_amount),p_provider:settleDraft.provider,p_reference:settleDraft.reference||null,p_notes:null});if(error)setError(error.message);else{setMessage('Settlement entry saved.');setSettleDraft(v=>({...v,gross_amount:'',fee_amount:'0',reference:''}));await load()}setBusy(false)};
 const settlementTotals=useMemo(()=>settlements.reduce((a,s)=>({gross:a.gross+Number(s.gross_amount||0),fees:a.fees+Number(s.fee_amount||0),net:a.net+Number(s.net_amount||0)}),{gross:0,fees:0,net:0}),[settlements]);
 const saveRefund=async(e)=>{e.preventDefault();if(!window.confirm('Confirm this is a record of an already-processed refund? This will NOT send money.'))return;setBusy(true);setError('');const {error}=await supabase.rpc('admin_finance_add_refund',{p_order_id:refundDraft.order_id,p_refund_date:refundDraft.refund_date,p_amount:Number(refundDraft.amount),p_reason:refundDraft.reason,p_provider_reference:refundDraft.provider_reference||null,p_notes:null});if(error)setError(error.message);else{setMessage('Refund record added. No payment action was initiated.');setRefundDraft(d=>({...d,amount:'',reason:'',provider_reference:''}));await load()}setBusy(false)};
 const refundTotal=useMemo(()=>refunds.reduce((sum,r)=>sum+Number(r.amount||0),0),[refunds]);
 const closeAccountingMonth=async(e)=>{e.preventDefault();if(!/^\\d{4}-\\d{2}$/.test(closeMonth))return;const periodDate=closeMonth+'-01';if(!window.confirm('Freeze a read-only operational summary for '+closeMonth+'? Existing orders and expenses will NOT be locked. This cannot be overwritten.'))return;setBusy(true);setError('');const {error}=await supabase.rpc('admin_finance_close_month',{p_month:periodDate,p_notes:closeNotes||null});if(error)setError(error.message);else{setMessage('Month-end operational snapshot stored.');setCloseNotes('');await load()}setBusy(false)};
 const monthPnL=useMemo(()=>{
  const map=new Map();
  const row=m=>{if(!map.has(m))map.set(m,{month:m,revenue:0,shipping:0,cogs:0,expenses:0,fees:0,refunds:0,artistCash:0,orderCount:0});return map.get(m)};
  const variantProduct=new Map(products.flatMap(p=>(p.product_variants||[]).map(v=>[String(v.id),p.id])));
  const unitCost=new Map(costs.map(x=>[String(x.product_id),Number(x.unit_cost||0)+Number(x.packaging_cost||0)+Number(x.handling_cost||0)]));
  orders.filter(o=>o.currency==='TRY'&&o.payment_status==='paid'&&!['cancelled','refunded'].includes(String(o.status).toLowerCase())).forEach(o=>{
   const m=String(o.created_at||'').slice(0,7),r=row(m);
   const sale=netVat(Math.max(0,Number(o.total||0)-Number(o.shipping_total||0)),settings.sales_vat_rate,settings.prices_include_vat);
   const ship=netVat(o.shipping_total,settings.shipping_vat_rate,settings.prices_include_vat);
   r.revenue+=sale.net;r.shipping+=ship.net;r.orderCount++;
   (o.order_items||[]).forEach(i=>r.cogs+=Number(i.quantity||0)*(unitCost.get(variantProduct.get(String(i.variant_id)))||0));
  });
  entries.forEach(e=>{const m=String(e.expense_date||'').slice(0,7);if(m){const v=netVat(e.gross_amount,e.vat_rate,e.vat_included);row(m).expenses+=e.deductible_vat?v.net:v.gross}});
  settlements.forEach(s=>{const m=String(s.settlement_date||'').slice(0,7);if(m)row(m).fees+=Number(s.fee_amount||0)});
  refunds.forEach(r=>{const m=String(r.refund_date||'').slice(0,7);if(m)row(m).refunds+=Number(r.amount||0)});
  artistPayments.forEach(a=>{const m=String(a.payment_date||'').slice(0,7);if(m)row(m).artistCash+=Number(a.amount||0)});
  return [...map.values()].sort((a,b)=>b.month.localeCompare(a.month));
 },[orders,products,costs,settings,entries,settlements,refunds,artistPayments]);
 const exportPnL=()=>exportCsv('sideii-monthly-management-report.csv',['Month','Paid orders TRY','Sales net estimate TRY','Shipping net estimate TRY','Current cost estimate TRY','Expense ledger TRY','Provider fees TRY','Refund cash flows TRY','Artist payments cash TRY','Indicative result before refund allocations'],monthPnL.map(r=>[r.month,r.orderCount,r.revenue.toFixed(2),r.shipping.toFixed(2),r.cogs.toFixed(2),r.expenses.toFixed(2),r.fees.toFixed(2),r.refunds.toFixed(2),r.artistCash.toFixed(2),(r.revenue+r.shipping-r.cogs-r.expenses-r.fees).toFixed(2)]));
 const orderProfitRows=useMemo(()=>{
  const variantProduct=new Map(products.flatMap(p=>(p.product_variants||[]).map(v=>[String(v.id),String(p.id)])));
  const costByProduct=new Map(costs.map(x=>[String(x.product_id),Number(x.unit_cost||0)+Number(x.packaging_cost||0)+Number(x.handling_cost||0)]));
  const refundByOrder=new Map(),feeByOrder=new Map();
  refunds.forEach(r=>refundByOrder.set(String(r.order_id),(refundByOrder.get(String(r.order_id))||0)+Number(r.amount||0)));
  settlements.forEach(s=>feeByOrder.set(String(s.order_id),(feeByOrder.get(String(s.order_id))||0)+Number(s.fee_amount||0)));
  return orders.filter(o=>o.currency==='TRY').map(o=>{
   const items=o.order_items||[];let cogs=0,unmapped=0;
   items.forEach(i=>{const product=variantProduct.get(String(i.variant_id));if(!product||!costByProduct.has(product))unmapped++;else cogs+=Number(i.quantity||0)*costByProduct.get(product)});
   const paid=o.payment_status==='paid',refund=refundByOrder.get(String(o.id))||0,fee=feeByOrder.get(String(o.id))||0;
   const sale=netVat(Math.max(0,Number(o.total||0)-Number(o.shipping_total||0)),settings.sales_vat_rate,settings.prices_include_vat);
   const ship=netVat(o.shipping_total,settings.shipping_vat_rate,settings.prices_include_vat);
   const estimated=paid?sale.net+ship.net-cogs-fee:null;
   return {id:o.id,no:o.order_no,date:String(o.created_at||'').slice(0,10),status:o.payment_status,total:Number(o.total||0),paid,refund,fee,cogs,unmapped,netSales:paid?sale.net+ship.net:null,estimated,requiresReview:unmapped>0||refund>0||!paid||Number(settings.sales_vat_rate)===0};
  }).sort((a,b)=>b.date.localeCompare(a.date));
 },[orders,products,costs,refunds,settlements,settings]);
 const exportOrderProfit=()=>exportCsv('sideii-order-profit-review.csv',['Order','Date','Payment','Gross TRY','Net sales estimate TRY','COGS current TRY','Provider fees TRY','Recorded refunds TRY','Indicative before refund TRY','Unmapped items','Review needed'],orderProfitRows.map(r=>[r.no,r.date,r.status,r.total,r.netSales??'',r.cogs,r.fee,r.refund,r.estimated??'',r.unmapped,r.requiresReview]));
 const exportPeriodVariances=()=>exportCsv('sideii-period-variances.csv',['Period','Metric','Frozen TRY','Current TRY','Difference TRY','Closed at'],periodVariances.map(v=>[v.period_month,v.metric,v.frozen_amount,v.current_amount,v.delta,v.closed_at]));
 const recordAccrual=async(e)=>{e.preventDefault();if(!window.confirm('Record this reviewed artist accrual permanently? Verify the source and base first.'))return;setBusy(true);setError('');const {error}=await supabase.rpc('admin_finance_record_artist_accrual',{p_rule_id:accrualDraft.rule_id,p_month:accrualDraft.month+'-01',p_base:Number(accrualDraft.base),p_source_reference:accrualDraft.reference,p_notes:null});if(error)setError(error.message);else{setMessage('Reviewed accrual recorded.');setAccrualDraft(v=>({...v,base:'',reference:''}));await load()}setBusy(false)};
 const artistBalance=useMemo(()=>{
  const grouped=new Map();
  const ensure=(id,name)=>{if(!grouped.has(id))grouped.set(id,{id,name:name||'Artist',accrued:0,paid:0,months:0});return grouped.get(id)};
  artistAccruals.forEach(a=>{const row=ensure(a.royalty_rule_id,a.payee_name);row.accrued+=Number(a.accrued_amount||0);row.months++});
  artistPayments.forEach(p=>{const rule=rules.find(r=>r.id===p.royalty_rule_id);ensure(p.royalty_rule_id,rule?.payee_name).paid+=Number(p.amount||0)});
  return [...grouped.values()].map(r=>({...r,balance:r.accrued-r.paid})).sort((a,b)=>a.name.localeCompare(b.name));
 },[artistAccruals,artistPayments,rules]);
 const exportArtistBalance=()=>exportCsv('sideii-artist-reconciliation.csv',['Artist','Agreement ID','Accrual months','Approved accrual TRY','Recorded payments TRY','Remaining TRY'],artistBalance.map(r=>[r.name,r.id,r.months,r.accrued.toFixed(2),r.paid.toFixed(2),r.balance.toFixed(2)]));
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
  <div className="financeHealth" role="status"><strong>ACCOUNTING READINESS</strong><span>{loading?'CHECKING DATA':Number(settings.sales_vat_rate)===0?'SALES VAT NOT CONFIGURED':'VAT RATE CONFIGURED'}</span><span>{costs.length===0?'NO PRODUCT COSTS RECORDED':costs.length+' PRODUCT COST RECORDS'}</span><span>{rules.filter(r=>r.active).length===0?'NO ACTIVE ARTIST RULES':rules.filter(r=>r.active).length+' ARTIST RULES'}</span><small>Figures are estimates using current rates and costs, not finalized statutory accounts.</small></div>
  {snapshotStatus&&<div className="financeHealth" role="status"><strong>ORDER COST / VAT SNAPSHOTS</strong><span>{snapshotStatus.captured} NEW ITEM RECORDS</span><span>{snapshotStatus.legacy_without_snapshot} HISTORICAL ITEMS NOT BACKFILLED</span><span>{snapshotStatus.cost_missing} MISSING COST</span><span>{snapshotStatus.vat_unconfigured} VAT NOT VERIFIED</span><small>Snapshot records are captured when new order items are inserted. Historic orders remain unchanged. Displayed profit estimates are still calculated separately from current settings.</small></div>}
  <nav className="financeNavGroups" aria-label="Finance sections">{financeGroups.map(group=><div className="financeNavGroup" key={group.name}><span className="financeNavGroupLabel">{group.name}</span><div className="financeNavButtons">{group.tabs.map(([id,label])=><button type="button" key={id} className={financeTab===id?'active':''} aria-current={financeTab===id?'page':undefined} onClick={()=>setFinanceTab(id)}>{label}</button>)}</div></div>)}</nav>
{financeTab==='overview'&&<div className="financeKpis">{card('NET SALES (EST.)',calculation.salesNet,'excluding estimated VAT')}{card('OUTPUT VAT',calculation.outputVat+calculation.shippingVat,'sales and shipping')}{card('INPUT VAT (ELIGIBLE)',calculation.inputVat,'recorded expenses')}{card('VAT BALANCE (EST.)',calculation.vatBalance,'negative = potential credit')}{card('OPERATING RESULT',calculation.operatingProfit,'before tax and artist payments')}{card('ARTIST SHARE (EST.)',calculation.artistShare,'product profit basis')}</div>}
  <div className="financeColumns">
   {financeTab==='vat'&&<section className="adminPanel financeBox"><h3>VAT SETTINGS</h3><p>Defaults for estimated reporting only. Not a tax invoice or e-ledger.</p><div className="financeFields">
    {control('SALES VAT %',field(settings.sales_vat_rate,v=>setData(d=>({...d,settings:{...d.settings,sales_vat_rate:v}})),'number',{min:0,max:100,step:.1}))}
    {control('SHIPPING VAT %',field(settings.shipping_vat_rate,v=>setData(d=>({...d,settings:{...d.settings,shipping_vat_rate:v}})),'number',{min:0,max:100,step:.1}))}
    <label className="financeCheck"><input type="checkbox" checked={!!settings.prices_include_vat} onChange={e=>setData(d=>({...d,settings:{...d.settings,prices_include_vat:e.target.checked}}))}/> PRICES INCLUDE VAT</label>
   </div><button className="saveButton" onClick={saveSettings} disabled={busy||loading}>SAVE VAT SETTINGS</button></section>}
   {financeTab==='expenses'&&<form className="adminPanel financeBox" onSubmit={addExpense}><h3>RECORD EXPENSE</h3><p>Expense VAT is deductible only when you explicitly mark it eligible.</p><div className="financeFields">
    {control('DATE',field(draft.expense_date,v=>setDraft(d=>({...d,expense_date:v})),'date',{required:true}))}
    {control('CATEGORY',<select style={inputStyle} value={draft.category} onChange={e=>setDraft(d=>({...d,category:e.target.value}))}>{cats.map(x=><option key={x} value={x}>{x.toUpperCase().replaceAll('_',' ')}</option>)}</select>)}
    {control('DESCRIPTION',field(draft.description,v=>setDraft(d=>({...d,description:v})),'text',{required:true,maxLength:300}))}
    {control('AMOUNT',field(draft.gross_amount,v=>setDraft(d=>({...d,gross_amount:v})),'number',{required:true,min:0,step:.01}))}
    {control('EXPENSE VAT %',field(draft.vat_rate,v=>setDraft(d=>({...d,vat_rate:v})),'number',{min:0,max:100,step:.1}))}
    {control('RELATED PRODUCT',<select style={inputStyle} value={draft.product_id} onChange={e=>setDraft(d=>({...d,product_id:e.target.value}))}><option value="">GENERAL / NONE</option>{products.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select>)}
    {control('INVOICE / REFERENCE',field(draft.reference,v=>setDraft(d=>({...d,reference:v}))))}
    <label className="financeCheck"><input type="checkbox" checked={draft.vat_included} onChange={e=>setDraft(d=>({...d,vat_included:e.target.checked}))}/> AMOUNT INCLUDES VAT</label>
    <label className="financeCheck"><input type="checkbox" checked={draft.deductible_vat} onChange={e=>setDraft(d=>({...d,deductible_vat:e.target.checked}))}/> DEDUCTIBLE INPUT VAT</label>
   </div><button className="saveButton" disabled={busy||loading}>ADD EXPENSE</button></form>}
  </div>
  {financeTab==='costs'&&<section className="adminPanel financeBox"><h3>PRODUCT COST CARDS</h3><p>Enter unit production, packaging and handling costs for each product. These are current estimates, not a historic inventory ledger. Do not also expense the same cost as a direct cost of goods sold.</p>
   <form onSubmit={saveCost} className="financeFields">
    {control('PRODUCT',<select style={inputStyle} value={costDraft.product_id} required onChange={e=>pickCostProduct(e.target.value)}><option value="">SELECT PRODUCT</option>{products.map(p=><option key={p.id} value={p.id}>{p.catalogue_no} · {p.title}</option>)}</select>)}
    {control('PRODUCTION / UNIT (TRY)',field(costDraft.unit_cost,v=>setCostDraft(d=>({...d,unit_cost:v})),'number',{required:true,min:0,step:'.01'}))}
    {control('PACKAGING / UNIT (TRY)',field(costDraft.packaging_cost,v=>setCostDraft(d=>({...d,packaging_cost:v})),'number',{required:true,min:0,step:'.01'}))}
    {control('HANDLING / UNIT (TRY)',field(costDraft.handling_cost,v=>setCostDraft(d=>({...d,handling_cost:v})),'number',{required:true,min:0,step:'.01'}))}
    {control('COST NOTES',field(costDraft.notes,v=>setCostDraft(d=>({...d,notes:v}))))}
    <div style={{display:'grid',alignContent:'end'}}><button className="saveButton" disabled={busy||loading||!costDraft.product_id}>SAVE PRODUCT COST</button></div>
   </form>
   <div className="financeLedger">{products.filter(p=>costs.some(x=>x.product_id===p.id)).map(p=>{const cost=costs.find(x=>x.product_id===p.id);return <div key={p.id}><span>{p.title}<small>{p.catalogue_no} · unit + pack + handling</small></span><strong>{tr(Number(cost.unit_cost||0)+Number(cost.packaging_cost||0)+Number(cost.handling_cost||0))}</strong><button type="button" onClick={()=>pickCostProduct(p.id)}>EDIT</button></div>})}</div>
  </section>}
  {financeTab==='overview'&&<section className="adminPanel financeBox"><h3>PROFIT RECONCILIATION</h3><div className="financeRows">{[['Paid orders',calculation.count],['Sales net of estimated VAT',tr(calculation.salesNet)],['Shipping net',tr(calculation.shippingNet)],['COGS · unit / packaging / handling',tr(-calculation.cogs)],['Recorded expense cost',tr(-calculation.expensesNet)],['Operating result',tr(calculation.operatingProfit)],['Artist allocation estimate',tr(-calculation.artistShare)],['Remaining after artist allocation',tr(calculation.operatingProfit-calculation.artistShare)]].map(([a,b])=><div key={a}><span>{a}</span><strong>{b}</strong></div>)}</div>{calculation.unknownItems>0&&<p className="financeWarning">{calculation.unknownItems} order items could not be mapped to current product costs.</p>}<p className="financeWarning">Historical sales have no item-level VAT snapshots. These figures reconstruct tax using current default rates, and product costs are current values rather than historical cost snapshots. Do not use as a filed VAT return.</p></section>}
  {financeTab==='vat'&&<section className="adminPanel financeBox"><div className="financeHeading"><h3>MONTHLY TAX & CASHFLOW ESTIMATES</h3><button type="button" onClick={downloadMonthly}>EXPORT CSV ↓</button></div><div className="financeMonthly">{monthly.length?monthly.map(r=><div key={r.month}><b>{r.month}</b><span>{r.orders} paid orders</span><span>NET SALES {tr(r.salesNet)}</span><span>OUTPUT VAT {tr(r.outputVat)}</span><span>INPUT VAT {tr(r.inputVat)}</span><strong>VAT BALANCE {tr(r.outputVat-r.inputVat)}</strong></div>):<p>No sales or expenses for this period.</p>}</div><p>Month groups use recorded dates. Figures are estimates, not a tax return; a negative VAT balance is not automatically a refundable tax credit.</p></section>}
  {financeTab==='expenses'&&<section className="adminPanel financeBox"><div className="financeHeading"><h3>EXPENSE LEDGER</h3><button type="button" onClick={downloadExpenses}>EXPORT CSV ↓</button></div><div className="financeLedger">{filtered.expenses.length?filtered.expenses.map(e=><div key={e.id}><span>{e.expense_date} · {e.category.toUpperCase()}<small>{e.description}{e.reference?' · '+e.reference:''}</small></span><strong>{tr(e.gross_amount)} <small>VAT {e.vat_rate}%</small></strong><button disabled={busy} onClick={()=>deleteExpense(e.id)}>DELETE</button></div>):<p>No expense entries for this period.</p>}</div></section>}
  {financeTab==='artists'&&<section className="adminPanel financeBox"><h3>ARTIST PAYMENT LEDGER</h3><p>Record completed payments against an artist agreement. Amounts are in TRY and do not change sales profit.</p><form className="financeFields" onSubmit={addArtistPayment}>
    {control('ARTIST AGREEMENT',<select required style={inputStyle} value={payDraft.royalty_rule_id} onChange={e=>setPayDraft(d=>({...d,royalty_rule_id:e.target.value}))}><option value="">SELECT RULE</option>{rules.filter(r=>r.active).map(r=><option value={r.id} key={r.id}>{r.payee_name} · {r.share_percent}% · {products.find(p=>p.id===r.product_id)?.title||'Product'}</option>)}</select>)}
    {control('DATE',field(payDraft.payment_date,v=>setPayDraft(d=>({...d,payment_date:v})),'date',{required:true}))}
    {control('AMOUNT TRY',field(payDraft.amount,v=>setPayDraft(d=>({...d,amount:v})),'number',{required:true,min:'.01',step:'.01'}))}
    {control('PAYMENT METHOD',<select style={inputStyle} value={payDraft.payment_method} onChange={e=>setPayDraft(d=>({...d,payment_method:e.target.value}))}><option value="bank_transfer">BANK TRANSFER</option><option value="cash">CASH</option><option value="other">OTHER</option></select>)}
    {control('REFERENCE',field(payDraft.reference,v=>setPayDraft(d=>({...d,reference:v}))))}
    {control('NOTES',field(payDraft.notes,v=>setPayDraft(d=>({...d,notes:v}))))}
    <button className="saveButton" disabled={busy||loading||!payDraft.royalty_rule_id}>RECORD PAYMENT</button>
   </form><div className="financeLedger">{artistPayments.length?artistPayments.map(p=>{const rule=rules.find(r=>r.id===p.royalty_rule_id);return <div key={p.id}><span>{p.payment_date} · {rule?.payee_name||'Artist'}<small>{p.payment_method} · {p.reference||'No reference'}</small></span><strong>{tr(p.amount)}</strong></div>}):<p>No artist payments recorded.</p>}</div></section>}
  {financeTab==='artists'&&<section className="adminPanel financeBox"><h3>ARTIST ROYALTY ESTIMATES</h3><div className="financeLedger">{settlement.length?settlement.map((r,i)=><div key={r.id||i}><span>{r.payee_name}<small>{products.find(p=>p.id===r.product_id)?.title||'PRODUCT'} · {r.share_percent}% of estimated product profit</small></span><strong>{tr(r.estimatedRemaining)}<small>Estimated remaining · paid {tr(r.paidAmount)} / earned {tr(r.share)}</small></strong></div>):<p>No active artist royalty rules. Set them in Dashboard → Artist Profit Share.</p>}</div><p>Balances are provisional and based on current product costs and active rules rather than immutable sale-time royalty accruals. Missing item mappings, refunds and rate changes can change the estimated balance. A negative balance means recorded payments exceed the current estimate.</p></section>}
  {financeTab==='audit'&&<section className="adminPanel financeBox financeAudit">
    <div className="financeHeading"><h3>ORDER SNAPSHOT AUDIT</h3><select style={inputStyle} value={auditFilter} onChange={e=>setAuditFilter(e.target.value)} aria-label="Filter order audit"><option value="all">ALL ORDERS</option><option value="paid">PAID</option><option value="missing">MISSING RECORDS</option><option value="complete">SNAPSHOTS COMPLETE</option></select></div>
    <p>Read-only comparison against captured order-item values. Snapshot net/VAT figures are estimated at insertion and do not yet reconcile later discounts, refunds, final invoices or payment fees. Missing snapshots were not retroactively created.</p>
    <div className="financeAuditScroll"><table><thead><tr><th>ORDER</th><th>STATUS</th><th>CAPTURED</th><th>NET SNAPSHOT</th><th>VAT SNAPSHOT</th><th>COST SNAPSHOT</th><th>DATA QUALITY</th></tr></thead><tbody>{orderAudit.filter(o=>auditFilter==='all'||(auditFilter==='paid'&&o.payment_status==='paid')||(auditFilter==='missing'&&(Number(o.snapshot_count)<Number(o.order_item_count)||Number(o.missing_cost_count)>0||Number(o.unverified_vat_count)>0))||(auditFilter==='complete'&&Number(o.snapshot_count)===Number(o.order_item_count)&&Number(o.missing_cost_count)===0&&Number(o.unverified_vat_count)===0)).map(o=><tr key={o.order_id}><td><b>#SII-{String(o.order_no).padStart(4,'0')}</b><small>{String(o.created_at).slice(0,10)}</small></td><td>{o.payment_status}<small>{o.order_status}</small></td><td>{o.snapshot_count} / {o.order_item_count}</td><td>{o.snapshot_net==null?'—':tr(o.snapshot_net)}</td><td>{o.snapshot_vat==null?'—':tr(o.snapshot_vat)}</td><td>{o.snapshot_cost==null?'—':tr(o.snapshot_cost)}</td><td>{Number(o.snapshot_count)<Number(o.order_item_count)?'NO HISTORIC SNAPSHOT':Number(o.missing_cost_count)>0?'COST INCOMPLETE':Number(o.unverified_vat_count)>0?'VAT UNVERIFIED':'CAPTURED · NOT FINAL'}</td></tr>)}</tbody></table></div>
    {orderAudit.length===0&&<p>No order line data available.</p>}
    <small>Showing up to 200 most recent orders with line items. Other currencies are not converted; values are presented in the store's TRY-oriented reporting format.</small>
   </section>}
  {financeTab==='reconcile'&&<section className="adminPanel financeBox financeAudit"><div className="financeHeading"><h3>PAYMENT RECONCILIATION</h3><select style={inputStyle} value={paymentFilter} onChange={e=>setPaymentFilter(e.target.value)}><option value="exceptions">REVIEW REQUIRED</option><option value="all">ALL ORDERS</option><option value="paid">PAID ORDERS</option></select></div><p>Read-only review of order payment status and provider event records. Provider event totals are not necessarily net settled funds; refunds, fee deductions and event types may require manual review.</p><div className="financeAuditScroll"><table><thead><tr><th>ORDER</th><th>PAYMENT STATUS</th><th>ORDER TOTAL</th><th>EVENTS</th><th>EVENT AMOUNTS</th><th>EVENT TYPES</th><th>REVIEW</th></tr></thead><tbody>{paymentAudit.filter(o=>{const issue=(o.payment_status==='paid'&&Number(o.event_count)===0)||(o.payment_status!=='paid'&&Number(o.event_count)>0)||(['refunded','cancelled'].includes(String(o.order_status).toLowerCase())&&o.payment_status==='paid');return paymentFilter==='all'||(paymentFilter==='paid'&&o.payment_status==='paid')||(paymentFilter==='exceptions'&&issue)}).map(o=>{const missing=o.payment_status==='paid'&&Number(o.event_count)===0,extra=o.payment_status!=='paid'&&Number(o.event_count)>0,conflict=['refunded','cancelled'].includes(String(o.order_status).toLowerCase())&&o.payment_status==='paid';return <tr key={o.order_id}><td><strong>#{o.order_no}</strong><small>{String(o.created_at).slice(0,10)}</small></td><td>{o.payment_status}<small>{o.order_status}</small></td><td>{o.order_total} {o.currency}</td><td>{o.event_count}</td><td>{o.event_amount??'—'} {o.currency}</td><td>{o.event_types||'—'}</td><td>{conflict?'STATUS CONFLICT':missing?'PAID · NO EVENT':extra?'EVENT · NOT PAID':'CHECK EVENT TYPES'}</td></tr>})}</tbody></table></div><small>Limited to the 200 newest orders. This is an exception queue, not a bank settlement or legally finalized accounting report.</small></section>}
  {financeTab==='settlements'&&<section className="adminPanel financeBox"><h3>PAYMENT SETTLEMENT LEDGER</h3><p>Manual records of provider payouts. These are separate from payment events and do not automatically change order status or tax figures.</p><div className="financeKpis">{card('GROSS RECORDED',settlementTotals.gross)}{card('PROVIDER FEES',settlementTotals.fees)}{card('NET RECORDED',settlementTotals.net)}</div><form className="financeFields" onSubmit={saveSettlement}>
    {control('ORDER',<select required style={inputStyle} value={settleDraft.order_id} onChange={e=>setSettleDraft(v=>({...v,order_id:e.target.value}))}><option value="">SELECT TRY ORDER</option>{orders.filter(o=>o.currency==='TRY').map(o=><option key={o.id} value={o.id}>#{o.order_no} · {tr(o.total)}</option>)}</select>)}
    {control('SETTLEMENT DATE',field(settleDraft.settlement_date,v=>setSettleDraft(d=>({...d,settlement_date:v})),'date',{required:true}))}
    {control('GROSS AMOUNT TRY',field(settleDraft.gross_amount,v=>setSettleDraft(d=>({...d,gross_amount:v})),'number',{required:true,min:0,step:'.01'}))}
    {control('FEE TRY',field(settleDraft.fee_amount,v=>setSettleDraft(d=>({...d,fee_amount:v})),'number',{required:true,min:0,step:'.01'}))}
    {control('PROVIDER',field(settleDraft.provider,v=>setSettleDraft(d=>({...d,provider:v})),'text',{required:true,maxLength:80}))}
    {control('BANK REFERENCE',field(settleDraft.reference,v=>setSettleDraft(d=>({...d,reference:v})),'text',{maxLength:150}))}
    <button className="saveButton" disabled={busy||loading||!settleDraft.order_id}>RECORD SETTLEMENT</button>
   </form><div className="financeLedger">{settlements.map(s=><div key={s.id}><span>{s.settlement_date} · ORDER #{orders.find(o=>o.id===s.order_id)?.order_no||'—'}<small>{s.provider} · {s.reference||'No reference'}</small></span><strong>{tr(s.net_amount)}<small>Gross {tr(s.gross_amount)} · Fee {tr(s.fee_amount)}</small></strong></div>)}{settlements.length===0&&<p>No settlement entries yet.</p>}</div></section>}
  {financeTab==='refunds'&&<section className="adminPanel financeBox"><h3>REFUND JOURNAL</h3><p>Record refunds already completed outside SIDE:II. This form does NOT issue a payment refund, alter order status, or create a tax credit note. Full and partial entries are both supported, with a per-order total cap.</p><div className="financeKpis">{card('REFUNDS RECORDED',refundTotal)}{card('NET OF RECORDED REFUNDS',settlementTotals.net-refundTotal,'Settlement net less recorded refunds; not a bank balance')}</div><form onSubmit={saveRefund} className="financeFields">
    {control('ORDER',<select required style={inputStyle} value={refundDraft.order_id} onChange={e=>setRefundDraft(d=>({...d,order_id:e.target.value}))}><option value="">SELECT TRY ORDER</option>{orders.filter(o=>o.currency==='TRY').map(o=><option key={o.id} value={o.id}>#{o.order_no} · {tr(o.total)}</option>)}</select>)}
    {control('REFUND DATE',field(refundDraft.refund_date,v=>setRefundDraft(d=>({...d,refund_date:v})),'date',{required:true}))}
    {control('REFUND AMOUNT TRY',field(refundDraft.amount,v=>setRefundDraft(d=>({...d,amount:v})),'number',{required:true,min:'.01',step:'.01'}))}
    {control('REASON',field(refundDraft.reason,v=>setRefundDraft(d=>({...d,reason:v})),'text',{required:true,minLength:3,maxLength:250}))}
    {control('PROVIDER REFERENCE',field(refundDraft.provider_reference,v=>setRefundDraft(d=>({...d,provider_reference:v})),'text',{maxLength:150}))}
    <button className="saveButton" disabled={busy||loading||!refundDraft.order_id}>RECORD COMPLETED REFUND</button>
   </form><div className="financeLedger">{refunds.length?refunds.map(r=><div key={r.id}><span>{r.refund_date} · ORDER #{orders.find(o=>o.id===r.order_id)?.order_no||'—'}<small>{r.reason} · {r.provider_reference||'No reference'}</small></span><strong>{tr(r.amount)}</strong></div>):<p>No refunds recorded yet.</p>}</div><p className="financeWarning">Refund amounts are not automatically deducted from estimated tax, order snapshots, or artist royalties. Those adjustments require an approved reconciliation workflow.</p></section>}
  {financeTab==='periods'&&<section className="adminPanel financeBox"><h3>MONTH-END OPERATIONS SNAPSHOT</h3><p>Freeze a dated, read-only summary of orders and recorded journal amounts. This is NOT a tax closing, general ledger, statutory financial statement, or transaction lock. Later entries remain possible but do not rewrite the saved summary.</p><form className="financeFields" onSubmit={closeAccountingMonth}>{control('COMPLETED MONTH',<input style={inputStyle} type="month" required value={closeMonth} onChange={e=>setCloseMonth(e.target.value)}/>)}{control('NOTES',field(closeNotes,setCloseNotes,'text',{maxLength:300}))}<button className="saveButton" disabled={busy||loading||!closeMonth}>FREEZE MONTH SNAPSHOT</button></form><div className="financeLedger">{closures.length?closures.map(x=><div key={x.period_month}><span>{x.period_month.slice(0,7)} · FROZEN {String(x.closed_at).slice(0,10)}<small>{x.notes||'Operational summary'} · paid orders {x.report?.paid_order_count||0} · recorded refunds {tr(x.report?.recorded_refunds)}</small></span><strong>{tr(x.report?.paid_order_gross)}<small>Paid TRY gross · expenses {tr(x.report?.recorded_expense_gross)}</small></strong></div>):<p>No frozen periods yet.</p>}</div><div className="financeHeading"><h3>PERIOD VARIANCE REPORT</h3><button type="button" onClick={exportPeriodVariances} disabled={!periodVariances.length}>EXPORT CSV ↓</button></div><div className="financeAuditScroll"><table><thead><tr><th>MONTH</th><th>METRIC</th><th>FROZEN</th><th>CURRENT</th><th>DELTA</th></tr></thead><tbody>{periodVariances.map(v=><tr key={v.period_month+v.metric}><td>{v.period_month.slice(0,7)}</td><td>{v.metric.replaceAll('_',' ').toUpperCase()}</td><td>{tr(v.frozen_amount)}</td><td>{tr(v.current_amount)}</td><td>{tr(v.delta)}</td></tr>)}</tbody></table></div><p className="financeWarning">Variance is current amount minus frozen summary; it can reflect late entries or changed order statuses. It is not an automatically posted accounting adjustment.</p><p className="financeWarning">Period totals group orders by UTC order creation date, while refunds, fees and expenses use their recorded entry dates. Do not use this snapshot as a tax filing or bank reconciliation.</p></section>}
  {financeTab==='reports'&&<section className="adminPanel financeBox financeAudit"><div className="financeHeading"><h3>MONTHLY MANAGEMENT REPORT</h3><button type="button" onClick={exportPnL} disabled={!monthPnL.length}>EXPORT CSV ↓</button></div><p>Management estimates based on paid TRY orders, current product costs, configured VAT defaults and recorded expenses. Payment fees and cash movements are shown separately to avoid counting artist payments or refunds as additional product costs.</p><div className="financeAuditScroll"><table><thead><tr><th>MONTH</th><th>PAID ORDERS</th><th>NET SALES EST.</th><th>SHIPPING NET EST.</th><th>COGS CURRENT</th><th>EXPENSES</th><th>PROVIDER FEES</th><th>INDICATIVE RESULT</th><th>REFUND CASH</th><th>ARTIST PAID CASH</th></tr></thead><tbody>{monthPnL.map(r=><tr key={r.month}><td>{r.month}</td><td>{r.orderCount}</td><td>{tr(r.revenue)}</td><td>{tr(r.shipping)}</td><td>{tr(r.cogs)}</td><td>{tr(r.expenses)}</td><td>{tr(r.fees)}</td><td><strong>{tr(r.revenue+r.shipping-r.cogs-r.expenses-r.fees)}</strong></td><td>{tr(r.refunds)}</td><td>{tr(r.artistCash)}</td></tr>)}</tbody></table></div><p className="financeWarning">Indicative result is NOT net profit: refund allocation, inventory accounting, royalty accrual, tax adjustments and historical COGS remain unresolved. Artist payouts are cash movements and are not subtracted a second time here. Where expenses already include payment fees, those fees must be reconciled to avoid double counting. Order creation month may differ from payment date.</p></section>}
  {financeTab==='profit'&&<section className="adminPanel financeBox financeAudit"><div className="financeHeading"><h3>ORDER PROFIT REVIEW</h3><button type="button" onClick={exportOrderProfit}>EXPORT CSV ↓</button></div><p>Order-level management estimate using current product costs and VAT defaults. Refund amounts are shown separately because their tax and inventory allocation is not finalized.</p><div className="financeHeading"><select style={inputStyle} value={profitFilter} onChange={e=>setProfitFilter(e.target.value)}><option value="review">NEEDS REVIEW</option><option value="all">ALL TRY ORDERS</option><option value="paid">PAID</option></select></div><div className="financeAuditScroll"><table><thead><tr><th>ORDER</th><th>STATUS</th><th>GROSS</th><th>NET SALES EST.</th><th>CURRENT COGS</th><th>FEES</th><th>REFUND CASH</th><th>INDICATIVE MARGIN</th><th>QUALITY</th></tr></thead><tbody>{orderProfitRows.filter(r=>profitFilter==='all'||(profitFilter==='paid'&&r.paid)||(profitFilter==='review'&&r.requiresReview)).map(r=><tr key={r.id}><td>#{r.no}<small>{r.date}</small></td><td>{r.status}</td><td>{tr(r.total)}</td><td>{r.netSales===null?'—':tr(r.netSales)}</td><td>{tr(r.cogs)}</td><td>{tr(r.fee)}</td><td>{tr(r.refund)}</td><td>{r.estimated===null?'—':tr(r.estimated)}</td><td>{r.unmapped?'COST MISSING':r.refund?'REFUND REVIEW':!r.paid?'UNPAID':Number(settings.sales_vat_rate)===0?'VAT NOT SET':'ESTIMATE'}</td></tr>)}</tbody></table></div><p className="financeWarning">Indicative margin excludes overhead, royalty accrual, inventory valuation and refund allocation; it is not final profit. Unmapped costs and current rather than sale-time costs can materially overstate results.</p></section>}
  {financeTab==='artists'&&<section className="adminPanel financeBox"><div className="financeHeading"><h3>ARTIST BALANCE RECONCILIATION</h3><button type="button" onClick={exportArtistBalance} disabled={!artistBalance.length}>EXPORT CSV ↓</button></div><p>Approved accruals minus recorded artist payments, grouped by agreement. Payments are not allocated to particular months; review the supporting bank and contract records before treating any amount as a finalized payable.</p><div className="financeLedger">{artistBalance.length?artistBalance.map(r=><div key={r.id}><span>{r.name}<small>{r.months} approved periods · accrued {tr(r.accrued)} · paid {tr(r.paid)}</small></span><strong>{tr(r.balance)}<small>{r.balance<0?'PAYMENTS EXCEED ACCRUALS':'UNSETTLED BALANCE'}</small></strong></div>):<p>No accrual or payment entries yet.</p>}</div></section>}
  {financeTab==='artists'&&<section className="adminPanel financeBox"><h3>REVIEWED ARTIST ACCRUALS</h3><p>Record a verified period and agreed revenue/profit base, with a supporting reference. The active rule percentage is copied into an immutable accrual. One entry per artist rule and month. This form never issues a payout.</p><form onSubmit={recordAccrual} className="financeFields">{control('ARTIST RULE',<select required style={inputStyle} value={accrualDraft.rule_id} onChange={e=>setAccrualDraft(v=>({...v,rule_id:e.target.value}))}><option value="">SELECT ACTIVE AGREEMENT</option>{rules.filter(r=>r.active).map(r=><option value={r.id} key={r.id}>{r.payee_name} · {r.share_percent}% · {products.find(p=>p.id===r.product_id)?.title||'Product'}</option>)}</select>)}{control('COMPLETED MONTH',<input required type="month" style={inputStyle} value={accrualDraft.month} onChange={e=>setAccrualDraft(v=>({...v,month:e.target.value}))}/>)}{control('VERIFIED BASE TRY',field(accrualDraft.base,v=>setAccrualDraft(d=>({...d,base:v})),'number',{min:0,step:'.01',required:true}))}{control('SOURCE REFERENCE',field(accrualDraft.reference,v=>setAccrualDraft(d=>({...d,reference:v})),'text',{required:true,minLength:3,maxLength:250}))}<button className="saveButton" disabled={busy||loading||!accrualDraft.rule_id}>RECORD REVIEWED ACCRUAL</button></form><div className="financeLedger">{artistAccruals.length?artistAccruals.map(a=><div key={a.id}><span>{a.period_month.slice(0,7)} · {a.payee_name}<small>{a.share_percent}% of {tr(a.agreed_base)} · {a.source_reference}</small></span><strong>{tr(a.accrued_amount)}</strong></div>):<p>No reviewed artist accruals recorded.</p>}</div><p className="financeWarning">Reviewed accruals are independent of the live rolling estimates above. Confirm VAT treatment, refunds, contract terms and the evidence before recording. Payments remain tracked separately.</p></section>}
  {financeTab==='integrity'&&<section className="adminPanel financeBox financeAudit"><div className="financeHeading"><h3>ORDER DATA INTEGRITY</h3><select style={inputStyle} value={integrityFilter} onChange={e=>setIntegrityFilter(e.target.value)}><option value="issues">REVIEW REQUIRED</option><option value="all">ALL ORDERS</option></select></div><p>Cross-checks historical snapshot coverage, missing product costs and VAT settings, manual refunds and recorded settlements. This is a read-only exception queue, not an approval of financial statements.</p><div className="financeAuditScroll"><table><thead><tr><th>ORDER</th><th>STATUS</th><th>SNAPSHOTS</th><th>COST GAPS</th><th>VAT GAPS</th><th>REFUNDS</th><th>SETTLEMENT GROSS</th><th>FEES</th><th>REVIEW STATUS</th></tr></thead><tbody>{integrityRows.filter(r=>integrityFilter==='all'||r.review_code!=='REVIEW_COMPLETE_NOT_CERTIFIED').map(r=><tr key={r.order_id}><td>#{r.order_no}<small>{String(r.order_created_at).slice(0,10)}</small></td><td>{r.payment_status}<small>{r.order_status}</small></td><td>{r.snapshot_count}/{r.item_count}</td><td>{r.cost_missing}</td><td>{r.vat_unverified}</td><td>{tr(r.refund_recorded)}</td><td>{tr(r.settlement_gross)}</td><td>{tr(r.settlement_fees)}</td><td>{String(r.review_code).replaceAll('_',' ')}</td></tr>)}</tbody></table></div><p className="financeWarning">No automatic VAT corrections, royalty adjustments or double-entry postings are made. Existing manual refund and settlement journals are cross-checked but not bank-verified. The report contains up to 200 recent orders.</p></section>}
 </section>;
}
