'use client';
import {useState} from 'react';

function DigitalCard({variant}){
 const bars=[22,38,58,31,74,46,86,52,68,35,79,43,61,27,49,72,40,57,30,64,45,78,36,55];
 return <div className="digitalMaster" aria-hidden="true"><div className="digitalMasterTop"><span>DIGITAL MASTER</span><b>∞</b></div><div className="digitalWave">{bars.map((h,i)=><i key={i} style={{'--wave':h+'%'}}/>)}</div><div className="digitalMasterFoot"><span>{variant.digitalFormats?.join(' · ')||'WAV · FLAC · MP3'}</span><small>{variant.audioSpecs||'LOSSLESS / HIGH RES'}</small></div></div>
}
export default function EditionSelector({release}){
 const variants=release.variants||[]; const [index,setIndex]=useState(0); const v=variants[index]||{};
 const media=v.media||release.media; const isCassette=media==='cassette',isDigital=media==='digital';
 const label=isDigital?'Digital edition':isCassette?'Cassette edition':'CD edition';
 const imprintName=release.imprint==='lethargia'?'lethargiarecords':'SIDE:II';
 return <div className="editionExperience">
  <div className={'releaseCollab '+(release.imprint==='lethargia'?'lethargiaCollab':'sideiiCollab')}><span>{imprintName}</span><b>×</b><strong>{release.title}</strong></div>
  <p className="editionDynamicLead">{label}</p>
  <div className={`productVisual ${media}`}>
   {isDigital?<DigitalCard variant={v}/>:isCassette?<div className="productCassette" aria-hidden="true"><div className="productCassetteLabel"><span>{release.imprint==='lethargia'?'LETHARGIA':'SIDE:II'}</span><b>{release.number}</b></div><div className="productCassetteWindow"><i/><i/></div><div className="productCassetteBase"><i/><i/><i/></div></div>:<div className="productCdObject" aria-hidden="true"><div className="productCdDisc"><i/><b>{release.imprint==='lethargia'?'LETH':'SIDE:II'}</b><span>{release.number}</span></div></div>}
   <div className={'productCover'+(release.hasShrinkwrap&&!isDigital?' shrinkwrap':'')}>{release.cover?<img className="productArtwork" src={release.cover} alt={`${release.artist} — ${release.title}`}/>:<><span>{release.catalogue}</span><b>{release.number}</b><em>{release.title}</em></>}</div>
  </div>
  <div className="editionPanel">
   {variants.length>1&&<div className="editionChooser"><span>CHOOSE EDITION</span><div>{variants.map((x,i)=><button className={i===index?'active':''} onClick={()=>setIndex(i)} key={x.id||x.sku}>{x.formatLabel}</button>)}</div></div>}
   <dl className="editionFacts"><div><dt>FORMAT</dt><dd>{v.formatDetail||release.formatDetail}</dd></div><div><dt>EDITION</dt><dd>{v.edition||release.edition}</dd></div>{isDigital&&<><div><dt>FILES</dt><dd>{v.digitalFormats?.join(' · ')||'WAV · FLAC · MP3'}</dd></div><div><dt>MASTER</dt><dd>{v.audioSpecs||'DIGITAL MASTER'}</dd></div></>}<div><dt>AVAILABILITY</dt><dd>{isDigital?'UNLIMITED':`${v.stock??release.stock} IN STOCK`}</dd></div></dl>
   {release.status==='FORTHCOMING'?<button className="productButton" disabled>COMING SOON</button>:!isDigital&&(v.stock??0)<=0?<button className="productButton" disabled>SOLD OUT</button>:<button className="productButton" disabled>ADD TO CART · {v.price!=null?`${Number(v.price).toLocaleString('tr-TR')} ₺`:''}</button>}
  </div>
 </div>
}