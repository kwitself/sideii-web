import QRCode from 'qrcode';
export const runtime='nodejs';
export async function GET(request,{params}){
 const {token}=await params;
 if(!/^[0-9a-f-]{36}$/i.test(String(token||'')))return new Response('Invalid token',{status:400});
 const origin=new URL(request.url).origin;
 const svg=await QRCode.toString(origin+'/gift/'+token,{type:'svg',margin:1,width:420,errorCorrectionLevel:'M'});
 return new Response(svg,{headers:{'content-type':'image/svg+xml; charset=utf-8','cache-control':'private, max-age=300'}});
}