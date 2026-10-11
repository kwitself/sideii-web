import {createHash} from 'node:crypto';
import {verifyPaymentSignature} from '../../../lib/server/paymentValidation.mjs';
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

  const provider=String(body.provider||process.env.PAYMENT_PROVIDER||'generic').trim().toLowerCase();
  const eventId=String(body.event_id||'').trim();
  const eventType=String(body.event_type||'').trim().toLowerCase();
  const orderId=String(body.order_id||'').trim();
  const currency=String(body.currency||'TRY').trim().toUpperCase();
  const amount=Number(body.amount);
  const paymentId=body.payment_id==null?null:String(body.payment_id).trim();

  const configuredProvider=String(process.env.PAYMENT_PROVIDER||'').trim().toLowerCase();
  if(configuredProvider&&provider!==configuredProvider){
   return Response.json({ok:false,error:'Unexpected payment provider'},{status:400});
  }
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId)
    || !['payment.succeeded','payment.failed','payment.refunded'].includes(eventType)
    || eventId.length>200 || !/^[A-Z]{3}$/.test(currency)
    || amount<0 || amount>10000000){
   return Response.json({ok:false,error:'Invalid payment event data'},{status:400});
  }
  if(!eventId||!orderId||!Number.isFinite(amount)){
   return Response.json({ok:false,error:'Missing payment event fields'},{status:400});
  }

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
