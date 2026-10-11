'use client';
import {useMemo,useState} from 'react';

const short=(v,max)=>String(v||'').trim().slice(0,max);
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
 const items=useMemo(()=>products.map(inspect).sort((a,b)=>a.score-b.score),[products]);
 const shown=items.filter(p=>(!onlyIssues||p.issues.length>0)&&[p.title,p.slug,p.catalogue_no].join(' ').toLowerCase().includes(query.toLowerCase()));
 const average=items.length?Math.round(items.reduce((n,p)=>n+p.score,0)/items.length):0;
 const issues=items.reduce((n,p)=>n+p.issues.length,0);
 const url=typeof window!=='undefined'?window.location.origin:'';
 return <section className="seoCenter adminSection">
  <div className="sectionLabel"><span>SEO / CONTROL CENTER</span><p>Rule-based on-page checks · not Google ranking or live crawl data.</p></div>
  <div className="seoMetrics"><article><small>CATALOGUE SCORE</small><strong>{average}<em>/100</em></strong></article><article><small>PRODUCTS</small><strong>{items.length}</strong></article><article><small>ACTION ITEMS</small><strong>{issues}</strong></article></div>
  <div className="seoTools"><input aria-label="Search products for SEO audit" placeholder="SEARCH TITLE, SLUG OR CATALOGUE…" value={query} onChange={e=>setQuery(e.target.value)}/><label><input type="checkbox" checked={onlyIssues} onChange={e=>setOnlyIssues(e.target.checked)}/> ISSUES ONLY</label></div>
  <div className="seoTechnical"><h3>Technical SEO checklist</h3><p>Inspect your public origin, robots.txt and sitemap.xml. Live search-engine indexing and Core Web Vitals require a deployed domain and external tools.</p><div><a target="_blank" rel="noopener noreferrer" href={url+'/robots.txt'}>ROBOTS.TXT ↗</a><a target="_blank" rel="noopener noreferrer" href={url+'/sitemap.xml'}>SITEMAP.XML ↗</a></div></div>
  <div className="seoProductList">{shown.map(p=><article className="seoProductRow" key={p.id}><div className="seoProductHead"><div><small>{p.catalogue_no||'CATALOGUE'} · {p.slug}</small><h3>{p.title}</h3><p>{short(p.seo_config?.title||p.title,80)}</p></div><strong className={p.score>=80?'good':p.score>=55?'warn':'bad'}>{p.score}<small>/100</small></strong></div><div className="seoCheckGrid">{p.checks.map(c=><span key={c.label} className={c.ok?'pass':'fail'}>{c.ok?'✓':'!'} {c.label}</span>)}</div>{p.issues.length>0?<div className="seoIssueList">{p.issues.map(c=><p key={c.label}><b>{c.label}</b> — {c.fix}</p>)}</div>:<p className="seoAllClear">All local checks passed.</p>}<button type="button" onClick={()=>onEdit(p)}>EDIT SEO / FEEDS ↗</button></article>)}{shown.length===0&&<p className="seoAllClear">No matching products.</p>}</div>
 </section>;
}
