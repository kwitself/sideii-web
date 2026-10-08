'use client';

import {useEffect,useState} from 'react';
import {supabase} from '../lib/supabase';

const ROUTES=[
 {id:'home',label:'HOME',path:'/'},
 {id:'store',label:'STORE',path:'/store'},
 {id:'archive',label:'ARCHIVE',path:'/archive'},
 {id:'collections',label:'COLLECTIONS',path:'/collections'},
 {id:'bundles',label:'BUNDLES',path:'/bundles'},
 {id:'impact',label:'IMPACT',path:'/impact'},
 {id:'lethargia',label:'LETHARGIA',path:'/lethargia'},
 {id:'wear',label:'WEAR',path:'/wear'},
 {id:'policies',label:'STORE POLICIES',path:'/policies'},
 {id:'guest-order-route',label:'GUEST ORDER PORTAL',path:'/order'},
 {id:'apply',label:'PRODUCTION APPLICATION',path:'/apply'},
 {id:'wholesale',label:'WHOLESALE',path:'/wholesale'},
 {id:'google-feed',label:'GOOGLE FEED',path:'/feeds/google.xml'}
];

const MANUAL=[
 ['store-views','STORE · CLASSIC + EDITORIAL','Switch both views and confirm cards, spacing, hover and actions.'],
 ['search','SEARCH / FILTERS / SORT','Search by title/SKU/format and verify URL-preserved filters + sorting.'],
 ['product-detail','PRODUCT DETAIL','Open release + merch detail, change variants, inspect gallery and Complete the Set.'],
 ['wishlist','WISHLIST','Add/remove a product and verify persistence.'],
 ['cart','BAG / CART','Quick-add and product-detail add; update quantity; remove item.'],
 ['checkout','CHECKOUT','Complete delivery/invoice/promo/store-credit validation without submitting a live payment.'],
 ['iyzilink','IYZICO LINK · EXACT AMOUNT','Verify a single-item order only shows the payment button when Link amount exactly matches external payment due.'],
 ['wwys-pause','WWYS EXTRA SUPPORT · LINK MODE','Verify extra support inputs are hidden/paused in iyzico Link mode and a forged support_amount is rejected by the backend.'],
 ['guest-order','GUEST ORDER PORTAL','Open a real guest-order email link; verify payment continuation, request history and private access.'],
 ['guest-digital','GUEST DIGITAL DOWNLOAD','Confirm a paid guest digital order generates a one-time download and the same token cannot be reused.'],
 ['reconcile','ADMIN PAYMENT RECONCILIATION','Match an iyzico transaction reference in Orders and verify PAID / REFUND passes through the payment ledger.'],
 ['bundles','BUNDLES','Verify set contents, quantity rules and discount calculation.'],
 ['responsive','RESPONSIVE','Review key storefront surfaces at desktop, tablet and mobile widths.'],
 ['accessibility','KEYBOARD / ACCESSIBILITY','Tab through nav, store cards, bag and modal controls; verify visible focus and labels.'],
 ['seo','SEO / SOCIAL','Inspect product metadata, canonical/OG fallback and structured data on representative products.']
];

