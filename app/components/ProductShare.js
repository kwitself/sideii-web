'use client';

import {useEffect,useMemo,useState} from 'react';

function money(value){
 const n=Number(value);
 if(!Number.isFinite(n))return '';
 return 'TRY '+new Intl.NumberFormat('tr-TR',{maximumFractionDigits:2}).format(n);
}

export default function ProductShare({product,kind='release'}){
 const [open,setOpen]=useState(false);
 const [status,setStatus]=useState('');
 useEffect(()=>{
  if(!open)return;
  const prev=document.body.style.overflow;
  const onKey=e=>{if(e.key==='Escape')setOpen(false)};
  document.body.style.overflow='hidden';
  window.addEventListener('keydown',onKey);
  return()=>{document.body.style.overflow=prev;window.removeEventListener('keydown',onKey)};
 },[open]);
 const slug=product?.slug||'';
 const title=product?.rawTitle||product?.title||'SIDE:II';
 const artist=product?.artist||'SIDE:II';
 const pagePath=kind==='store'?'/store/'+slug:'/releases/'+slug;
 const text=useMemo(()=>{
  const parts=[artist&&artist!=='SIDE:II MERCH'?artist:null,title,product?.format||product?.merchCategory,product?.price!=null?money(product.price):null].filter(Boolean);
  return parts.join(' · ');
 },[artist,title,product?.format,product?.merchCategory,product?.price]);

 const cardUrl=preset=>'/api/share-card/'+encodeURIComponent(kind)+'/'+encodeURIComponent(slug)+'?preset='+encodeURIComponent(preset);
 const absolutePage=()=>new URL(pagePath,window.location.origin).toString();

 async function copyLink(){
  try{await navigator.clipboard.writeText(absolutePage());setStatus('LINK COPIED ✓')}catch{setStatus('COPY FAILED')}
  setTimeout(()=>setStatus(''),1500);
 }

 async function shareCard(preset='square'){
  const url=absolutePage();
  try{
   const res=await fetch(cardUrl(preset));
   if(!res.ok)throw new Error('card');
   const blob=await res.blob();
   const file=new File([blob],`sideii-${slug}-${preset}.png`,{type:'image/png'});
   if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){
    await navigator.share({title,text,url,files:[file]});
    return;
   }
   if(navigator.share){
    await navigator.share({title,text,url});
    return;
   }
   const a=document.createElement('a');
   a.href=URL.createObjectURL(blob);
   a.download=file.name;
   document.body.appendChild(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(a.href),1000);
   setStatus('CARD SAVED');
  }catch(err){
   if(err?.name==='AbortError')return;
   try{await navigator.clipboard.writeText(url);setStatus('LINK COPIED ✓')}catch{setStatus('SHARE UNAVAILABLE')}
  }
  setTimeout(()=>setStatus(''),1600);
 }

 function openNetwork(network){
  const url=encodeURIComponent(absolutePage());
  const copy=encodeURIComponent(text);
  const targets={
   whatsapp:`https://wa.me/?text=${copy}%20${url}`,
   facebook:`https://www.facebook.com/sharer/sharer.php?u=${url}`,
   x:`https://twitter.com/intent/tweet?text=${copy}&url=${url}`,
   telegram:`https://t.me/share/url?url=${url}&text=${copy}`,
  };
  window.open(targets[network], '_blank', 'noopener,noreferrer,width=760,height=720');
 }

 return <div className="productShare">
  <button type="button" className="productShareTrigger" onClick={()=>setOpen(true)}>SHARE ↗</button>
  {open&&<div className="productShareLayer" role="dialog" aria-modal="true" aria-label="Share product">
   <button type="button" className="productShareShade" aria-label="Close share menu" onClick={()=>setOpen(false)}/>
   <section className="productShareSheet">
    <header><div><span>SHARE THIS EDITION</span><b>{title}</b></div><button type="button" onClick={()=>setOpen(false)}>CLOSE ×</button></header>
    <div className="productSharePresets">
     <button type="button" onClick={()=>shareCard('story')}><span>STORY</span><small>1080 × 1920</small></button>
     <button type="button" onClick={()=>shareCard('square')}><span>SQUARE</span><small>1080 × 1080</small></button>
     <button type="button" onClick={()=>shareCard('link')}><span>LINK CARD</span><small>1200 × 630</small></button>
    </div>
    <div className="productShareNetworks">
     <button type="button" onClick={()=>shareCard('story')}>INSTAGRAM / STORY</button>
     <button type="button" onClick={()=>openNetwork('whatsapp')}>WHATSAPP</button>
     <button type="button" onClick={()=>openNetwork('facebook')}>FACEBOOK</button>
     <button type="button" onClick={()=>openNetwork('x')}>X</button>
     <button type="button" onClick={()=>openNetwork('telegram')}>TELEGRAM</button>
    </div>
    <button type="button" className="productShareCopy" onClick={copyLink}>{status||'COPY PRODUCT LINK'}</button>
    <p>On supported phones, Story and Square cards open the native share sheet so the image can be sent directly to installed apps including Instagram.</p>
   </section>
  </div>}
 </div>;
}
