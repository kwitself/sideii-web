import {createHash} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';

export const runtime='nodejs';
export async function POST(request){
 try{
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;
  if(!url||!key)return Response.json({ok:false,error:'Tracking unavailable'},{status:503});
  const body=await request.json().catch(()=>null);
  const number=Number(body?.order_no);
  const email=String(body?.email||'').trim().toLowerCase();
  if(!Number.isSafeInteger(number)||number<=0||email.length>320||!/^\S+@\S+\.\S+$/.test(email)){
   return Response.json({ok:false,error:'Invalid tracking details'},{status:400});
  }
  const ip=(request.headers.get('x-real-ip')||request.headers.get('x-forwarded-for')?.split(',')[0]||'unknown').trim().slice(0,128);
  const hashed=createHash('sha256').update('sideii:tracking:v1:'+ip).digest('hex');
  const server=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const limited=await server.rpc('consume_order_tracking_limit',{p_key_hash:hashed});
  if(limited.error)return Response.json({ok:false,error:'Tracking unavailable'},{status:503});
  if(!limited.data)return Response.json({ok:false,error:'Too many requests. Try again later.'},{status:429,headers:{'Retry-After':'600'}});
  const result=await server.rpc('lookup_order_tracking',{p_order_no:number,p_email:email});
  if(result.error)return Response.json({ok:false,error:'Tracking unavailable'},{status:503});
  return Response.json({ok:true,order:result.data||null},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({ok:false,error:'Tracking unavailable'},{status:503})}
}
