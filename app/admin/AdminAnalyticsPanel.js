'use client';
import {useEffect,useMemo,useState} from 'react';
import {supabase} from '../lib/supabase';

const money=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:0}).format(Number(n||0));
const WINDOWS=[['7','7D'],['30','30D'],['90','90D'],['365','YTD'],['all','ALL']];

function Sparkline({points=[]}){
 const vals=points.map(x=>Number(x.value||0)); const max=Math.max(1,...vals),min=Math.min(0,...vals);
 const xy=vals.map((v,i)=>{const x=vals.length<=1?50:(i/(vals.length-1))*100;const y=90-((v-min)/(max-min||1))*76;return x+','+y}).join(' ');
 return <svg className="analyticsSpark" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points={xy||'0,90 100,90'} fill="none" vectorEffect="non-scaling-stroke"/></svg>
}

function Bars({rows=[]}){
 const max=Math.max(1,...rows.map(x=>Number(x.value||0)));
 return <div className="analyticsBars">{rows.map(x=><div key={x.label}><span>{x.label}</span><i><b style={{width:Math.max(2,(Number(x.value||0)/max)*100)+'%'}}/></i><strong>{x.display??x.value}</strong></div>)}</div>
}

export default function AdminAnalyticsPanel({products=[]}){
 const [range,setRange]=useState('30'),[orders,setOrders]=useState([]),[costs,setCosts]=useState([]),[rules,setRules]=useState([]),[report,setReport]=useState([]),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const [ruleDraft,setRuleDraft]=useState({product_id:'',payee_name:'',share_percent:'50',active:true});

 async function load(){
  setBusy(true);setMessage('');
  const since=range==='all'?null:new Date(Date.now()-Number(range)*86400000).toISOString();
  let oq=supabase.from('orders').select('id,total,subtotal,discount_total,shipping_total,payment_status,status,created_at,order_items(id,variant_id,quantity,line_total,format)').order('created_at');
  if(since)oq=oq.gte('created_at',since);
  const [o,c,r,rr]=await Promise.all([oq,supabase.rpc('admin_list_product_costs'),supabase.rpc('admin_list_royalty_rules'),supabase.rpc('admin_royalty_report')]);
  if(o.error)setMessage(o.error.message);else setOrders(o.data||[]);
  if(!c.error)setCosts(c.data||[]); if(!r.error)setRules(r.data||[]); if(!rr.error)setReport(rr.data||[]);
  setBusy(false);
 }
 useEffect(()=>{load()},[range]);

 const variantMap=useMemo(()=>{const m={};products.forEach(p=>(p.product_variants||[]).forEach(v=>m[v.id]={...v,product:p}));return m},[products]);
 const costMap=useMemo(()=>Object.fromEntries(costs.map(x=>[x.product_id,Number(x.unit_cost||0)+Number(x.packaging_cost||0)+Number(x.handling_cost||0)])),[costs]);
 const paid=orders.filter(o=>o.payment_status==='paid');
 const revenue=paid.reduce((s,o)=>s+Number(o.total||0),0),units=paid.flatMap(o=>o.order_items||[]).reduce((s,i)=>s+Number(i.quantity||0),0);
 const aov=paid.length?revenue/paid.length:0;
 const cogs=paid.flatMap(o=>o.order_items||[]).reduce((s,i)=>{const p=variantMap[i.variant_id]?.product;return s+(p?Number(costMap[p.id]||0)*Number(i.quantity||0):0)},0);
 const grossProfit=Math.max(0,revenue-cogs);
 const productGross={}; const formatGross={};
 paid.flatMap(o=>o.order_items||[]).forEach(i=>{const p=variantMap[i.variant_id]?.product; if(p)productGross[p.id]=(productGross[p.id]||0)+Number(i.line_total||0); const f=String(i.format||variantMap[i.variant_id]?.format||'other').toUpperCase();formatGross[f]=(formatGross[f]||0)+Number(i.line_total||0)});
 const artistRows=rules.filter(r=>r.active).map(r=>{const gross=Number(productGross[r.product_id]||0),cost=Number(costMap[r.product_id]||0);const qty=paid.flatMap(o=>o.order_items||[]).filter(i=>variantMap[i.variant_id]?.product?.id===r.product_id).reduce((s,i)=>s+Number(i.quantity||0),0);const profit=Math.max(0,gross-cost*qty);return {...r,gross,profit,artistShare:profit*Number(r.share_percent||0)/100,label:products.find(p=>p.id===r.product_id)?.title||'PRODUCT'}}).sort((a,b)=>b.artistShare-a.artistShare);
 const artistTotal=artistRows.reduce((s,x)=>s+x.artistShare,0),labelProfit=Math.max(0,grossProfit-artistTotal);
 const days=range==='all'?30:Number(range); const buckets=Math.min(days,30); const trend=Array.from({length:buckets},(_,idx)=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-(buckets-1-idx));const next=new Date(d);next.setDate(d.getDate()+1);return {label:d.toLocaleDateString('tr-TR',{day:'2-digit',month:'2-digit'}),value:paid.filter(o=>{const t=new Date(o.created_at);return t>=d&&t<next}).reduce((s,o)=>s+Number(o.total||0),0)}});
 const topProducts=Object.entries(productGross).map(([id,value])=>({label:products.find(p=>p.id===id)?.title||'Product',value,display:money(value)})).sort((a,b)=>b.value-a.value).slice(0,6);
 const formats=Object.entries(formatGross).map(([label,value])=>({label,value,display:money(value)})).sort((a,b)=>b.value-a.value);

 async function saveRule(e){
  e.preventDefault();setBusy(true);setMessage('');
  const {error}=await supabase.rpc('admin_save_royalty_rule',{p_id:null,p_product_id:ruleDraft.product_id,p_payee_name:ruleDraft.payee_name,p_share_percent:Number(ruleDraft.share_percent)||0,p_active:true});
  if(error)setMessage(error.message);else{setRuleDraft({product_id:'',payee_name:'',share_percent:'50',active:true});setMessage('Artist profit-share rule saved.');await load()} setBusy(false);
 }

 return <section className="dashboardAnalytics">
  <div className="analyticsHead"><div><span>ANALYTICS / VALUE SPLIT</span><h2>What moves, <em>who it supports.</em></h2></div><div className="analyticsRange">{WINDOWS.map(([v,l])=><button key={v} className={range===v?'active':''} onClick={()=>setRange(v)}>{l}</button>)}</div></div>
  {message&&<p className="dbNotice">{message}</p>}

  <div className="analyticsShell">
   <div className="analyticsMain">
    <article className="adminPanel analyticsHero">
     <header><div><span>REVENUE TREND</span><small>{range==='all'?'LAST 30 DAYS VISUAL':range+' DAY WINDOW'}</small></div><strong>{money(revenue)}</strong></header>
     <div className="analyticsHeroKpis">
      <div><span>ORDERS</span><b>{paid.length}</b></div>
      <div><span>AOV</span><b>{money(aov)}</b></div>
      <div><span>GROSS PROFIT</span><b>{money(grossProfit)}</b></div>
      <div><span>ARTIST SHARE</span><b>{money(artistTotal)}</b></div>
     </div>
     <div className="analyticsChartWrap"><Sparkline points={trend}/>{!paid.length&&<div className="analyticsEmpty"><b>NO PAID SALES YET</b><span>Revenue activity will appear here when the first paid order lands.</span></div>}</div>
    </article>
   </div>

   <aside className="analyticsSide">
    <article className="adminPanel analyticsPanel compact"><header><span>TOP PRODUCTS</span><small>PAID REVENUE</small></header>{topProducts.length?<Bars rows={topProducts}/>:<div className="analyticsEmpty small"><b>NO SALES DATA</b><span>Top products will rank here.</span></div>}</article>
    <article className="adminPanel analyticsPanel compact"><header><span>FORMAT MIX</span><small>{units} UNITS</small></header>{formats.length?<Bars rows={formats}/>:<div className="analyticsEmpty small"><b>NO FORMAT DATA</b><span>Vinyl, CD, cassette, digital and merch mix will appear here.</span></div>}</article>
    <article className="adminPanel profitSplit compact"><header><span>PROFIT SPLIT</span><small>ESTIMATE</small></header><div className="profitSplitTotal"><div><span>ARTISTS</span><b>{money(artistTotal)}</b></div><div><span>LABEL / OPS</span><b>{money(labelProfit)}</b></div></div>{artistRows.slice(0,3).map(x=><div className="artistShareRow" key={x.id}><div><b>{x.payee_name}</b><small>{Number(x.share_percent)}% · {x.label}</small></div><strong>{money(x.artistShare)}</strong></div>)}{!artistRows.length&&<div className="analyticsEmpty small"><b>NO SHARE RULES</b><span>Add an artist rule below.</span></div>}</article>
   </aside>
  </div>

  <div className="analyticsRoyaltyGrid">
   <form className="adminPanel royaltyForm" onSubmit={saveRule}><header><div><span>ARTIST PROFIT SHARE</span><small>Profit-based allocation rule</small></div><b>NEW RULE</b></header><div className="royaltyFormGrid"><label><span>PRODUCT</span><select required value={ruleDraft.product_id} onChange={e=>{const p=products.find(x=>x.id===e.target.value);setRuleDraft({...ruleDraft,product_id:e.target.value,payee_name:ruleDraft.payee_name||p?.artist_project||''})}}><option value="">SELECT…</option>{products.filter(p=>p.product_type!=='merch').map(p=><option key={p.id} value={p.id}>{p.catalogue_no} · {p.title}</option>)}</select></label><label><span>ARTIST / PAYEE</span><input required value={ruleDraft.payee_name} onChange={e=>setRuleDraft({...ruleDraft,payee_name:e.target.value})}/></label><label><span>SHARE %</span><input type="number" min="0" max="100" step=".1" value={ruleDraft.share_percent} onChange={e=>setRuleDraft({...ruleDraft,share_percent:e.target.value})}/></label></div><p>Share is shown against estimated product profit after recorded unit, packaging and handling costs.</p><button className="saveButton" disabled={busy}>SAVE SHARE RULE</button></form>

   <article className="adminPanel royaltyReport"><header><div><span>ROYALTY LEDGER</span><small>Current active rules and gross-sales royalty view</small></div><b>{report.length} RULES</b></header><div className="royaltyTableHead"><span>ARTIST / PRODUCT</span><span>SHARE</span><span>EST. ROYALTY</span></div>{report.slice(0,8).map((x,i)=><div className="royaltyTableRow" key={(x.product_id||'x')+x.payee_name+i}><span><b>{x.payee_name}</b><small>{x.catalogue_no} · {x.product_title}</small></span><em>{Number(x.share_percent)}%</em><strong>{money(x.estimated_royalty)}</strong></div>)}{!report.length&&<div className="analyticsEmpty"><b>LEDGER READY</b><span>Paid sales will populate royalty values automatically.</span></div>}</article>
  </div>
 </section>;
}