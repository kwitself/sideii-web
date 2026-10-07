'use client';

import {useEffect,useState} from 'react';

const ROUTES=[
 {id:'home',label:'HOME',path:'/'},
 {id:'store',label:'STORE',path:'/store'},
 {id:'archive',label:'ARCHIVE',path:'/archive'},
 {id:'collections',label:'COLLECTIONS',path:'/collections'},
 {id:'bundles',label:'BUNDLES',path:'/bundles'},
 {id:'impact',label:'IMPACT',path:'/impact'},
 {id:'lethargia',label:'LETHARGIA',path:'/lethargia'},
 {id:'wear',label:'WEAR',path:'/wear'},
 {id:'google-feed',label:'GOOGLE FEED',path:'/feeds/google.xml'}
];

const MANUAL=[
 ['store-views','STORE · CLASSIC + EDITORIAL','Switch both views and confirm cards, spacing, hover and actions.'],
 ['search','SEARCH / FILTERS / SORT','Search by title/SKU/format and verify URL-preserved filters + sorting.'],
 ['product-detail','PRODUCT DETAIL','Open release + merch detail, change variants, inspect gallery and Complete the Set.'],
 ['wishlist','WISHLIST','Add/remove a product and verify persistence.'],
 ['cart','BAG / CART','Quick-add and product-detail add; update quantity; remove item.'],
 ['checkout','CHECKOUT','Complete delivery/invoice/promo/store-credit validation without submitting a live payment.'],
 ['bundles','BUNDLES','Verify set contents, quantity rules and discount calculation.'],
 ['responsive','RESPONSIVE','Review key storefront surfaces at desktop, tablet and mobile widths.'],
 ['accessibility','KEYBOARD / ACCESSIBILITY','Tab through nav, store cards, bag and modal controls; verify visible focus and labels.'],
 ['seo','SEO / SOCIAL','Inspect product metadata, canonical/OG fallback and structured data on representative products.']
];

export default function FinalStoreQaPanel(){
 const [results,setResults]=useState({});
 const [running,setRunning]=useState(false);
 const [manual,setManual]=useState({});

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
  setResults(next);setRunning(false);
 }

 useEffect(()=>{run()},[]);
 const autoReady=ROUTES.filter(x=>results[x.id]?.ok).length;
 const manualReady=MANUAL.filter(([id])=>manual[id]).length;
 const total=ROUTES.length+MANUAL.length;
 const complete=autoReady+manualReady;
 const blockers=ROUTES.filter(x=>results[x.id]&&!results[x.id].ok);

 return <section className="adminSection finalQaSection">
  <div className="sectionLabel"><span>15B / FINAL STORE QA</span><p>Automated production-route health plus explicit interaction checks before launch.</p></div>
  <div className="adminPanel finalQaPanel">
   <header className="finalQaHeader"><div><span>STORE QA SCORE</span><strong>{complete}/{total}</strong><small>{blockers.length?blockers.length+' automatic blocker(s)':'No automatic route blockers'}</small></div><button className="ghostButton" type="button" onClick={run} disabled={running}>{running?'RUNNING…':'RUN AUTOMATIC QA'}</button></header>

   <div className="finalQaSummary">
    <article><span>AUTOMATIC</span><b>{autoReady}/{ROUTES.length}</b><small>routes + feed</small></article>
    <article><span>INTERACTION</span><b>{manualReady}/{MANUAL.length}</b><small>manual sign-off</small></article>
    <article className={blockers.length?'blocked':'ready'}><span>BLOCKERS</span><b>{blockers.length}</b><small>{blockers.length?'fix before launch':'automatic layer clear'}</small></article>
   </div>

   <div className="finalQaColumns">
    <div className="finalQaGroup"><h3>AUTOMATIC HEALTH</h3>{ROUTES.map(item=>{const r=results[item.id];return <article key={item.id} className={'finalQaCheck '+(!r?'pending':r.ok?'ready':'blocked')}><div><i>{!r?'…':r.ok?'✓':'!'}</i><span><b>{item.label}</b><small>{item.path}</small></span></div><span>{!r?'PENDING':r.ok?('HTTP '+r.status+' · '+r.ms+'ms'):('FAILED · '+r.status)}</span></article>})}</div>
    <div className="finalQaGroup"><h3>INTERACTION SIGN-OFF</h3>{MANUAL.map(([id,label,detail])=><label key={id} className={'finalQaManual '+(manual[id]?'ready':'')}><input type="checkbox" checked={!!manual[id]} onChange={e=>setManualCheck(id,e.target.checked)}/><span><b>{label}</b><small>{detail}</small></span><i>{manual[id]?'SIGNED OFF':'REVIEW'}</i></label>)}</div>
   </div>
   <p className="finalQaNote">Automatic checks confirm production responses, not visual correctness. Interaction checks stay manual by design and are stored only in this browser.</p>
  </div>
 </section>;
}
