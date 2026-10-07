import styles from './MerchMockupPreview.module.css';

export function normalizeMerchTemplate(value){
 const v=String(value||'apparel').toLowerCase();
 if(['apparel','mug','lighter','beanie','patch'].includes(v))return v;
 if(v==='accessory')return 'lighter';
 return 'apparel';
}

function resolveMockup(product,mockup,side){
 if(mockup)return mockup;
 if(!product)return null;
 return (side&&product.mockups?.[side])||product.mockups?.front||product.mockups?.back||null;
}

function isDarkHex(hex){
 const v=String(hex||'').replace('#','');
 if(!/^[0-9a-fA-F]{6}$/.test(v))return true;
 const r=parseInt(v.slice(0,2),16),g=parseInt(v.slice(2,4),16),b=parseInt(v.slice(4,6),16);
 return (r*299+g*587+b*114)/1000<92;
}

function Artwork({mockup,interactive,onPointerDown,darkSurface=false}){
 if(!mockup?.designUrl)return null;
 return <img
  className={styles.artwork+(darkSurface?' '+styles.darkSurfaceArtwork:'')+(interactive?' '+styles.draggable:'')}
  src={mockup.designUrl}
  alt=""
  draggable="false"
  onPointerDown={interactive?onPointerDown:undefined}
  style={{
   left:(mockup.x??50)+'%',
   top:(mockup.y??50)+'%',
   width:(mockup.scale??36)+'%',
   transform:`translate(-50%,-50%) rotate(${mockup.rotation??0}deg)`
  }}
 />;
}

