'use client';
import {getVinylPreset,vinylPresetStyle} from '../lib/vinylPresets';

const bars=[22,38,58,31,74,46,86,52,68,35,79,43,61,27,49,72,40,57,30,64,45,78,36,55];

function norm(v={}){
 return {
  ...v,
  media:String(v.media||v.format||'vinyl').toLowerCase(),
  vinylColor:v.vinylColor??v.vinyl_color??'BLACK',
  digitalFormats:v.digitalFormats??v.digital_formats??null,
  audioSpecs:v.audioSpecs??v.audio_specs??null,
 };
}

function VinylObject({variant,release}){
 const v=norm(variant);
 const preset=getVinylPreset(v.vinylColor);
 return <div className="productVinylObject" aria-hidden="true">
  <div style={vinylPresetStyle(v.vinylColor)} data-vinyl-preset={preset.slug} data-vinyl-family={preset.family} className={'productVinylDisc vinyl-'+preset.slug+' vinylFamily-'+preset.family}>
   <div className="vinylGrooves"/>
   <div className="vinylLabel">
    {release.cover&&<img src={release.cover} alt=""/>}
    <span className="vinylLabelShade"/>
    <i/>
   </div>
  </div>
 </div>;
}

function DigitalCard({variant}){
 const v=norm(variant);
 return <div className="digitalMaster" aria-hidden="true">
  <div className="digitalMasterTop"><span>DIGITAL MASTER</span><b>∞</b></div>
  <div className="digitalWave">{bars.map((h,i)=><i key={i} style={{'--wave':h+'%'}}/>)}</div>
  <div className="digitalMasterFoot"><span>{v.digitalFormats?.join(' · ')||'WAV · FLAC · MP3'}</span><small>{v.audioSpecs||'LOSSLESS / HIGH RES'}</small></div>
 </div>;
}

export function normalizeEditionVariant(variant={}){
 return norm(variant);
}

export default function EditionVisual({release,variant,forceHover=false,className='',renderId=null,backFace=false}){
 const v=norm(variant);
 const media=v.media||release?.media||'vinyl';
 const isCassette=media==='cassette',isDigital=media==='digital',isVinyl=media==='vinyl';
 return <div data-edition-render={renderId||undefined} className={'productVisual '+media+(forceHover?' forceHover':'')+(className?' '+className:'')}>
  {isDigital?<DigitalCard variant={v}/>:isCassette?
   <div className="productCassette" aria-hidden="true">
    <div className="productCassetteLabel"><span>{release.imprint==='lethargia'?'LETHARGIA':'SIDE:II'}</span><b>{release.number}</b></div>
    <div className="productCassetteWindow"><i/><i/></div>
    <div className="productCassetteBase"><i/><i/><i/></div>
   </div>
   :isVinyl?<VinylObject variant={v} release={release}/>
   :<div className="productCdObject" aria-hidden="true"><div className="productCdDisc"><i/><b>{release.imprint==='lethargia'?'LETH':'SIDE:II'}</b><span>{release.number}</span></div></div>}
  <div className={'productCover'+(backFace?' editionReverseCover':'')+(release.hasShrinkwrap&&!isDigital&&!backFace?' shrinkwrap':'')}>
   {backFace&&!isDigital?<div className="editionReversePrint">
     <div className="editionReverseBrand"><span>{release.imprint==='lethargia'?'LETHARGIA RECORDS':'SIDE:II'}</span><small>{release.catalogue||release.number}</small></div>
     <div className="editionReverseTitle"><b>{release.title||'Physical edition'}</b><span>{release.artist||''}</span></div>
     <span className="editionReverseTrackHead">TRACKLIST / {String(media).toUpperCase()}</span>
     <ol>{(Array.isArray(release.tracks)?release.tracks:[]).map((track,i)=><li key={i}><small>{String(i+1).padStart(2,'0')}</small><span>{typeof track==='string'?track:(track?.title||track?.name||track?.label||'Track '+(i+1))}</span></li>)}</ol>
     {(!Array.isArray(release.tracks)||!release.tracks.length)&&<p className="editionReverseEmpty">TRACKLIST TO BE ANNOUNCED</p>}
     <div className="editionReverseFoot"><span>PHYSICAL EDITION</span><span>{release.number||'SIDE:II'}</span></div>
    </div>:release.cover?<img className="productArtwork" src={release.cover} alt={(release.artist||'SIDE:II')+' — '+(release.title||'Edition')}/>:<><span>{release.catalogue}</span><b>{release.number}</b><em>{release.title}</em></>}
  </div>
 </div>;
}
