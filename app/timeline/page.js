import Link from 'next/link';
import T from '../components/T';
import {getStoreReleases,getArchiveReleases} from '../lib/catalogue';
import './timeline.css';
import GlobalHeader from '../components/GlobalHeader';

export const revalidate=0;
export const metadata={title:'Catalogue Timeline',description:'The SIDE:II catalogue in sequence.'};

export default async function Timeline(){
 const current=await getStoreReleases(),archive=await getArchiveReleases();
 const map=new Map();[...current,...archive].forEach(x=>map.set(x.slug,x));
 const rows=[...map.values()].sort((a,b)=>String(a.catalogue).localeCompare(String(b.catalogue),undefined,{numeric:true}));
 return <main className="timelinePage">
  <GlobalHeader/>
  <section className="timelineHero shell"><span><T k="CATALOGUE / TIMELINE"/></span><h1><T k="In sequence,"/><br/><i><T k="not in silence."/></i></h1><p><T k="Every public SIDE:II catalogue object arranged by catalogue number."/></p></section>
  <section className="timelineList shell">{rows.length===0?<div className="timelineEmpty">NO PUBLIC CATALOGUE RECORDS YET.</div>:rows.map((r,i)=><article key={r.slug}>
    <div className="timelineLine"><span>{String(i+1).padStart(2,'0')}</span><i/></div>
    <div className="timelineRecord"><small>{r.catalogue} · {r.status}</small><h2>{r.title}</h2><p>{r.artist} · {r.formatDetail}</p><div><span>{r.pressingLabel}</span><span>PRESSING {r.pressingGeneration}</span></div><Link href={r.isMerch?'/store/'+r.slug:'/releases/'+r.slug}><T k="OPEN RECORD →"/></Link></div>
   </article>)}</section>
 </main>
}
