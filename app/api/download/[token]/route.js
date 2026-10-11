import {createClient} from '@supabase/supabase-js';
import {classifyDownloadTarget} from '../../../lib/server/digitalTarget.mjs';

export const runtime='nodejs';

export async function GET(request,{params}){
 try{
  const {token}=await params;
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(token||''))){
   return new Response('Invalid download token',{status:400,headers:{'Cache-Control':'no-store'}});
  }
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serverKey=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!serverKey)return new Response('Download service unavailable',{status:503});

  const sb=createClient(url,serverKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:target,error}=await sb.rpc('consume_digital_download_grant',{p_token:token});
  if(error||!target)return new Response('Download link expired or unavailable',{status:410});

  const destination=classifyDownloadTarget(String(target),request.url,process.env.DIGITAL_DOWNLOAD_ALLOWED_HOSTS||'');
  if(destination.kind==='invalid')return new Response('Invalid download target',{status:400,headers:{'Cache-Control':'no-store'}});
  if(destination.kind==='forbidden')return new Response('Download host is not allowed',{status:403,headers:{'Cache-Control':'no-store'}});
  if(destination.kind==='private'){
   const path=destination.path;
   const {data:signed,error:signError}=await sb.storage.from('digital-delivery').createSignedUrl(path,60,{download:path.split('/').pop()||'SIDEII-Digital.zip'});
   if(signError||!signed?.signedUrl)return new Response('Digital file unavailable. Contact support.',{status:404,headers:{'Cache-Control':'no-store'}});
   return Response.redirect(signed.signedUrl,302);
  }

  if(destination.kind==='demo'){
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

  return Response.redirect(destination.url,302);
 }catch{
  return new Response('Download unavailable',{status:400,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 }
}
