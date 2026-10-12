'use client';
import {useEffect,useState} from 'react';

export default function ReleaseGalleryCarousel({images=[],title='Release'}){
 const [active,setActive]=useState(0);
 const [direction,setDirection]=useState(1);
 const gallery=images.filter(Boolean);
 const count=gallery.length;
 useEffect(()=>{if(active>=count)setActive(0)},[active,count]);
 useEffect(()=>{
  if(count<2)return;
  const onKey=e=>{
   if(!document.activeElement?.closest('.releaseGalleryCarousel'))return;
   if(e.key==='ArrowLeft'){e.preventDefault();setDirection(-1);setActive(i=>(i-1+count)%count)}
   if(e.key==='ArrowRight'){e.preventDefault();setDirection(1);setActive(i=>(i+1)%count)}
  };
  window.addEventListener('keydown',onKey);
  return()=>window.removeEventListener('keydown',onKey);
 },[count]);
 if(!count)return null;
 const go=(i,d)=>{setDirection(d);setActive((i+count)%count)};
 return <section className="releaseGalleryCarousel shell" aria-label="Release detail images">
  <div className="releaseGalleryCarouselHeading"><span>OBJECT / DETAILS</span><small>{String(active+1).padStart(2,'0')} / {String(count).padStart(2,'0')}</small></div>
  <div className="releaseGalleryCarouselStage" tabIndex={0} aria-label="Gallery: use left and right arrow keys">
   {count>1&&<button type="button" className="releaseGalleryCarouselArrow prev" aria-label="Previous image" onClick={()=>go(active-1,-1)}>‹</button>}
   <div className="releaseGalleryCarouselViewport" aria-live="polite">
    <img key={gallery[active]} className={direction<0?'fromLeft':'fromRight'} src={gallery[active]} alt={title+' detail '+(active+1)} />
   </div>
   {count>1&&<button type="button" className="releaseGalleryCarouselArrow next" aria-label="Next image" onClick={()=>go(active+1,1)}>›</button>}
  </div>
  {count>1&&<div className="releaseGalleryCarouselThumbs" aria-label="Choose image">{gallery.map((src,i)=><button type="button" key={src+'-'+i} className={i===active?'active':''} aria-label={'View image '+(i+1)} aria-current={i===active?'true':undefined} onClick={()=>go(i,i<active?-1:1)}><img src={src} alt="" /></button>)}</div>}
 </section>;
}
