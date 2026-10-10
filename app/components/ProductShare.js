'use client';

import {useEffect,useMemo,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {toBlob} from 'html-to-image';
import EditionVisual,{normalizeEditionVariant} from './EditionVisual';
import {trackCommerce} from './CommerceTelemetry';

function money(value){
 const n=Number(value);
 if(!Number.isFinite(n))return '';
 return 'TRY '+new Intl.NumberFormat('tr-TR',{maximumFractionDigits:2}).format(n);
}

export default function ProductShare({product,kind='release'}){
 const [open,setOpen]=useState(false);
 const [status,setStatus]=useState('');
 const [preset,setPreset]=useState('link');
 const [previewReady,setPreviewReady]=useState(false);
 const [mediaOpen,setMediaOpen]=useState(false);
 const mediaOptions=useMemo(()=>Array.from(new Set((product?.variants||[]).map(v=>String(v?.format||'').toLowerCase()).filter(v=>['vinyl','cd','cassette','digital'].includes(v)))),[product?.variants]);
 const initialMedia=mediaOptions.includes(String(product?.media||'').toLowerCase())?String(product.media).toLowerCase():(mediaOptions[0]||'');
 const [media,setMedia]=useState(initialMedia);
 const [mounted,setMounted]=useState(false);
 const captureRef=useRef(null);
 const sheetRef=useRef(null),triggerRef=useRef(null);
 const [actionBusy,setActionBusy]=useState(false);
 useEffect(()=>setMounted(true),[]);
 useEffect(()=>{if(product?.id)trackCommerce('product_view',{product_id:product.id,properties:{kind,slug:product.slug||null}})},[product?.id]);
 useEffect(()=>{
  if(!open)return;
  const prev=document.body.style.overflow;
  const previousFocus=document.activeElement;
  requestAnimationFrame(()=>sheetRef.current?.querySelector('.productShareClose')?.focus());
  const onKey=e=>{if(e.key==='Escape'){e.preventDefault();setOpen(false);return}if(e.key!=='Tab')return;const nodes=[...(sheetRef.current?.querySelectorAll('button:not([disabled]),a[href]')||[])];if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}};
  document.body.style.overflow='hidden';
  window.addEventListener('keydown',onKey);
  return()=>{document.body.style.overflow=prev;window.removeEventListener('keydown',onKey);requestAnimationFrame(()=>{if(previousFocus?.isConnected)previousFocus.focus()})};
 },[open]);
 const slug=product?.slug||'';
 const title=product?.rawTitle||product?.title||'SIDE:II';
 const artist=product?.artist||'SIDE:II';
 const pagePath=kind==='store'?'/store/'+slug:'/releases/'+slug;
 const isLethargia=String(product?.imprint||'').toLowerCase()==='lethargia';
 const presetMeta={story:{label:'STORY',size:'1080 × 1920',use:'INSTAGRAM STORY',w:1080,h:1920},square:{label:'SQUARE',size:'1080 × 1080',use:'POST / SHARE',w:1080,h:1080},link:{label:'LINK CARD',size:'1200 × 630',use:'SOCIAL PREVIEW',w:1200,h:630}};
 const text=useMemo(()=>{
  const parts=[artist&&artist!=='SIDE:II MERCH'?artist:null,title,product?.format||product?.merchCategory,product?.price!=null?money(product.price):null].filter(Boolean);
  return parts.join(' · ');
 },[artist,title,product?.format,product?.merchCategory,product?.price]);
 const selectedVariant=useMemo(()=>{
  const list=product?.variants||[];
  return normalizeEditionVariant(list.find(v=>String(v?.media||v?.format||'').toLowerCase()===media)||list[0]||{});
 },[product?.variants,media]);
 const visualRelease=useMemo(()=>({
  cover:product?.cover||null,
  catalogue:product?.catalogue||'SIDE:II',
  number:product?.number||product?.catalogue||'',
  title,
  artist,
  imprint:product?.imprint||'sideii',
  hasShrinkwrap:!!product?.hasShrinkwrap
 }),[product?.cover,product?.catalogue,product?.number,product?.imprint,product?.hasShrinkwrap,title,artist]);

 const cardUrl=(preset,mediaValue=media)=>'/api/share-card/'+encodeURIComponent(kind)+'/'+encodeURIComponent(slug)+'?preset='+encodeURIComponent(preset)+(mediaValue?'&media='+encodeURIComponent(mediaValue):'')+'&v=4';
 const absolutePage=()=>new URL(pagePath,window.location.origin).toString();

 async function copyLink(){
  trackCommerce('share',{product_id:product?.id||null,properties:{channel:'copy_link'}});
  try{await navigator.clipboard.writeText(absolutePage());setStatus('LINK COPIED ✓')}catch{setStatus('COPY FAILED')}
  setTimeout(()=>setStatus(''),1500);
 }

 async function waitForCardAssets(node){
  if(document.fonts?.ready)await document.fonts.ready;
  const images=[...node.querySelectorAll('img')];
  await Promise.all(images.map(img=>{
   if(img.complete)return Promise.resolve();
   return new Promise(resolve=>{
    const finish=()=>{img.removeEventListener('load',finish);img.removeEventListener('error',finish);resolve()};
    img.addEventListener('load',finish,{once:true});
    img.addEventListener('error',finish,{once:true});
    // Avoid an indefinite wait if a remote cover image fails to complete.
    setTimeout(finish,4000);
   });
  }));
 }
 async function getCardBlob(cardPreset){
  if(kind==='release'&&captureRef.current){
   const meta=presetMeta[cardPreset];
   const node=captureRef.current;
   await waitForCardAssets(node);
   // Use the same DOM node as the visible preview; scale it without
   // changing its layout, so exported PNG preserves the on-screen composition.
   const blob=await toBlob(node,{
    cacheBust:true,canvasWidth:meta.w,canvasHeight:meta.h,
    pixelRatio:1,backgroundColor:isLethargia?'#12090b':'#0b0b0d'
   });
   if(blob&&blob.type==='image/png')return blob;
   throw new Error('Preview could not be exported as PNG');
  }
  const res=await fetch(cardUrl(cardPreset));
  if(!res.ok)throw new Error('Card generation failed');
  const blob=await res.blob();
  if(blob.type!=='image/png')throw new Error('Share card response is not PNG');
  return blob;
 }
 async function downloadCard(){
  if(actionBusy)return;
  setActionBusy(true);setStatus('');
  try{
   const blob=await getCardBlob(preset);
   const href=URL.createObjectURL(blob);
   const a=document.createElement('a');a.href=href;a.download=`sideii-${slug}-${media||'edition'}-${preset}.png`;
   document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),1500);
   setStatus('CARD SAVED ✓');trackCommerce('share',{product_id:product?.id||null,properties:{channel:'download_card',preset,media}});
  }catch{setStatus('COULD NOT SAVE CARD')}finally{setActionBusy(false)}
 }
 async function shareCard(preset='square'){
  if(actionBusy)return;
  setActionBusy(true);
  trackCommerce('share',{product_id:product?.id||null,properties:{channel:'native',preset,media}});
  const url=absolutePage();
  try{
   const blob=await getCardBlob(preset);
   const file=new File([blob],`sideii-${slug}-${media||'edition'}-${preset}.png`,{type:'image/png'});
   if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){
    await navigator.share({title,text,url,files:[file]});
    return;
   }
   if(navigator.share){
    await navigator.share({title,text,url});
    return;
   }
   const href=URL.createObjectURL(blob);
   const a=document.createElement('a');
   a.href=href;
   a.download=file.name;
   document.body.appendChild(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(href),1000);
   setStatus('CARD SAVED');
  }catch(err){
   if(err?.name==='AbortError')return;
   try{await navigator.clipboard.writeText(url);setStatus('LINK COPIED ✓')}catch{setStatus('SHARE UNAVAILABLE')}
  }finally{setActionBusy(false);setTimeout(()=>setStatus(''),1600)}
 }

 function openNetwork(network){
  trackCommerce('share',{product_id:product?.id||null,properties:{channel:network}});
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

 const layer=open&&mounted?createPortal(<div className={'productShareLayer '+(isLethargia?'productShareLethargia':'productShareSideii')} role="dialog" aria-modal="true" aria-label="Share product">
   <button type="button" className="productShareShade" aria-label="Close share menu" onClick={()=>setOpen(false)}/>
   <section ref={sheetRef} className="productShareSheet" aria-labelledby="sideiiShareTitle">
    <header><div><span>SIDE:II / SHARE STUDIO</span><b id="sideiiShareTitle">{title}</b><small>{artist} · {kind==='store'?'MERCH':'RELEASE'}</small></div><button className="productShareClose" type="button" onClick={()=>setOpen(false)} aria-label="Close share studio">CLOSE ×</button></header>
    <div className="productShareStudio">
     <div className={'productSharePreview preset-'+preset}>
      <span>01 / LIVE PREVIEW · {presetMeta[preset].label}</span>
      <div className={'productSharePreviewStage '+(kind==='release'||previewReady?'ready':'loading')}>
       <div className="productSharePreviewFrame">
        {kind==='release'?<div ref={captureRef} className={'productShareExactCard exact-'+preset}>
         <div className="productShareExactBrand"><img src={isLethargia?'/brand/lethargia/lethargia-logo.png':'/brand/sideii-logo-flat.png'} alt=""/></div>
         <div className="productShareExactVisual"><EditionVisual release={visualRelease} variant={selectedVariant} forceHover/></div>
         <div className="productShareExactMeta"><small>{String(media||selectedVariant.media||'edition').toUpperCase()} EDITION</small><b>{title}</b><span>{artist}</span>{selectedVariant?.price!=null&&<em>{money(selectedVariant.price)}</em>}</div>
         <div className="productShareExactFoot"><span>{visualRelease.catalogue}</span><i>SIDE:II</i></div>
        </div>:<img key={preset} src={cardUrl(preset)} alt={title+' '+preset+' share preview'} onLoad={()=>setPreviewReady(true)} onError={()=>setPreviewReady(true)}/>}
       </div>
      </div>
      <small>{presetMeta[preset].size+' · '+presetMeta[preset].use}</small>
     </div>
     <div className="productShareControls">
      <div className="productShareControlHeading"><span>02 / CUSTOMIZE YOUR CARD</span><small>CHOOSE A FORMAT</small></div>
      <div className="productSharePresets">
       {['story','square','link'].map(p=><button key={p} type="button" className={preset===p?'active':''} aria-pressed={preset===p} onClick={()=>{setPreviewReady(false);setPreset(p)}}><span>{presetMeta[p].label}</span><small>{presetMeta[p].size}</small><i>{preset===p?'SELECTED':'PREVIEW'}</i></button>)}
      </div>
      {mediaOptions.length>1&&<div className="productShareMedia">
       <button type="button" className="productShareMediaToggle" aria-expanded={mediaOpen} onClick={()=>setMediaOpen(v=>!v)}>
        <span>FORMAT / VISUAL</span><b>{media?media.toUpperCase():'DEFAULT'}</b><i>{mediaOpen?'−':'+'}</i>
       </button>
       {mediaOpen&&<div className="productShareMediaPanel">
        {mediaOptions.map(m=><button key={m} type="button" className={media===m?'active':''} onClick={()=>{setPreviewReady(false);setMedia(m);setMediaOpen(false)}}><span>{m.toUpperCase()}</span><small>{m==='vinyl'?'RECORD + SLEEVE':m==='cd'?'DISC + CASE':m==='cassette'?'CASSETTE OBJECT':'DIGITAL MASTER'}</small></button>)}
       </div>}
      </div>}
      <div className="productShareActions"><button type="button" className="productSharePrimary" disabled={actionBusy} onClick={()=>shareCard(preset)}>{actionBusy?'PREPARING CARD…':'SHARE CARD ↗'}</button><button type="button" className="productShareDownload" disabled={actionBusy} onClick={downloadCard}>↓ DOWNLOAD PNG</button></div>
      <div className="productShareControlHeading"><span>03 / SHARE A LINK</span><small>SEND TO ANYONE</small></div>
      <div className="productShareNetworks">
       <button type="button" onClick={()=>shareCard(preset)}>INSTAGRAM / NATIVE SHARE</button>
       <button type="button" onClick={()=>openNetwork('whatsapp')}>WHATSAPP</button>
       <button type="button" onClick={()=>openNetwork('facebook')}>FACEBOOK</button>
       <button type="button" onClick={()=>openNetwork('x')}>X</button>
       <button type="button" onClick={()=>openNetwork('telegram')}>TELEGRAM</button>
      </div>
      <button type="button" className="productShareCopy" onClick={copyLink}>COPY PRODUCT LINK ↗</button>{status&&<p className="productShareStatus" role="status">{status}</p>}
      <p>Export a PNG for Story, Square or Link Card. On supported devices, Share Card opens the native share sheet.</p>
     </div>
    </div>
   </section>
  </div>,document.body):null;

 return <div className="productShare">
  <button ref={triggerRef} type="button" className="productShareTrigger" aria-haspopup="dialog" aria-expanded={open} onClick={()=>{setStatus('');setOpen(true)}}>SHARE ↗</button>
  {layer}
 </div>;
}
