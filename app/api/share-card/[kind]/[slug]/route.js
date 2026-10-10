import {ImageResponse} from 'next/og';
import {getStoreProduct} from '../../../../lib/catalogue';

export const runtime='nodejs';
export const revalidate=0;

function imageUrl(value,request){
 if(!value)return null;
 try{return new URL(value,request.url).toString()}catch{return null}
}

function dims(preset){
 if(preset==='story')return {width:1080,height:1920};
 if(preset==='square')return {width:1080,height:1080};
 return {width:1200,height:630};
}

export async function GET(request,{params}){
 const {kind,slug}=await params;
 const product=await getStoreProduct(slug);
 if(!product)return new Response('Not found',{status:404});
 const isMerch=!!product.isMerch;
 if((kind==='store'&&!isMerch)||(kind==='release'&&isMerch))return new Response('Not found',{status:404});

 const {searchParams}=new URL(request.url);
 const preset=['story','square','link'].includes(searchParams.get('preset'))?searchParams.get('preset'):'link';
 const {width,height}=dims(preset);
 const art=imageUrl(product.cover,request);
 const imprint=String(product.imprint||'sideii').toLowerCase();
 const lethargia=imprint==='lethargia';
 const brand=imageUrl(lethargia?'/brand/lethargia/lethargia-logo.png':'/brand/sideii-logo-flat.png',request);
 const title=product.rawTitle||product.title||'UNTITLED';
 const artist=isMerch?'SIDE:II':(product.artist||'SIDE:II');
 const format=isMerch?String(product.merchCategory||product.format||'MERCH').toUpperCase():String(product.format||'EDITION').toUpperCase();
 const price=product.price==null?'':('TRY '+new Intl.NumberFormat('tr-TR',{maximumFractionDigits:2}).format(Number(product.price||0)));
 const catalogue=product.catalogue||'SIDE:II';
 const vertical=preset==='story';
 const square=preset==='square';

 return new ImageResponse(
  <div style={{
   width:'100%',height:'100%',display:'flex',flexDirection:'column',justifyContent:'space-between',
   padding:vertical?'72px':'54px',background:lethargia?'linear-gradient(145deg,#16080b 0%,#09090a 62%)':'linear-gradient(145deg,#111114 0%,#080809 68%)',
   color:'#f0ece4',fontFamily:'Arial,sans-serif',position:'relative',overflow:'hidden'
  }}>
   <div style={{position:'absolute',inset:0,display:'flex',opacity:.14,background:'radial-gradient(circle at 72% 22%,#7b6f6d 0%,transparent 34%)'}}/>
   <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative'}}>
    {brand?<img src={brand} style={{width:vertical?220:170,height:vertical?92:70,objectFit:'contain',objectPosition:'left center'}}/>:<div style={{fontSize:38}}>SIDE:II</div>}
    <div style={{display:'flex',fontSize:vertical?22:16,letterSpacing:5,color:'#8c8780'}}>{catalogue}</div>
   </div>

   <div style={{
    display:'flex',flexDirection:vertical?'column':'row',gap:vertical?54:56,alignItems:'center',
    justifyContent:'center',flex:1,position:'relative',padding:vertical?'40px 0':'20px 0'
   }}>
    <div style={{
     width:vertical?'82%':square?'58%':'44%',aspectRatio:'1 / 1',display:'flex',alignItems:'center',justifyContent:'center',
     border:'1px solid #37343a',background:'#0d0d0f',boxShadow:'0 28px 80px rgba(0,0,0,.42)',overflow:'hidden'
    }}>
     {art?<img src={art} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<div style={{fontSize:vertical?58:44,color:'#59555a'}}>{catalogue}</div>}
    </div>
    <div style={{display:'flex',flexDirection:'column',width:vertical?'82%':square?'72%':'44%',gap:vertical?24:16}}>
     <div style={{display:'flex',fontSize:vertical?20:15,letterSpacing:5,color:lethargia?'#8f3947':'#77736d'}}>{format}</div>
     <div style={{display:'flex',fontSize:vertical?32:22,color:'#aaa59e'}}>{artist}</div>
     <div style={{
      display:'flex',fontFamily:'Georgia,serif',fontSize:vertical?82:square?64:58,lineHeight:.93,
      letterSpacing:-3,maxWidth:'100%'
     }}>{title}</div>
     {price&&<div style={{display:'flex',marginTop:vertical?18:10,fontFamily:'Georgia,serif',fontSize:vertical?44:30,color:'#d8d3cb'}}>{price}</div>}
    </div>
   </div>

   <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative',borderTop:'1px solid #343238',paddingTop:vertical?28:20}}>
    <div style={{display:'flex',fontSize:vertical?18:13,letterSpacing:4,color:'#79756f'}}>SOUND · ARTWORK · PHYSICAL EDITION</div>
    <div style={{display:'flex',fontSize:vertical?18:13,letterSpacing:3,color:'#5f5b60'}}>SIDE:II</div>
   </div>
  </div>,
  {width,height}
 );
}
