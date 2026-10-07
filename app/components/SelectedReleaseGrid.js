'use client';
import Link from 'next/link';
import {useMemo,useState} from 'react';

function HoverMedia({format,release}){
 if(format==='none'||format==='digital')return null;
 if(format==='vinyl'){
  const v=release.variants?.find(x=>x.format==='vinyl')||{};
  const color=String(v.vinylColor||'BLACK').toLowerCase().replace(/[^a-z0-9]+/g,'-');
  return <div className="catalogueHoverVinyl" aria-hidden="true"><div className={'catalogueHoverVinylDisc vinyl-'+color}><div className="catalogueHoverGrooves"/><div className="catalogueHoverLabel">{release.cover&&<img src={release.cover} alt=""/>}<span/><i/></div></div></div>
 }
 if(format==='cassette')return <div className="catalogueCassette catalogueHoverCassette" aria-hidden="true"><div className="catalogueCassetteLabel"><span>{release.imprint==='lethargia'?'LETHARGIA':'SIDE:II'}</span><b>{release.number}</b></div><div className="catalogueCassetteWindow"><i/><i/></div><div className="catalogueCassetteBase"><i/><i/><i/></div></div>;
 return <div className="catalogueHoverCd" aria-hidden="true"><div className="catalogueHoverCdDisc"/></div>
}

export default function SelectedReleaseGrid({releases=[]}){
 const [format,setFormat]=useState('all');
 const visible=useMemo(()=>releases.filter(r=>format==='all'||r.variants?.some(v=>v.format===format)),[releases,format]);
 return <><div className="homeFormatFilters">{[['all','ALL'],['vinyl','VINYL'],['cd','CD'],['cassette','CASSETTE'],['digital','DIGITAL']].map(([v,l])=><button key={v} className={format===v?'active':''} onClick={()=>setFormat(v)}>{l}</button>)}</div><div className="releaseGrid">{visible.map(r=>{const shownFormat=format==='all'?r.media:format;const configured=r.hoverMediaFormat||'auto';const hoverFormat=configured==='auto'?shownFormat:configured;return <Link className={'release '+shownFormat+' hover-'+hoverFormat} href={'/releases/'+r.slug} key={r.catalogue+'-'+shownFormat}><div className="mediaStage"><HoverMedia format={hoverFormat} release={r}/><div className={'cover'+(r.hasShrinkwrap?' shrinkwrap':'')}>{r.cover?<img className="releaseArtwork" src={r.cover} alt={r.artist+' — '+r.title}/>:<><span>{r.catalogue}</span><b>{r.number}</b><img className="coverLogo" src="/brand/sideii-logo-flat.png" alt=""/><em>VIEW EDITION</em></>}</div></div><div className="releaseMeta"><span>{r.catalogue} · {shownFormat.toUpperCase()}</span><h3>{r.title}</h3><p>{r.artist} · {r.variants?.find(v=>v.format===shownFormat)?.formatDetail||r.formatDetail}</p></div></Link>})}</div>{!visible.length&&<p className="homeEmptySelection">NO SELECTED RELEASES IN THIS FORMAT.</p>}</>;
}
