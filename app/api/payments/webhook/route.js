import {createHash} from 'node:crypto';
import {verifyPaymentSignature,validatePaymentEvent} from '../../../lib/server/paymentValidation.mjs';
import {createClient} from '@supabase/supabase-js';
import {sendOrderEmailPayload} from '../../../lib/server/orderEmail';

export const runtime='nodejs';

export async function POST(request){
 try{
  const webhookSecret=String(process.env.PAYMENT_WEBHOOK_SECRET||'');
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serverKey=process.env.SUPABASE_SECRET_KEY;

  if(!webhookSecret||!url||!serverKey){
   return Response.json({ok:false,error:'Payment webhook is not configured'},{status:503});
  }

  const raw=await request.text();
  if(Buffer.byteLength(raw,'utf8')>250000){
   return Response.json({ok:false,error:'Payload too large'},{status:413});
  }

  const supplied=request.headers.get('x-sideii-signature')||'';
  if(!verifyPaymentSignature(raw,supplied,webhookSecret)){
   return Response.json({ok:false,error:'Invalid webhook signature'},{status:401});
  }

  let body;
  try{body=JSON.parse(raw)}catch{
   return Response.json({ok:false,error:'Invalid JSON'},{status:400});
  }

  const validation=validatePaymentEvent(body,process.env.PAYMENT_PROVIDER||'');
  if(!validation.ok)return Response.json({ok:false,error:validation.error},{status:400});
  const {provider,eventId,eventType,orderId,currency,amount,paymentId}=validation;

  const sb=createClient(url,serverKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const payloadHash=createHash('sha256').update(raw).digest('hex');
  const {data,error}=await sb.rpc('apply_payment_event',{
   p_provider:provider,
   p_provider_event_id:eventId,
   p_order_id:orderId,
   p_event_type:eventType,
   p_amount:amount,
   p_currency:currency,
   p_provider_payment_id:paymentId,
   p_payload_hash:payloadHash
  });

  if(error){
   return Response.json({ok:false,error:error.message},{status:400});
  }

  if(data?.event_type==='payment.succeeded'&&!data?.duplicate&&process.env.RESEND_API_KEY){
   try{
    const claimed=await sb.rpc('claim_server_order_email',{p_order_id:orderId,p_type:'paid'});
    if(!claimed.error&&claimed.data)await sendOrderEmailPayload(claimed.data);
   }catch{}
  }

  return Response.json(data||{ok:true});
 }catch(error){
  return Response.json({ok:false,error:String(error?.message||error)},{status:400});
 }
}