export default function FinalStoreQaPanel(){
 const [results,setResults]=useState({});
 const [running,setRunning]=useState(false);
 const [manual,setManual]=useState({});
 const [dbHealth,setDbHealth]=useState({checks:[],ready:0,total:0,error:''});

 useEffect(()=>{
  try{setManual(JSON.parse(localStorage.getItem('sideii-final-qa')||'{}'))}catch{}
 },[]);

 function setManualCheck(id,value){
  setManual(prev=>{const next={...prev,[id]:value};try{localStorage.setItem('sideii-final-qa',JSON.stringify(next))}catch{}return next});
 }

 async function run(){
  setRunning(true);
  const next={};
  await Promise.all(ROUTES.map(async item=>{
   const started=performance.now();
   try{
    const res=await fetch(item.path,{method:'GET',cache:'no-store',credentials:'same-origin'});
    const text=await res.text();
    next[item.id]={ok:res.ok,status:res.status,ms:Math.round(performance.now()-started),detail:res.ok?(text.length?'RESPONDED':'EMPTY RESPONSE'):'HTTP '+res.status};
   }catch(err){
    next[item.id]={ok:false,status:0,ms:Math.round(performance.now()-started),detail:String(err?.message||err)};
   }
  }));
  try{
   const {data,error}=await supabase.rpc('admin_final_qa_health');
   if(error)throw error;
   setDbHealth({checks:Array.isArray(data?.checks)?data.checks:[],ready:Number(data?.ready||0),total:Number(data?.total||0),error:''});
  }catch(err){
   setDbHealth(prev=>({...prev,error:String(err?.message||err)}));
  }
  setResults(next);setRunning(false);
 }

 useEffect(()=>{run()},[]);
 const autoReady=ROUTES.filter(x=>results[x.id]?.ok).length;
 const manualReady=MANUAL.filter(([id])=>manual[id]).length;
 const dbReady=Number(dbHealth.ready||0);
 const dbTotal=Number(dbHealth.total||0);
 const total=ROUTES.length+MANUAL.length+dbTotal;
 const complete=autoReady+manualReady+dbReady;
 const routeBlockers=ROUTES.filter(x=>results[x.id]&&!results[x.id].ok);
 const dbBlockers=(dbHealth.checks||[]).filter(x=>!x.ok);
 const blockerCount=routeBlockers.length+dbBlockers.length+(dbHealth.error?1:0);

 return <section className="adminSection finalQaSection">
  <div className="sectionLabel"><span>15B / FINAL STORE QA</span><p>Automated production-route health plus explicit interaction checks before launch.</p></div>
  <div className="adminPanel finalQaPanel">
   <header className="finalQaHeader"><div><span>STORE QA SCORE</span><strong>{complete}/{total}</strong><small>{blockerCount?blockerCount+' automatic blocker(s)':'No automatic blockers'}</small></div><button className="ghostButton" type="button" onClick={run} disabled={running}>{running?'RUNNING…':'RUN AUTOMATIC QA'}</button></header>

   <div className="finalQaSummary">
    <article><span>ROUTES</span><b>{autoReady}/{ROUTES.length}</b><small>pages + feed</small></article>
    <article><span>DATABASE</span><b>{dbReady}/{dbTotal||'—'}</b><small>integrity gates</small></article>
    <article><span>INTERACTION</span><b>{manualReady}/{MANUAL.length}</b><small>manual sign-off</small></article>
    <article className={blockerCount?'blocked':'ready'}><span>BLOCKERS</span><b>{blockerCount}</b><small>{blockerCount?'fix before launch':'automatic layer clear'}</small></article>
   </div>

   <div className="finalQaColumns">
    <div className="finalQaGroup"><h3>ROUTE HEALTH</h3>{ROUTES.map(item=>{const r=results[item.id];return <article key={item.id} className={'finalQaCheck '+(!r?'pending':r.ok?'ready':'blocked')}><div><i>{!r?'…':r.ok?'✓':'!'}</i><span><b>{item.label}</b><small>{item.path}</small></span></div><span>{!r?'PENDING':r.ok?('HTTP '+r.status+' · '+r.ms+'ms'):('FAILED · '+r.status)}</span></article>})}</div>
    <div className="finalQaGroup"><h3>DATABASE HEALTH</h3>{dbHealth.error&&<p className="dbNotice">{dbHealth.error}</p>}{(dbHealth.checks||[]).map(item=><article key={item.id} className={'finalQaCheck '+(item.ok?'ready':'blocked')}><div><i>{item.ok?'✓':'!'}</i><span><b>{item.label}</b><small>{item.ok?'NO ISSUES':String(item.issues)+' ISSUE(S)'}</small></span></div><span>{item.ok?'CLEAR':'BLOCKED'}</span></article>)}</div>
    <div className="finalQaGroup"><h3>INTERACTION SIGN-OFF</h3>{MANUAL.map(([id,label,detail])=><label key={id} className={'finalQaManual '+(manual[id]?'ready':'')}><input type="checkbox" checked={!!manual[id]} onChange={e=>setManualCheck(id,e.target.checked)}/><span><b>{label}</b><small>{detail}</small></span><i>{manual[id]?'SIGNED OFF':'REVIEW'}</i></label>)}</div>
   </div>
   <p className="finalQaNote">Automatic checks confirm production responses, not visual correctness. Interaction checks stay manual by design and are stored only in this browser.</p>
  </div>
 </section>;
}
