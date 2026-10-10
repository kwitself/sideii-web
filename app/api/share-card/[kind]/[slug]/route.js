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
 if(media==='vinyl')return 'VINYL OBJECT';
 if(media==='cd')return 'COMPACT DISC';
 if(media==='cassette')return 'CASSETTE OBJECT';
 if(media==='digital')return 'DIGITAL MASTER';
 return 'PHYSICAL EDITION';
}

function MediaGlyph({media,size}){
 if(media==='vinyl')return <div style={{width:size,height:size,borderRadius:9999,background:'#1a1a1d',border:'10px solid #29292d',display:'flex',alignItems:'center',justifyContent:'center'}}>
  <div style={{width:Math.round(size*.18),height:Math.round(size*.18),borderRadius:9999,background:'#bcb7af',border:'6px solid #0b0b0d',display:'flex'}}/>
 </div>;
 if(media==='cd')return <div style={{width:size,height:size,borderRadius:9999,background:'#c8c5bf',border:'10px solid #85898e',display:'flex',alignItems:'center',justifyContent:'center'}}>
  <div style={{width:Math.round(size*.16),height:Math.round(size*.16),borderRadius:9999,background:'#0b0b0d',border:'5px solid #ece8e0',display:'flex'}}/>
 </div>;
 if(media==='cassette')return <div style={{width:size,height:Math.round(size*.62),border:'3px solid #646168',borderRadius:14,background:'#17171a',display:'flex',alignItems:'center',justifyContent:'space-around',padding:'0 12%'}}>
  <div style={{width:Math.round(size*.2),height:Math.round(size*.2),borderRadius:9999,border:'7px solid #77727a',background:'#0b0b0d',display:'flex'}}/>
  <div style={{width:Math.round(size*.2),height:Math.round(size*.2),borderRadius:9999,border:'7px solid #77727a',background:'#0b0b0d',display:'flex'}}/>
 </div>;
 if(media==='digital')return <div style={{width:size,height:size,border:'2px solid #4b4850',background:'#101014',display:'flex',alignItems:'center',justifyContent:'center'}}>
  <div style={{fontSize:Math.round(size*.13),letterSpacing:8,color:'#77727e',display:'flex'}}>DIGITAL</div>
 </div>;
 return <div style={{width:size,height:size,border:'2px solid #3a383d',background:'#111114',display:'flex'}}/>;
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
  const availableFormats=(product.variants||[]).map(v=>String(v.format||'').toLowerCase());
  const media=['vinyl','cd','cassette','digital'].includes(requestedMedia)&&availableFormats.includes(requestedMedia)
   ? requestedMedia
   : (availableFormats.find(v=>['vinyl','cd','cassette','digital'].includes(v))||'');

  const selectedVariant=(product.variants||[]).find(v=>String(v.format||'').toLowerCase()===media)||(product.variants||[])[0]||{};
  const {width,height}=dims(preset);
  const vertical=preset==='story',square=preset==='square',stacked=vertical||square;
  const art=imageUrl(product.cover,request);
  const imprint=String(product.imprint||'sideii').toLowerCase();
  const lethargia=imprint==='lethargia';
  const brand=imageUrl(lethargia?'/brand/lethargia/lethargia-logo.png':'/brand/sideii-logo-flat.png',request);
  const title=product.rawTitle||product.title||'UNTITLED';
  const artist=isMerch?'SIDE:II':(product.artist||'SIDE:II');
  const format=isMerch?String(product.merchCategory||'MERCH').toUpperCase():String(media||product.format||'EDITION').toUpperCase();
  const variantPrice=selectedVariant.price??product.price;
  const price=variantPrice==null?'':('TRY '+new Intl.NumberFormat('tr-TR',{maximumFractionDigits:2}).format(Number(variantPrice||0)));
  const catalogue=product.catalogue||'SIDE:II';
  const artSize=vertical?720:(square?470:360);
  const glyphSize=vertical?360:(square?250:210);

  return new ImageResponse(
   <div style={{
    width:'100%',height:'100%',display:'flex',flexDirection:'column',
    padding:vertical?'64px':'48px',
    background:lethargia?'#12090b':'#0b0b0d',
    color:'#f0ece4',fontFamily:'Arial,sans-serif'
   }}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',height:vertical?118:86,flexShrink:0,borderBottom:'1px solid #302f33',paddingBottom:18}}>
     <div style={{display:'flex',alignItems:'center',height:'100%'}}>
      {brand?<img src={brand} style={{width:vertical?210:150,height:vertical?86:58,objectFit:'contain'}}/>:<div style={{display:'flex',fontSize:36}}>SIDE:II</div>}
     </div>
     <div style={{display:'flex',fontSize:vertical?20:14,letterSpacing:4,color:'#7d7973'}}>{catalogue}</div>
    </div>

    <div style={{display:'flex',flexDirection:stacked?'column':'row',alignItems:'center',justifyContent:'center',gap:vertical?48:(square?28:48),flex:1,padding:vertical?'36px 0 24px':'24px 0 18px'}}>
     <div style={{width:artSize,height:artSize,display:'flex',position:'relative',alignItems:'center',justifyContent:'center',border:'1px solid #343238',background:'#101012'}}>
      <div style={{position:'absolute',right:vertical?34:24,top:vertical?34:24,display:'flex',opacity:.95}}>
       <MediaGlyph media={media} size={glyphSize}/>
      </div>
      <div style={{position:'absolute',left:vertical?34:24,bottom:vertical?34:24,width:Math.round(artSize*.62),height:Math.round(artSize*.62),display:'flex',border:'1px solid #343238',background:'#0d0d0f',overflow:'hidden'}}>
       {art?<img src={art} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:vertical?54:38,color:'#5f5b60'}}>{catalogue}</div>}
      </div>
     </div>

     <div style={{display:'flex',flexDirection:'column',width:stacked?'82%':'44%',gap:vertical?18:12}}>
      <div style={{display:'flex',fontSize:vertical?18:13,letterSpacing:4,color:lethargia?'#8f3947':'#77736d'}}>{mediaLabel(media)}</div>
      <div style={{display:'flex',fontSize:vertical?28:20,color:'#aaa59e'}}>{artist}</div>
      <div style={{display:'flex',fontFamily:'Georgia,serif',fontSize:vertical?76:(square?58:50),lineHeight:1,letterSpacing:-2}}>{title}</div>
      <div style={{display:'flex',fontSize:vertical?18:13,letterSpacing:3,color:'#706c66'}}>{format}</div>
      {price&&<div style={{display:'flex',marginTop:6,fontFamily:'Georgia,serif',fontSize:vertical?40:28,color:'#d8d3cb'}}>{price}</div>}
     </div>
    </div>

    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',height:vertical?72:52,flexShrink:0,borderTop:'1px solid #302f33',paddingTop:16}}>
     <div style={{display:'flex',fontSize:vertical?16:11,letterSpacing:3,color:'#79756f'}}>SOUND · ARTWORK · OBJECT</div>
     <div style={{display:'flex',fontSize:vertical?16:11,letterSpacing:3,color:'#5f5b60'}}>SIDE:II</div>
    </div>
   </div>,
   {width,height}
  );
 }catch(error){
  console.error('share-card render failed',error);
  return new Response('Share card render failed',{status:500});
 }
}
