import Link from 'next/link';
import T from '../components/T';
import {getArchiveReleases} from '../lib/catalogue';
import './archive.css';
import GlobalHeader from '../components/GlobalHeader';

export const revalidate=0;
export const metadata={title:'Archive',description:'Sold out, past and archived SIDE:II catalogue editions.'};

export default async function ArchivePage(){
 const releases=await getArchiveReleases();
 return <main className="archivePage">
  <GlobalHeader/>
  <section className="archiveHero shell"><span><T k="CATALOGUE / ARCHIVE"/></span><h1><T k="Past objects,"/><br/><i><T k="kept in view."/></i></h1><p>Sold out and retired editions remain part of the catalogue. Archive entries are not currently for sale.</p></section>
  <section className="archiveList shell">
   <div className="archiveHead"><span>ARCHIVED EDITIONS</span><p>{releases.length} record{releases.length===1?'':'s'}</p></div>
   {releases.length===0?<div className="archiveEmpty"><small>ARCHIVE / EMPTY</small><h2>No archived editions are public yet.</h2></div>:releases.map(r=><article key={r.slug}>
    <div className="archiveVisual">{r.cover?<img src={r.cover} alt={r.title}/>:<span>{r.catalogue}</span>}</div>
    <div className="archiveMeta"><small>{r.catalogue} · {r.pressingLabel}</small><h2>{r.title}</h2><p>{r.artist}</p><div><span>PRESSING {r.pressingGeneration}</span><span>{r.formatDetail}</span></div><Link href={'/releases/'+r.slug}>VIEW CATALOGUE RECORD →</Link></div>
   </article>)}
  </section>
 </main>
}
