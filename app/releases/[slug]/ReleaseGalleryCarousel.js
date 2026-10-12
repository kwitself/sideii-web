'use client';
import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';

export default function ReleaseGalleryCarousel({images=[],title='Release'}){
 const gallery=images.filter(Boolean);
 const count=gallery.length;
 const [active,setActive]=useState(0);
 const [direction,setDirection]=useState(1);
 const [lightbox,setLightbox]=useState(false);
 const [mounted,setMounted]=useState(false);
 useEffect(()=>setMounted(true),[]);
 const touchStart=useRef(null);
 const closeButton=useRef(null);
 const opener=useRef(null);
 const current=Math.min(active,Math.max(0,count-1));
 const go=(index)=>{if(!count)return;setDirection(index<current?-1:1);setActive((index+count)%count)};
 useEffect(()=>{
  if(!lightbox)return;
  const previousOverflow=document.body.style.overflow;
  const previousHtmlOverflow=document.documentElement.style.overflow;
  document.body.style.overflow='hidden';
  document.documentElement.style.overflow='hidden';
  closeButton.current?.focus();
  const key=e=>{
   if(e.key==='Escape'){e.preventDefault();setLightbox(false)}
   if(e.key==='ArrowLeft'&&count>1){e.preventDefault();setDirection(-1);setActive(i=>(i-1+count)%count)}
   if(e.key==='ArrowRight'&&count>1){e.preventDefault();setDirection(1);setActive(i=>(i+1)%count)}
   if(e.key==='Tab'){
    const buttons=[...document.querySelectorAll('.releaseGalleryLightbox button:not(:disabled)')];
    if(!buttons.length)return;
    const idx=buttons.indexOf(document.activeElement);
    if(e.shiftKey&&idx<=0){e.preventDefault();buttons[buttons.length-1].focus()}
    else if(!e.shiftKey&&idx===buttons.length-1){e.preventDefault();buttons[0].focus()}
   }
  };
  window.addEventListener('keydown',key);
  return()=>{window.removeEventListener('keydown',key);document.body.style.overflow=previousOverflow;document.documentElement.style.overflow=previousHtmlOverflow;opener.current?.focus()};
 },[lightbox,count]);
 if(!count)return null;
 const prev=()=>{setDirection(-1);setActive(i=>(i-1+count)%count)};
 const next=()=>{setDirection(1);setActive(i=>(i+1)%count)};
 const open=e=>{opener.current=e.currentTarget;setLightbox(true)};
 const onTouchStart=e=>{touchStart.current={x:e.touches[0].clientX,y:e.touches[0].clientY}};
 const onTouchEnd=e=>{if(!touchStart.current||count<2)return;const dx=e.changedTouches[0].clientX-touchStart.current.x;const dy=e.changedTouches[0].clientY-touchStart.current.y;touchStart.current=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.3)(dx<0?next:prev)()};
 const galleryImage=<img key={gallery[current]} className={direction<0?'fromLeft':'fromRight'} src={gallery[current]} alt={title+' detail '+(current+1)} />;
 return <>
  <section className="releaseGalleryCarousel shell" aria-label="Release detail images">
   <div className="releaseGalleryCarouselHeading"><span>OBJECT / DETAILS</span><small>{String(current+1).padStart(2,'0')} / {String(count).padStart(2,'0')}</small></div>
   <div className="releaseGalleryCarouselStage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
    {count>1&&<button type="button" className="releaseGalleryCarouselArrow prev" aria-label="Previous image" onClick={prev}>‹</button>}
    <button type="button" className="releaseGalleryCarouselViewport" aria-label={'Enlarge image '+(current+1)} onClick={open}>{galleryImage}<span className="releaseGalleryZoomHint">EXPAND ↗</span></button>
    {count>1&&<button type="button" className="releaseGalleryCarouselArrow next" aria-label="Next image" onClick={next}>›</button>}
   </div>
   {count>1&&<div className="releaseGalleryCarouselThumbs" aria-label="Choose image">{gallery.map((src,i)=><button type="button" key={src+'-'+i} className={i===current?'active':''} aria-label={'View image '+(i+1)} aria-current={i===current?'true':undefined} onClick={()=>go(i)}><img src={src} alt="" loading="lazy"/></button>)}</div>}
  </section>
  {mounted&&lightbox&&createPortal(<div className="releaseGalleryLightbox" role="dialog" aria-modal="true" aria-label={title+' image viewer'} onMouseDown={e=>{if(e.target===e.currentTarget)setLightbox(false)}} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
   <div className="releaseGalleryLightboxBar"><span>{title} <small>{current+1} / {count}</small></span><button ref={closeButton} type="button" onClick={()=>setLightbox(false)} aria-label="Close full-screen gallery">CLOSE ×</button></div>
   <div className="releaseGalleryLightboxBody">
    {count>1&&<button type="button" className="releaseGalleryLightboxArrow" onClick={prev} aria-label="Previous image">‹</button>}
    <img key={gallery[current]} className={direction<0?'fromLeft':'fromRight'} src={gallery[current]} alt={title+' enlarged detail '+(current+1)} />
    {count>1&&<button type="button" className="releaseGalleryLightboxArrow" onClick={next} aria-label="Next image">›</button>}
   </div>
  </div>,document.body)}
 </>;
}
