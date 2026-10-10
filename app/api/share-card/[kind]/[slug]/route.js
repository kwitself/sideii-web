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
function VinylVisual({size,art,color='black'}){
 const vinylColor=String(color||'black').toLowerCase();
 const discColor=vinylColor.includes('red')||vinylColor.includes('burgundy')?'#5b202b':vinylColor.includes('blue')?'#22364d':vinylColor.includes('white')?'#d9d7d1':'#111114';
 return <div style={{width:size,height:size,position:'relative',display:'flex'}}>
  <div style={{position:'absolute',right:0,top:Math.round(size*.08),width:Math.round(size*.82),height:Math.round(size*.82),borderRadius:9999,background:discColor,border:'2px solid #34343a',display:'flex',alignItems:'center',justifyContent:'center'}}>
   <div style={{width:Math.round(size*.68),height:Math.round(size*.68),borderRadius:9999,border:'2px solid #26262b',display:'flex',alignItems:'center',justifyContent:'center'}}>
    <div style={{width:Math.round(size*.27),height:Math.round(size*.27),borderRadius:9999,overflow:'hidden',background:'#272329',border:'1px solid #4b454b',display:'flex',alignItems:'center',justifyContent:'center'}}>
     {art?<img src={art} style={{width:'100%',height:'100%',objectFit:'cover',opacity:.72}}/>:null}
     <div style={{position:'absolute',width:8,height:8,borderRadius:9999,background:'#080809',display:'flex'}}/>
    </div>
   </div>
  </div>
  <div style={{position:'absolute',left:0,bottom:0,width:Math.round(size*.72),height:Math.round(size*.72),border:'1px solid #39393d',background:'#121214',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center'}}>
   {art?<img src={art} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:null}
  </div>
 </div>;
}
function CdVisual({size,art,imprint,number}){
 return <div style={{width:size,height:size,position:'relative',display:'flex'}}>
  <div style={{position:'absolute',right:0,top:Math.round(size*.1),width:Math.round(size*.8),height:Math.round(size*.8),borderRadius:9999,background:'#c9c6c0',border:'10px solid #8f9498',display:'flex',alignItems:'center',justifyContent:'center'}}>
   <div style={{width:Math.round(size*.47),height:Math.round(size*.47),borderRadius:9999,border:'2px solid #aaa7a2',display:'flex',alignItems:'center',justifyContent:'center'}}>
    <div style={{width:Math.round(size*.17),height:Math.round(size*.17),borderRadius:9999,background:'#101012',border:'6px solid #e5e0d8',display:'flex'}}/>
   </div>
   <div style={{position:'absolute',left:'22%',top:'16%',fontFamily:'Arial,sans-serif',fontSize:Math.max(9,Math.round(size*.035)),letterSpacing:3,color:'#44464a',display:'flex'}}>{imprint==='lethargia'?'LETH':'SIDE:II'}</div>
   <div style={{position:'absolute',right:'18%',bottom:'17%',fontFamily:'Arial,sans-serif',fontSize:Math.max(9,Math.round(size*.03)),letterSpacing:2,color:'#515357',display:'flex'}}>{number}</div>
  </div>
  <div style={{position:'absolute',left:0,bottom:0,width:Math.round(size*.72),height:Math.round(size*.72),border:'1px solid #39393d',background:'#121214',overflow:'hidden',display:'flex'}}>
   {art?<img src={art} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:null}
  </div>
 </div>;
}
function CassetteVisual({size,art,imprint,number}){
 return <div style={{width:size,height:size,position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}}>
  <div style={{width:Math.round(size*.88),height:Math.round(size*.58),border:'3px solid #55545b',borderRadius:14,background:'#151518',display:'flex',flexDirection:'column',padding:Math.round(size*.055)}}>
   <div style={{display:'flex',justifyContent:'space-between',fontFamily:'Arial,sans-serif',fontSize:Math.max(9,Math.round(size*.032)),letterSpacing:2,color:'#99959d'}}>
    <span>{imprint==='lethargia'?'LETHARGIA':'SIDE:II'}</span><b style={{fontWeight:400}}>{number}</b>
   </div>
   <div style={{display:'flex',alignItems:'center',justifyContent:'space-around',flex:1,margin:'8% 3%',border:'2px solid #45444a',background:'#0d0d0f'}}>
    <div style={{width:Math.round(size*.16),height:Math.round(size*.16),borderRadius:9999,border:'7px solid #77727a',background:'#0b0b0d',display:'flex'}}/>
    <div style={{width:Math.round(size*.16),height:Math.round(size*.16),borderRadius:9999,border:'7px solid #77727a',background:'#0b0b0d',display:'flex'}}/>
   </div>
  </div>
  <div style={{position:'absolute',left:Math.round(size*.04),bottom:Math.round(size*.02),width:Math.round(size*.45),height:Math.round(size*.45),border:'1px solid #39393d',background:'#121214',overflow:'hidden',display:'flex'}}>
   {art?<img src={art} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:null}
  </div>
 </div>;
}
function DigitalVisual({size,art,variant}){
 const bars=[22,38,58,31,74,46,86,52,68,35,79,43,61,27,49,72,40,57];
 return <div style={{width:size,height:size,position:'relative',display:'flex'}}>
  <div style={{position:'absolute',right:0,top:Math.round(size*.12),width:Math.round(size*.82),height:Math.round(size*.7),border:'2px solid #515057',background:'#17171b',padding:Math.round(size*.055),display:'flex',flexDirection:'column'}}>
   <div style={{display:'flex',justifyContent:'space-between',fontFamily:'Arial,sans-serif',fontSize:Math.max(9,Math.round(size*.032)),letterSpacing:3,color:'#9b979f'}}><span>DIGITAL MASTER</span><b style={{fontWeight:400}}>∞</b></div>
   <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:4,flex:1,padding:'7% 0'}}>
    {bars.map((h,i)=><i key={i} style={{width:3,height:h+'%',background:'#cbc7cf',opacity:.82,display:'flex'}}/>)}
   </div>
   <div style={{display:'flex',justifyContent:'space-between',fontFamily:'Arial,sans-serif',fontSize:Math.max(8,Math.round(size*.025)),letterSpacing:2,color:'#77747c'}}>
    <span>{variant.digitalFormats?.join(' · ')||'WAV · FLAC · MP3'}</span><small>{variant.audioSpecs||'LOSSLESS / HIGH RES'}</small>
   </div>
  </div>
  <div style={{position:'absolute',left:0,bottom:0,width:Math.round(size*.7),height:Math.round(size*.7),border:'1px solid #39393d',background:'#121214',overflow:'hidden',display:'flex'}}>
   {art?<img src={art} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:null}
  </div>
 </div>;
}
function ObjectVisual({media,size,art,variant,imprint,number}){
 if(media==='vinyl')return <VinylVisual size={size} art={art} color={variant.vinylColor}/>;
 if(media==='cd')return <CdVisual size={size} art={art} imprint={imprint} number={number}/>;
 if(media==='cassette')return <CassetteVisual size={size} art={art} imprint={imprint} number={number}/>;
 if(media==='digital')return <DigitalVisual size={size} art={art} variant={variant}/>;
 return <VinylVisual size={size} art={art}/>;
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
     <ObjectVisual media={media} size={objectSize} art={art} variant={variant} imprint={imprint} number={number}/>
     <div style={{width:stacked?'82%':'43%',display:'flex',flexDirection:'column',gap:vertical?15:10}}>
      <div style={{fontFamily:'Arial,sans-serif',fontSize:vertical?16:12,letterSpacing:4,color:lethargia?'#8f3947':'#77736d',display:'flex'}}>{mediaLabel(media)}</div>
      <div style={{fontFamily:'Georgia,serif',fontSize:vertical?29:20,color:'#aaa7a0',display:'flex'}}>{artist}</div>
      <div style={{fontFamily:'Georgia,serif',fontSize:vertical?76:(square?56:48),lineHeight:.95,letterSpacing:-2,color:'#eee9e1',display:'flex'}}>{title}</div>
      <div style={{fontFamily:'Arial,sans-serif',fontSize:vertical?14:11,letterSpacing:3,color:'#74706b',display:'flex'}}>{variant.formatDetail||product.formatDetail||String(media).toUpperCase()}</div>
      {price&&<div style={{fontFamily:'Georgia,serif',fontSize:vertical?42:28,color:'#d8d3cb',marginTop:4,display:'flex'}}>{price}</div>}
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
