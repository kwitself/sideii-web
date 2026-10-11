'use client';
import {useMemo,useState} from 'react';

const short=(v,max)=>String(v||'').trim().slice(0,max);
const pageAudits=[
 {name:'Home',path:'/',title:'Side:II — The Other Side of Sound',description:'Independent physical music label for physical editions, selected releases and artist-led objects.',notes:'Metadata values verified against app/layout.js; this does not test search rankings or crawlability.'},
 {name:'Store',path:'/store',title:'Store — Vinyl, CD, Cassette & Digital Editions',description:'Explore independent vinyl records, CDs, cassettes, digital releases and artist-led merch from SIDE:II and its associated imprints.',notes:'Metadata values verified against app/store/page.js; live indexing not tested.'},
 {name:'Archive',path:'/archive',title:'Archive — Side:II',description:'Sold out, past and archived SIDE:II catalogue editions.',notes:'Page defines its own title and description, but both are shorter than the audit recommendations.'}
];
function pageChecks(p){return [
 {label:'Descriptive title',ok:p.title.length>=20&&p.title.length<=65,weight:35,fix:'Set a 20–65 character page title'},
 {label:'Meta description',ok:p.description.length>=70&&p.description.length<=160,weight:35,fix:'Add a unique 70–160 character description'},
 {label:'URL structure',ok:p.path==='/'||/^\/[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(p.path),weight:15,fix:'Use a clean public URL'},
 {label:'Metadata in code',ok:true,weight:15,fix:'Check server-rendered metadata again after deployment'}
];}

function inspect(p){
 const seo=p.seo_config||{},title=seo.title||p.title||'',desc=seo.description||p.description||'',variants=p.product_variants||[];
 const checks=[
  {label:'Page title',ok:title.length>=20&&title.length<=65,weight:20,fix:'Use a descriptive 20–65 character title'},
  {label:'Meta description',ok:desc.length>=70&&desc.length<=160,weight:20,fix:'Write a unique 70–160 character description'},
  {label:'Product artwork',ok:!!p.artwork_path,weight:15,fix:'Upload a clear product cover'},
  {label:'Canonical',ok:!seo.canonical||/^https:\/\/[^\s]+$/i.test(seo.canonical),weight:10,fix:'Fix malformed canonical URL'},
  {label:'Product structured data',ok:seo.structured_data!==false,weight:10,fix:'Enable Product schema'},
  {label:'Search-friendly slug',ok:/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug||''),weight:10,fix:'Use a short lowercase hyphenated slug'},
  {label:'Product offer',ok:variants.some(v=>v.active!==false&&Number(v.price)>0),weight:10,fix:'Add an active variant with a valid price'},
  {label:'Published product',ok:p.status==='active'&&p.is_public===true,weight:5,fix:'Publish when the product is ready'}
 ];
 return {...p,checks,score:checks.reduce((sum,c)=>sum+(c.ok?c.weight:0),0),issues:checks.filter(c=>!c.ok)};
}
export default function SeoControlCenter({products=[],onEdit}){
 const [query,setQuery]=useState(''),[onlyIssues,setOnlyIssues]=useState(false);
 const [sort,setSort]=useState('score'),[section,setSection]=useState('products');
 const pages=pageAudits.map(p=>{const checks=pageChecks(p);return {...p,checks,issues:checks.filter(c=>!c.ok),score:checks.reduce((sum,c)=>sum+(c.ok?c.weight:0),0)}});

 const items=useMemo(()=>products.map(inspect).sort((a,b)=>a.score-b.score),[products]);
 const shown=items.filter(p=>(!onlyIssues||p.issues.length>0)&&[p.title,p.slug,p.catalogue_no].join(' ').toLowerCase().includes(query.toLowerCase())).sort((a,b)=>sort==='title'?String(a.title).localeCompare(String(b.title)):sort==='issues'?b.issues.length-a.issues.length:sort==='published'?Number(b.is_public===true)-Number(a.is_public===true):a.score-b.score);
 const average=items.length?Math.round(items.reduce((n,p)=>n+p.score,0)/items.length):0;
 const issues=items.reduce((n,p)=>n+p.issues.length,0);
 const url=typeof window!=='undefined'?window.location.origin:'';
 return <section className="seoCenter adminSection">
  <div className="sectionLabel"><span>SEO / CONTROL CENTER</span><p>Rule-based on-page checks · not Google ranking or live crawl data.</p></div>
  <div className="seoMetrics"><article><small>CATALOGUE SCORE</small><strong>{average}<em>/100</em></strong></article><article><small>PRODUCTS</small><strong>{items.length}</strong></article><article><small>ACTION ITEMS</small><strong>{issues}</strong></article></div>
  <div className="seoV2Tabs"><button type="button" className={section==='products'?'active':''} onClick={()=>setSection('products')}>PRODUCT AUDIT · {items.length}</button><button type="button" className={section==='pages'?'active':''} onClick={()=>setSection('pages')}>PAGE AUDIT · {pages.length}</button><button type="button" className={section==='technical'?'active':''} onClick={()=>setSection('technical')}>TECHNICAL CHECKLIST</button></div>
  {section==='products'&&<div className="seoTools"><input aria-label="Search products for SEO audit" placeholder="SEARCH TITLE, SLUG OR CATALOGUE…" value={query} onChange={e=>setQuery(e.target.value)}/><label><input type="checkbox" checked={onlyIssues} onChange={e=>setOnlyIssues(e.target.checked)}/> ISSUES ONLY</label><select aria-label="Sort SEO products" value={sort} onChange={e=>setSort(e.target.value)}><option value="score">LOWEST SCORE</option><option value="issues">MOST ISSUES</option><option value="title">TITLE A–Z</option><option value="published">PUBLISHED FIRST</option></select></div>}
  {section==='technical'&&<div className="seoTechnical"><h3>Technical SEO checklist</h3><p>Inspect your public origin, robots.txt and sitemap.xml. Live search-engine indexing and Core Web Vitals require a deployed domain and external tools.</p><div><a target="_blank" rel="noopener noreferrer" href={url+'/robots.txt'}>ROBOTS.TXT ↗</a><a target="_blank" rel="noopener noreferrer" href={url+'/sitemap.xml'}>SITEMAP.XML ↗</a></div></div>}
  {section==='pages'&&<div className="seoProductList">{pages.map(p=><article className="seoProductRow" key={p.path}><div className="seoProductHead"><div><small>PUBLIC PAGE · {p.path}</small><h3>{p.name}</h3><p>{p.notes}</p></div><strong className={p.score>=80?'good':p.score>=55?'warn':'bad'}>{p.score}<small>/100</small></strong></div><div className="seoScoreTrack"><span style={{width:p.score+'%'}}/></div><div className="seoCheckGrid">{p.checks.map(c=><span key={c.label} className={c.ok?'pass':'fail'}>{c.ok?'✓':'!'} {c.label}</span>)}</div>{p.issues.map(c=><p className="seoAllClear" key={c.label}>{c.fix}</p>)}<a className="seoPageOpen" href={p.path} target="_blank" rel="noopener noreferrer">OPEN PAGE ↗</a></article>)}</div>}
  {section==='products'&&<div className="seoProductList">{shown.map(p=><article className="seoProductRow" key={p.id}><div className="seoProductHead"><div><small>{p.catalogue_no||'CATALOGUE'} · {p.slug}</small><h3>{p.title}</h3><p>{short(p.seo_config?.title||p.title,80)}</p></div><strong className={p.score>=80?'good':p.score>=55?'warn':'bad'}>{p.score}<small>/100</small></strong></div><div className="seoScoreTrack"><span style={{width:p.score+'%'}}/></div><div className="seoCheckGrid">{p.checks.map(c=><span key={c.label} className={c.ok?'pass':'fail'}>{c.ok?'✓':'!'} {c.label}</span>)}</div>{p.issues.length>0?<div className="seoIssueList">{p.issues.map(c=><p key={c.label}><b>{c.label}</b> — {c.fix}</p>)}</div>:<p className="seoAllClear">All local checks passed.</p>}<button type="button" onClick={()=>onEdit(p)}>EDIT SEO / FEEDS ↗</button></article>)}{shown.length===0&&<p className="seoAllClear">No matching products.</p>}</div>}
 </section>;
}
