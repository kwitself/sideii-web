'use client';
import Link from 'next/link';
import {useEffect,useMemo,useState} from 'react';
import {addCartItem,readCart} from '../../lib/cart';

const fmt=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:0}).format(Number(n||0));

function TeePreview({product,side}){
 const mockup=product.mockups?.[side]||product.mockups?.front||product.mockups?.back;
 const fill=mockup?.garmentColor||'#171719';
 const front=(mockup?.side||side)!=='back';
 return <div className="merchDetailPreview">
  <div className="merchDetailTee">
   <svg viewBox="0 0 420 500" aria-hidden="true">
    <path fill={fill} d="M82 82 L158 48 Q210 68 262 48 L338 82 L392 151 L350 194 L316 171 L316 438 Q210 447 104 438 L104 171 L70 194 L28 151 Z"/>
    <path className="storeMerchLine" d="M82 82 L158 48 Q210 68 262 48 L338 82 L392 151 L350 194 L316 171 L316 438 Q210 447 104 438 L104 171 L70 194 L28 151 Z"/>
    <path className="storeMerchLine storeMerchSeam" d="M104 171 L82 82 M316 171 L338 82 M104 426 Q210 436 316 426 M31 154 L72 190 M389 154 L348 190"/>{front?<><path className="storeMerchLine storeMerchNeck" d="M167 48 Q172 98 210 100 Q248 98 253 48"/><path className="storeMerchLine storeMerchSeam" d="M174 55 Q179 88 210 89 Q241 88 246 55"/></>:<><path className="storeMerchLine storeMerchNeck" d="M167 48 Q185 70 210 71 Q235 70 253 48"/><path className="storeMerchLine storeMerchSeam" d="M174 53 Q190 64 210 65 Q230 64 246 53"/></>}
   </svg>
   <div className="merchDetailPrint">{mockup?.designUrl&&<img src={mockup.designUrl} alt="" style={{left:(mockup.x??50)+'%',top:(mockup.y??50)+'%',width:(mockup.scale??36)+'%',transform:`translate(-50%,-50%) rotate(${mockup.rotation??0}deg)`}}/>}</div>
  </div>
 </div>
}

export default function MerchProductClient({product}){
 const variants=product.variants||[];
 const [index,setIndex]=useState(0);
 const [side,setSide]=useState(product.mockups?.front?'front':'back');
 const [added,setAdded]=useState(false);
 const [bagCount,setBagCount]=useState(0);
 useEffect(()=>{const sync=()=>setBagCount(readCart().reduce((s,x)=>s+x.qty,0));sync();window.addEventListener('sideii-cart',sync);return()=>window.removeEventListener('sideii-cart',sync)},[]);
 const v=variants[index]||{};
 const unavailable=product.status!=='AVAILABLE'||Number(v.stock||0)<=0;
 const hasFront=!!product.mockups?.front,hasBack=!!product.mockups?.back;
 const gallery=useMemo(()=>product.galleryImages?.filter(x=>x?.url&&!x?.mockup)||[],[product.galleryImages]);
 function add(){if(unavailable)return;const next=addCartItem(product,v);setBagCount(next.reduce((s,x)=>s+x.qty,0));setAdded(true);setTimeout(()=>setAdded(false),1300)}
 return <section className="merchDetail shell">
  <div className="merchDetailVisual">
   <div className="merchDetailSwitch">{hasFront&&<button className={side==='front'?'active':''} onClick={()=>setSide('front')}>FRONT</button>}{hasBack&&<button className={side==='back'?'active':''} onClick={()=>setSide('back')}>BACK</button>}</div>
   <TeePreview product={product} side={side}/><div className="merchViewMeta"><span>{side.toUpperCase()} VIEW</span><small>{String(product.merchCategory||'MERCH').toUpperCase()}</small></div>
   {gallery.length>0&&<div className="merchDetailGallery">{gallery.slice(0,4).map((g,i)=><img key={g.id||g.url||i} src={g.url} alt={product.title+' view '+(i+1)}/>)}</div>}
  </div>
  <div className="merchDetailInfo">
   <Link href="/store" className="merchBack">← STORE</Link>
   <span>SIDE:II / {String(product.merchCategory||'MERCH').toUpperCase()}</span>
   <h1>{product.title}</h1>
   <p>{product.lead}</p>
   <div className="merchDetailFacts"><div><span>PRODUCT</span><b>{product.catalogue}</b></div><div><span>AVAILABILITY</span><b>{product.status}</b></div></div>
   {variants.length>0&&<div className="merchVariantChooser"><span>CHOOSE SIZE / COLOUR</span><div>{variants.map((x,i)=><button key={x.id||x.sku} className={i===index?'active':''} onClick={()=>setIndex(i)} disabled={x.stock<=0}>{x.formatLabel}<small>{x.stock>0?x.stock+' LEFT':'SOLD OUT'}</small></button>)}</div></div>}
   <div className="merchBuyRow"><strong>{fmt(v.price)}</strong><button disabled={unavailable} onClick={add}>{product.status!=='AVAILABLE'?'COMING SOON':unavailable?'SOLD OUT':added?'ADDED ✓':'ADD TO BAG'}</button></div>
   <Link className="merchBagLink" href="/store?checkout=1">BAG · {bagCount}</Link>
  </div>
 </section>
}
