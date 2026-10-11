import {createClient} from '@supabase/supabase-js';

export const runtime='nodejs';

export async function GET(request,{params}){
 try{
  const {token}=await params;
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serverKey=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!serverKey)return new Response('Download service unavailable',{status:503});

  const sb=createClient(url,serverKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:target,error}=await sb.rpc('consume_digital_download_grant',{p_token:token});
  if(error||!target)return new Response('Download link expired or unavailable',{status:410});

  const value=String(target);

  if(value.startsWith('storage-private://')){
   const path=value.slice('storage-private://'.length);
   if(!path||path.startsWith('/')||path.split('/').some(segment=>segment==='..'))return new Response('Invalid private file path',{status:400});
   const {data:signed,error:signError}=await sb.storage.from('digital-delivery').createSignedUrl(path,60,{download:path.split('/').pop()||'SIDEII-Digital.zip'});
   if(signError||!signed?.signedUrl)return new Response('Digital file unavailable. Contact support.',{status:404,headers:{'Cache-Control':'no-store'}});
   return Response.redirect(signed.signedUrl,302);
  }

  if(value==='sideii-internal://demo-digital'){
    const body=[
      'SIDE:II — DIGITAL DOWNLOAD DEMO',
      '',
      'Secure digital delivery test.',
      'This file was generated only after a valid single-use download grant was consumed.',
      '',
      'Formats: WAV · FLAC · MP3',
      'Master: 24-bit / 96 kHz',
      '',
      'SIDE:II / MMXXVI'
    ].join('\n');

    return new Response(body,{
      status:200,
      headers:{
        'Content-Type':'text/plain; charset=utf-8',
        'Content-Disposition':'attachment; filename="SIDEII-Digital-Demo.txt"',
        'Cache-Control':'no-store, private',
        'X-Content-Type-Options':'nosniff'
      }
    });
  }

  if(value.startsWith('/')){
   const destination=new URL(value,request.url);
   if(destination.origin!==new URL(request.url).origin)return new Response('Invalid download target',{status:400});
   return Response.redirect(destination,302);
  }

  const destination=new URL(value);
  const allowed=new Set(String(process.env.DIGITAL_DOWNLOAD_ALLOWED_HOSTS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean));
  if(destination.protocol!=='https:'||!allowed.has(destination.hostname.toLowerCase())){
   return new Response('Download host is not allowed',{status:403});
  }

  return Response.redirect(destination,302);
 }catch(error){
  return new Response(String(error?.message||error),{status:400});
 }
}
