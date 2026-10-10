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
 const requestedMedia=String(searchParams.get('media')||'').toLowerCase();
 const availableFormats=(product.variants||[]).map(v=>String(v.format||'').toLowerCase());
 const media=['vinyl','cd','cassette','digital'].includes(requestedMedia)&&availableFormats.includes(requestedMedia)?requestedMedia:String(product.media||product.format||'').toLowerCase();
 const selectedVariant=(product.variants||[]).find(v=>String(v.format||'').toLowerCase()===media)||(product.variants||[])[0]||{};
 const {width,height}=dims(preset);
 const art=imageUrl(product.cover,request);
 const imprint=String(product.imprint||'sideii').toLowerCase();
 const lethargia=imprint==='lethargia';
 const brand=imageUrl(lethargia?'/brand/lethargia/lethargia-logo.png':'/brand/sideii-logo-flat.png',request);
 const title=product.rawTitle||product.title||'UNTITLED';
 const artist=isMerch?'SIDE:II':(product.artist||'SIDE:II');
 const format=isMerch?String(product.merchCategory||product.format||'MERCH').toUpperCase():String(media||product.format||'EDITION').toUpperCase();
 const variantPrice=selectedVariant.price??product.price;
 const price=variantPrice==null?'':('TRY '+new Intl.NumberFormat('tr-TR',{maximumFractionDigits:2}).format(Number(variantPrice||0)));
 const catalogue=product.catalogue||'SIDE:II';
 const vertical=preset==='story';
 const square=preset==='square';
 const stacked=vertical||square;
 const artSize=vertical?820:(square?560:430);

 return new ImageResponse(
  <div style={{
   width:'100%',height:'100%',display:'flex',flexDirection:'column',justifyContent:'space-between',
   padding:vertical?'72px':'54px',background:lethargia?'linear-gradient(145deg,#16080b 0%,#09090a 62%)':'linear-gradient(145deg,#111114 0%,#080809 68%)',
   color:'#f0ece4',fontFamily:'Arial,sans-serif',position:'relative',overflow:'hidden'
  }}>
   <div style={{position:'absolute',inset:0,display:'flex',opacity:.14,background:'radial-gradient(circle at 72% 22%,#7b6f6d 0%,transparent 34%)'}}/>
   <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative',minHeight:vertical?110:86}}>
    {brand?<img src={brand} style={{width:vertical?220:170,height:vertical?92:70,objectFit:'contain',objectPosition:'left center'}}/>:<div style={{fontSize:38}}>SIDE:II</div>}
    <div style={{display:'flex',fontSize:vertical?22:16,letterSpacing:5,color:'#8c8780'}}>{catalogue}</div>
   </div>

   <div style={{
    display:'flex',flexDirection:stacked?'column':'row',gap:vertical?54:(square?34:56),alignItems:'center',
    justifyContent:'center',flex:1,position:'relative',padding:vertical?'58px 0 40px':'46px 0 24px'
   }}>
    <div style={{
     width:artSize,height:artSize,display:'flex',alignItems:'center',justifyContent:'center',position:'relative',
     border:'1px solid #37343a',background:'#0d0d0f',boxShadow:'0 28px 80px rgba(0,0,0,.42)',overflow:'hidden'
    }}>
     {media==='vinyl'&&<div style={{position:'absolute',right:'4%',top:'14%',width:'68%',height:'68%',borderRadius:9999,background:'#151518',border:'10px solid #242428',boxShadow:'0 18px 44px rgba(0,0,0,.45)',display:'flex',alignItems:'center',justifyContent:'center'}}>
       <div style={{width:'18%',height:'18%',borderRadius:9999,background:'#b7b1aa',border:'8px solid #0d0d0f',display:'flex'}}/>
     </div>}
     {media==='cd'&&<div style={{position:'absolute',right:'6%',top:'15%',width:'62%',height:'62%',borderRadius:9999,background:'#c8c5bf',border:'12px solid #8f9498',boxShadow:'0 18px 44px rgba(0,0,0,.35)',display:'flex',alignItems:'center',justifyContent:'center'}}>
       <div style={{width:'16%',height:'16%',borderRadius:9999,background:'#0c0c0e',border:'6px solid #e2ded7',display:'flex'}}/>
     </div>}
     {media==='cassette'&&<div style={{position:'absolute',right:'5%',top:'25%',width:'72%',height:'46%',border:'2px solid #666268',borderRadius:12,background:'linear-gradient(180deg,#222226,#111114)',display:'flex',alignItems:'center',justifyContent:'space-around',padding:'0 12%'}}>
       <div style={{width:'24%',height:'42%',borderRadius:9999,border:'8px solid #77727a',background:'#0b0b0d',display:'flex'}}/><div style={{width:'24%',height:'42%',borderRadius:9999,border:'8px solid #77727a',background:'#0b0b0d',display:'flex'}}/>
     </div>}
     {media==='digital'&&<div style={{position:'absolute',right:'8%',top:'16%',width:'62%',height:'62%',border:'1px solid #555159',background:'linear-gradient(145deg,#111116,#09090b)',display:'flex',alignItems:'center',justifyContent:'center'}}>
       <div style={{display:'flex',fontSize:vertical?54:38,letterSpacing:8,color:'#5f5a63'}}>DIGITAL</div>
     </div>}
     <div style={{position:'absolute',left:'5%',bottom:'5%',width:media==='vinyl'||media==='cd'||media==='cassette'? '58%':'88%',height:media==='vinyl'||media==='cd'||media==='cassette'?'58%':'88%',border:'1px solid #2f2d31',background:'#101012',overflow:'hidden'}}>
      {art?<img src={art} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:vertical?58:44,color:'#59555a'}}>{catalogue}</div>}
     </div>
    </div>
    <div style={{display:'flex',flexDirection:'column',width:stacked?'82%':'44%',gap:vertical?24:(square?14:16)}}>
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
  {width,height,headers:{'Cache-Control':'public, max-age=0, must-revalidate'}}
 );
}
