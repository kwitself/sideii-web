import {createHmac,timingSafeEqual,createHash} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {sendOrderEmailPayload} from '../../../lib/server/orderEmail';

export const runtime='nodejs';

function safeEqualHex(a,b){
 const left=Buffer.from(String(a||'').trim().toLowerCase(),'hex');
 const right=Buffer.from(String(b||'').trim().toLowerCase(),'hex');
 return left.length>0&&left.length===right.length&&timingSafeEqual(left,right);
}

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
  const expected=createHmac('sha256',webhookSecret).update(raw).digest('hex');
  if(!safeEqualHex(supplied,expected)){
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

  if(data?.event_type==='payment.succeeded'&&!data?.duplicate){
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
