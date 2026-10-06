import styles from './MerchMockupPreview.module.css';

function typeOf(product,mockup){
 const v=String(mockup?.template||product?.merchCategory||'apparel').toLowerCase();
 return ['apparel','mug','lighter','beanie','patch'].includes(v)?v:(v==='accessory'?'lighter':'apparel');
}

function Artwork({mockup}){
 if(!mockup?.designUrl)return null;
 return <img className={styles.artwork} src={mockup.designUrl} alt="" draggable="false"
  style={{
   left:(mockup.x??50)+'%',
   top:(mockup.y??50)+'%',
   width:(mockup.scale??36)+'%',
   transform:`translate(-50%,-50%) rotate(${mockup.rotation??0}deg)`
  }}/>;
}

export default function MerchMockupPreview({product,className='',side=null}) {
 const mockup=(side&&product?.mockups?.[side])||product?.mockups?.front||product?.mockups?.back;
 if(!mockup)return null;
 const type=typeOf(product,mockup);
 const fill=mockup.garmentColor||'#171719';
 const front=(mockup.side||'front')!=='back';
 const gradId=('store-'+type+'-'+String(product?.slug||product?.id||'item')).replace(/[^a-zA-Z0-9_-]/g,'-');

 if(type==='apparel')return <div className={styles.frame+' '+className}>
  <div className={styles.tee}>
   <svg viewBox="0 0 420 500" aria-hidden="true">
    <path fill={fill} d="M82 82 L158 48 Q210 68 262 48 L338 82 L392 151 L350 194 L316 171 L316 438 Q210 447 104 438 L104 171 L70 194 L28 151 Z"/>
    <path className={styles.line} d="M82 82 L158 48 Q210 68 262 48 L338 82 L392 151 L350 194 L316 171 L316 438 Q210 447 104 438 L104 171 L70 194 L28 151 Z"/>
    <path className={styles.seam} d="M104 171 L82 82 M316 171 L338 82 M104 426 Q210 436 316 426 M31 154 L72 190 M389 154 L348 190"/>
    {front?<><path className={styles.line} d="M167 48 Q172 98 210 100 Q248 98 253 48"/><path className={styles.seam} d="M174 55 Q179 88 210 89 Q241 88 246 55"/></>:<><path className={styles.line} d="M167 48 Q185 70 210 71 Q235 70 253 48"/><path className={styles.seam} d="M174 53 Q190 64 210 65 Q230 64 246 53"/></>}
   </svg>
   <div className={styles.teePrint}><Artwork mockup={mockup}/></div>
  </div>
 </div>;

 return <div className={styles.frame+' '+className}>
  <div className={styles.object+' '+styles[type]} style={{'--object-color':fill}}>
   <svg className={styles.objectSvg} viewBox="0 0 420 420" aria-hidden="true">
    <defs><linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fff" stopOpacity=".10"/><stop offset="38%" stopColor={fill}/><stop offset="100%" stopColor="#000" stopOpacity=".35"/></linearGradient></defs>
    {type==='mug'&&<>
      <path fill={'url(#'+gradId+')'} d="M92 105 Q92 88 111 88 H292 Q311 88 311 105 V306 Q311 330 286 336 H117 Q92 330 92 306 Z"/>
      <path className={styles.line} d="M111 88 H292 Q311 88 311 105 V306 Q311 330 286 336 H117 Q92 330 92 306 V105 Q92 88 111 88 Z"/>
      <path className={styles.soft} d="M111 88 Q201 75 292 88 M105 101 Q201 112 299 101"/>
      <path className={styles.line} d="M311 143 C371 138 377 289 313 287"/>
      <path className={styles.soft} d="M316 166 C349 163 352 262 317 261"/>
    </>}
    {type==='lighter'&&<>
      <rect fill={'url(#'+gradId+')'} x="126" y="52" width="168" height="314" rx="18"/>
      <rect className={styles.line} x="126" y="52" width="168" height="314" rx="18"/>
      <path className={styles.line} d="M126 157 H294"/>
      <path className={styles.soft} d="M117 145 h9 M117 154 h9 M117 163 h9 M117 172 h9"/>
    </>}
    {type==='beanie'&&<>
      <path fill={'url(#'+gradId+')'} d="M87 277 C82 195 100 105 210 77 C320 105 338 195 333 277 Z"/>
      <path className={styles.line} d="M87 277 C82 195 100 105 210 77 C320 105 338 195 333 277 Z"/>
      <path fill={'url(#'+gradId+')'} d="M77 269 H343 V343 Q343 356 330 356 H90 Q77 356 77 343 Z"/>
      <path className={styles.line} d="M77 269 H343 V343 Q343 356 330 356 H90 Q77 356 77 343 Z"/>
      <path className={styles.soft} d="M92 292 H328 M92 318 H328 M92 344 H328"/>
    </>}
    {type==='patch'&&<>
      <rect fill={'url(#'+gradId+')'} x="56" y="117" width="308" height="186" rx="24"/>
      <rect className={styles.line} x="56" y="117" width="308" height="186" rx="24"/>
      <rect className={styles.stitch} x="69" y="130" width="282" height="160" rx="17"/>
    </>}
   </svg>
   <div className={styles[type+'Print']}><Artwork mockup={mockup}/></div>
  </div>
 </div>;
}