export default function MerchMockupPreview({
 product=null,
 mockup=null,
 side=null,
 className='',
 interactive=false,
 printClipRef=null,
 onArtworkPointerDown=null,
 onArtworkWheel=null,
 snapGuides={x:false,y:false},
 showGuides=false,
 displayMode='default',
 raster=false
}){
 const m=resolveMockup(product,mockup,side);
 if(!m)return null;
 const type=normalizeMerchTemplate(m.template||product?.merchCategory);
 const fill=m.garmentColor||'#171719';
 const front=(m.side||side||'front')!=='back';
 const gradientId=('merch-'+type+'-'+String(product?.slug||product?.id||side||'preview')).replace(/[^a-zA-Z0-9_-]/g,'-');
 const guideClass=showGuides?styles.guidesOn:styles.guidesOff;
 const modeClass=displayMode==='hero'?styles.hero:displayMode==='gallery'?styles.gallery:displayMode==='thumb'?styles.thumb:'';
 const clipProps={ref:printClipRef,onWheel:interactive?onArtworkWheel:undefined};
 if(raster&&m.previewCleanUrl)return <div className={styles.frame+' '+modeClass+' '+className}><img className={styles.rasterPreview} src={m.previewCleanUrl} alt=""/></div>;

 if(type==='apparel')return <div className={styles.frame+' '+guideClass+' '+modeClass+' '+className}>
  <div className={styles.tee+' '+styles[m.garment==='regular'?'regular':'oversized']}>
   <svg viewBox="0 0 420 500" role="img" aria-label={front?'T-shirt front':'T-shirt back'}>
    <path fill={fill} d="M82 82 L158 48 Q210 68 262 48 L338 82 L392 151 L350 194 L316 171 L316 438 Q210 447 104 438 L104 171 L70 194 L28 151 Z"/>
    <path className={styles.line} d="M82 82 L158 48 Q210 68 262 48 L338 82 L392 151 L350 194 L316 171 L316 438 Q210 447 104 438 L104 171 L70 194 L28 151 Z"/>
    <path className={styles.seam} d="M104 171 L82 82 M316 171 L338 82 M104 426 Q210 436 316 426 M31 154 L72 190 M389 154 L348 190"/>
    {front?<><path className={styles.neck} d="M167 48 Q172 98 210 100 Q248 98 253 48"/><path className={styles.seam} d="M174 55 Q179 88 210 89 Q241 88 246 55"/></>:<><path className={styles.neck} d="M167 48 Q185 70 210 71 Q235 70 253 48"/><path className={styles.seam} d="M174 53 Q190 64 210 65 Q230 64 246 53"/></>}
   </svg>
   <div {...clipProps} className={styles.printClip+' '+styles.teePrint+(interactive?' '+styles.interactive:'')}>
    {showGuides&&<><i className={styles.guideX}/><i className={styles.guideY}/>{snapGuides.x&&<i className={styles.guideX+' '+styles.snap}/>} {snapGuides.y&&<i className={styles.guideY+' '+styles.snap}/>}</>}
    <Artwork mockup={m} interactive={interactive} onPointerDown={onArtworkPointerDown} darkSurface={isDarkHex(fill)}/>
   </div>
  </div>
 </div>;

 return <div className={styles.frame+' '+guideClass+' '+modeClass+' '+className}>
  <div className={styles.object+' '+styles[type]}>
   <svg className={styles.objectSvg} viewBox="0 0 420 420" role="img" aria-label={type+' mockup'}>
    <defs><linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fff" stopOpacity=".10"/><stop offset="38%" stopColor={fill}/><stop offset="100%" stopColor="#000" stopOpacity=".35"/></linearGradient></defs>
    {type==='mug'&&<>
     <path fill={'url(#'+gradientId+')'} d="M92 105 Q92 88 111 88 H292 Q311 88 311 105 V306 Q311 330 286 336 H117 Q92 330 92 306 Z"/>
     <path className={styles.line} d="M111 88 H292 Q311 88 311 105 V306 Q311 330 286 336 H117 Q92 330 92 306 V105 Q92 88 111 88 Z"/>
     <path className={styles.soft} d="M111 88 Q201 75 292 88 M105 101 Q201 112 299 101"/>
     <path className={styles.line} d="M311 143 C371 138 377 289 313 287"/>
     <path className={styles.soft} d="M316 166 C349 163 352 262 317 261"/>
    </>}
    {type==='lighter'&&<>
     <rect fill={'url(#'+gradientId+')'} x="126" y="52" width="168" height="314" rx="18"/>
     <rect className={styles.line} x="126" y="52" width="168" height="314" rx="18"/>
     <path className={styles.line} d="M126 157 H294"/>
     <path className={styles.soft} d="M117 145 h9 M117 154 h9 M117 163 h9 M117 172 h9"/>
     <path className={styles.soft} d="M145 70 H276"/>
    </>}
    {type==='beanie'&&<>
     <path fill={'url(#'+gradientId+')'} d="M87 277 C82 195 100 105 210 77 C320 105 338 195 333 277 Z"/>
     <path className={styles.line} d="M87 277 C82 195 100 105 210 77 C320 105 338 195 333 277 Z"/>
     <path fill={'url(#'+gradientId+')'} d="M77 269 H343 V343 Q343 356 330 356 H90 Q77 356 77 343 Z"/>
     <path className={styles.line} d="M77 269 H343 V343 Q343 356 330 356 H90 Q77 356 77 343 Z"/>
     <path className={styles.soft} d="M111 114 L111 268 M139 96 L139 268 M167 84 L167 268 M195 78 L195 268 M223 78 L223 268 M251 84 L251 268 M279 96 L279 268 M307 114 L307 268"/>
     <path className={styles.soft} d="M92 292 H328 M92 318 H328 M92 344 H328"/>
    </>}
    {type==='patch'&&<>
     <rect fill={'url(#'+gradientId+')'} x="56" y="117" width="308" height="186" rx="24"/>
     <rect className={styles.line} x="56" y="117" width="308" height="186" rx="24"/>
     <rect className={styles.stitch} x="69" y="130" width="282" height="160" rx="17"/>
     <path className={styles.soft} d="M82 143 H338 M82 277 H338"/>
    </>}
   </svg>
   <div {...clipProps} className={styles.printClip+' '+styles[type+'Print']+(interactive?' '+styles.interactive:'')}>
    {showGuides&&<><i className={styles.guideX}/><i className={styles.guideY}/>{snapGuides.x&&<i className={styles.guideX+' '+styles.snap}/>} {snapGuides.y&&<i className={styles.guideY+' '+styles.snap}/>}</>}
    <Artwork mockup={m} interactive={interactive} onPointerDown={onArtworkPointerDown} darkSurface={isDarkHex(fill)}/>
   </div>
  </div>
 </div>;
}
