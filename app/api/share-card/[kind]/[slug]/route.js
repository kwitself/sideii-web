import {ImageResponse} from 'next/og';
import {getStoreProduct} from '../../../../lib/catalogue';

export const runtime='nodejs';
export const revalidate=0;
export const dynamic='force-dynamic';

function imageUrl(value,request){
 if(!value)return null;
 try{return new URL(value,request.url).toString()}catch{return null}
}
function dims(preset){
 if(preset==='story')return {width:1080,height:1920};
 if(preset==='square')return {width:1080,height:1080};
 return {width:1200,height:630};
}
function mediaLabel(media){
 if(media==='vinyl')return 'VINYL EDITION';
 if(media==='cd')return 'CD EDITION';
 if(media==='cassette')return 'CASSETTE EDITION';
 if(media==='digital')return 'DIGITAL EDITION';
 return 'PHYSICAL EDITION';
}
function Cover({size,art,catalogue,number,title}){
 const inset=Math.round(size*.07);
 return <div style={{
  position:'absolute',left:inset,top:inset,right:inset,bottom:inset,
  border:'1px solid #39393d',background:'#121214',display:'flex',
  alignItems:'center',justifyContent:'center',overflow:'hidden'
 }}>
  {art?<img src={art} style={{width:'47%',height:'47%',objectFit:'cover',opacity:.45}}/>:<div style={{display:'flex',fontFamily:'Georgia,serif',fontSize:Math.round(size*.08),color:'#303034'}}>{catalogue}</div>}
  <div style={{position:'absolute',left:Math.round(size*.045),top:Math.round(size*.04),display:'flex',fontFamily:'Arial,sans-serif',fontSize:Math.max(8,Math.round(size*.018)),letterSpacing:3,color:'#85827c'}}>{catalogue}</div>
  <div style={{position:'absolute',right:Math.round(size*.045),top:Math.round(size*.026),display:'flex',fontFamily:'Georgia,serif',fontSize:Math.round(size*.09),color:'#303034'}}>{number}</div>
  <div style={{position:'absolute',left:Math.round(size*.045),bottom:Math.round(size*.04),display:'flex',fontFamily:'Georgia,serif',fontSize:Math.max(10,Math.round(size*.025)),color:'#96928a'}}>{title}</div>
 </div>;
}
function VinylVisual({size,art,variant,catalogue,number,title}){
 const color=String(variant?.vinylColor||'BLACK').toLowerCase();
 const fill=color.includes('white')?'#d8d8d6':color.includes('red')||color.includes('burgundy')?'#4a1822':color.includes('blue')?'#172739':'#101012';
 const d=Math.round(size*.82);
 return <div style={{width:size,height:size,position:'relative',display:'flex'}}>
  <div style={{position:'absolute',width:d,height:d,right:-Math.round(size*.01),top:Math.round(size*.09),borderRadius:9999,background:fill,border:'2px solid #35353a',display:'flex',alignItems:'center',justifyContent:'center'}}>
   <div style={{position:'absolute',inset:Math.round(d*.03),borderRadius:9999,border:'2px solid #252529',display:'flex'}}/>
   <div style={{width:Math.round(d*.28),height:Math.round(d*.28),borderRadius:9999,overflow:'hidden',background:'#171719',border:'1px solid #2e2d31',display:'flex',alignItems:'center',justifyContent:'center'}}>
    {art?<img src={art} style={{width:'124%',height:'124%',objectFit:'cover',opacity:.72}}/>:null}
    <div style={{position:'absolute',width:7,height:7,borderRadius:9999,background:'#080809',display:'flex'}}/>
   </div>
  </div>
  <Cover size={size} art={art} catalogue={catalogue} number={number} title={title}/>
 </div>;
}
function CdVisual({size,art,imprint,catalogue,number,title}){
 const d=Math.round(size*.75);
 return <div style={{width:size,height:size,position:'relative',display:'flex'}}>
  <div style={{position:'absolute',width:d,height:d,right:Math.round(size*.02),top:Math.round(size*.12),borderRadius:9999,background:'#c9c7c1',border:'10px solid #8f9498',display:'flex',alignItems:'center',justifyContent:'center'}}>
   <div style={{width:Math.round(d*.18),height:Math.round(d*.18),borderRadius:9999,background:'#111',border:'5px solid #c5c2bd',display:'flex'}}/>
   <div style={{position:'absolute',left:'18%',top:'15%',display:'flex',fontFamily:'Arial,sans-serif',fontSize:Math.max(8,Math.round(size*.02)),letterSpacing:3,color:'#4c4e52'}}>{imprint==='lethargia'?'LETH':'SIDE:II'}</div>
   <div style={{position:'absolute',right:'16%',bottom:'14%',display:'flex',fontFamily:'Arial,sans-serif',fontSize:Math.max(8,Math.round(size*.018)),letterSpacing:2,color:'#57595d'}}>{number}</div>
  </div>
  <Cover size={size} art={art} catalogue={catalogue} number={number} title={title}/>
 </div>;
}
function CassetteVisual({size,art,imprint,catalogue,number,title}){
 return <div style={{width:size,height:size,position:'relative',display:'flex'}}>
  <div style={{position:'absolute',width:Math.round(size*.76),height:Math.round(size*.52),right:0,top:Math.round(size*.22),border:'3px solid #535159',borderRadius:14,background:'#17171a',display:'flex',flexDirection:'column',padding:Math.round(size*.045)}}>
   <div style={{display:'flex',justifyContent:'space-between',fontFamily:'Arial,sans-serif',fontSize:Math.max(8,Math.round(size*.019)),letterSpacing:2,color:'#8c8991'}}><span>{imprint==='lethargia'?'LETHARGIA':'SIDE:II'}</span><span>{number}</span></div>
   <div style={{display:'flex',alignItems:'center',justifyContent:'space-around',flex:1,margin:'8% 4%',border:'2px solid #46454b',background:'#0c0c0e'}}>
    <div style={{width:Math.round(size*.13),height:Math.round(size*.13),borderRadius:9999,border:'7px solid #77727a',background:'#0b0b0d',display:'flex'}}/>
    <div style={{width:Math.round(size*.13),height:Math.round(size*.13),borderRadius:9999,border:'7px solid #77727a',background:'#0b0b0d',display:'flex'}}/>
   </div>
   <div style={{height:Math.round(size*.04),display:'flex',justifyContent:'space-around'}}><i style={{width:6,height:6,borderRadius:9999,background:'#77727a',display:'flex'}}/><i style={{width:6,height:6,borderRadius:9999,background:'#77727a',display:'flex'}}/><i style={{width:6,height:6,borderRadius:9999,background:'#77727a',display:'flex'}}/></div>
  </div>
  <Cover size={size} art={art} catalogue={catalogue} number={number} title={title}/>
 </div>;
}
function DigitalVisual({size,art,variant,catalogue,number,title}){
 const bars=[22,38,58,31,74,46,86,52,68,35,79,43,61,27,49,72,40,57,30,64,45,78,36,55];
 return <div style={{width:size,height:size,position:'relative',display:'flex'}}>
  <div style={{position:'absolute',width:Math.round(size*.8),height:Math.round(size*.7),right:-Math.round(size*.02),top:Math.round(size*.15),border:'1px solid #515057',background:'#202025',padding:Math.round(size*.05),display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
   <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',fontFamily:'Arial,sans-serif',fontSize:Math.max(8,Math.round(size*.018)),letterSpacing:3,color:'#85828a'}}><span>DIGITAL MASTER</span><b style={{fontFamily:'Georgia,serif',fontSize:Math.round(size*.06),fontWeight:400,color:'#45434a'}}>∞</b></div>
   <div style={{height:'48%',display:'flex',alignItems:'center',justifyContent:'space-between',gap:4}}>
    {bars.map((h,i)=><i key={i} style={{width:3,height:h+'%',background:'#d8d5d9',opacity:.72,display:'flex'}}/>)}
   </div>
   <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',fontFamily:'Arial,sans-serif',fontSize:Math.max(7,Math.round(size*.016)),letterSpacing:2,color:'#85828a'}}>
    <span>{variant?.digitalFormats?.join(' · ')||'WAV · FLAC · MP3'}</span><small style={{color:'#5f5d63'}}>{variant?.audioSpecs||'LOSSLESS / HIGH RES'}</small>
   </div>
  </div>
  <Cover size={size} art={art} catalogue={catalogue} number={number} title={title}/>
 </div>;
}
function ObjectVisual({media,size,art,variant,imprint,catalogue,number,title}){
 if(media==='vinyl')return <VinylVisual size={size} art={art} variant={variant} catalogue={catalogue} number={number} title={title}/>;
 if(media==='cd')return <CdVisual size={size} art={art} imprint={imprint} catalogue={catalogue} number={number} title={title}/>;
 if(media==='cassette')return <CassetteVisual size={size} art={art} imprint={imprint} catalogue={catalogue} number={number} title={title}/>;
 if(media==='digital')return <DigitalVisual size={size} art={art} variant={variant} catalogue={catalogue} number={number} title={title}/>;
 return <VinylVisual size={size} art={art} variant={variant} catalogue={catalogue} number={number} title={title}/>;
}

export async function GET(request,{params}){
 try{
  const {kind,slug}=await params;
  const product=await getStoreProduct(slug);
  if(!product)return new Response('Not found',{status:404});
  const isMerch=!!product.isMerch;
  if((kind==='store'&&!isMerch)||(kind==='release'&&isMerch))return new Response('Not found',{status:404});

  const {searchParams}=new URL(request.url);
  const preset=['story','square','link'].includes(searchParams.get('preset'))?searchParams.get('preset'):'link';
  const requestedMedia=String(searchParams.get('media')||'').toLowerCase();
  const availableFormats=(product.variants||[]).map(v=>String(v.format||v.media||'').toLowerCase());
  const media=['vinyl','cd','cassette','digital'].includes(requestedMedia)&&availableFormats.includes(requestedMedia)
   ?requestedMedia:(availableFormats.find(v=>['vinyl','cd','cassette','digital'].includes(v))||String(product.media||'vinyl').toLowerCase());
  const variant=(product.variants||[]).find(v=>String(v.format||v.media||'').toLowerCase()===media)||(product.variants||[])[0]||{};

  const {width,height}=dims(preset);
  const vertical=preset==='story',square=preset==='square',stacked=vertical||square;
  const art=imageUrl(product.cover,request);
  const imprint=String(product.imprint||'sideii').toLowerCase();
  const lethargia=imprint==='lethargia';
  const brand=imageUrl(lethargia?'/brand/lethargia/lethargia-logo.png':'/brand/sideii-logo-flat.png',request);
  const title=product.rawTitle||product.title||'UNTITLED';
  const artist=isMerch?'SIDE:II':(product.artist||'SIDE:II');
  const number=product.number||product.catalogue||'';
  const priceValue=variant.price??product.price;
  const price=priceValue==null?'':('TRY '+new Intl.NumberFormat('tr-TR',{maximumFractionDigits:2}).format(Number(priceValue||0)));
  const catalogue=product.catalogue||'SIDE:II';
  const objectSize=vertical?690:(square?490:365);

  return new ImageResponse(
   <div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',padding:vertical?'64px':'48px',background:lethargia?'#12090b':'#0b0b0d',color:'#eee9e1'}}>
    <div style={{height:vertical?116:84,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,borderBottom:'1px solid #2c2b2f',paddingBottom:18}}>
     {brand?<img src={brand} style={{width:vertical?210:154,height:vertical?86:58,objectFit:'contain'}}/>:<div style={{fontFamily:'Georgia,serif',fontSize:38,display:'flex'}}>SIDE:II</div>}
     <div style={{fontFamily:'Arial,sans-serif',fontSize:vertical?18:13,letterSpacing:4,color:'#6f6b66',display:'flex'}}>{catalogue}</div>
    </div>

    <div style={{display:'flex',flexDirection:stacked?'column':'row',alignItems:'center',justifyContent:'center',gap:vertical?46:(square?28:52),flex:1,padding:vertical?'36px 0 26px':'22px 0 16px'}}>
     <ObjectVisual media={media} size={objectSize} art={art} variant={variant} imprint={imprint} catalogue={catalogue} number={number} title={title}/>
     <div style={{width:stacked?'82%':'43%',display:'flex',flexDirection:'column',gap:vertical?15:10}}>
      <div style={{fontFamily:'Arial,sans-serif',fontSize:vertical?16:12,letterSpacing:4,color:lethargia?'#8f3947':'#77736d',display:'flex'}}>{mediaLabel(media)}</div>
      <div style={{fontFamily:'Georgia,serif',fontSize:vertical?31:22,color:'#aaa7a0',display:'flex'}}>{artist}</div>
      <div style={{fontFamily:'Georgia,serif',fontSize:vertical?82:(square?62:54),lineHeight:.86,letterSpacing:-3,color:'#eee9e1',display:'flex'}}>{title}</div>
      <div style={{fontFamily:'Arial,sans-serif',fontSize:vertical?14:11,letterSpacing:3,color:'#74706b',display:'flex'}}>{variant.formatDetail||product.formatDetail||String(media).toUpperCase()}</div>
      {price&&<div style={{fontFamily:'Georgia,serif',fontSize:vertical?44:30,color:'#d8d3cb',marginTop:4,display:'flex'}}>{price}</div>}
     </div>
    </div>

    <div style={{height:vertical?68:48,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,borderTop:'1px solid #2c2b2f',paddingTop:15}}>
     <div style={{fontFamily:'Arial,sans-serif',fontSize:vertical?14:10,letterSpacing:3,color:'#6f6b66',display:'flex'}}>SOUND · ARTWORK · PHYSICAL EDITION</div>
     <div style={{fontFamily:'Arial,sans-serif',fontSize:vertical?14:10,letterSpacing:3,color:'#535056',display:'flex'}}>{imprint==='lethargia'?'LETHARGIA / SIDE:II':'SIDE:II'}</div>
    </div>
   </div>,
   {width,height}
  );
 }catch(error){
  console.error('share-card render failed',error);
  return new Response('Share card render failed',{status:500});
 }
}
