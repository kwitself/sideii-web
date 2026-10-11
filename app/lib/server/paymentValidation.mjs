import {createHmac,timingSafeEqual} from 'node:crypto';

export function verifyPaymentSignature(raw,signature,secret){
 if(typeof raw!=='string'||!secret||typeof signature!=='string'||!/^[a-f0-9]{64}$/i.test(signature))return false;
 const expected=createHmac('sha256',secret).update(raw).digest();
 return timingSafeEqual(Buffer.from(signature,'hex'),expected);
}

export function validatePaymentEvent(body,expectedProvider=''){
 if(!body||typeof body!=='object'||Array.isArray(body))return {ok:false,error:'Invalid event body'};
 const provider=String(body.provider||expectedProvider||'generic').trim().toLowerCase();
 const eventId=String(body.event_id??'').trim();
 const eventType=String(body.event_type??'').trim().toLowerCase();
 const orderId=String(body.order_id??'').trim();
 const currency=String(body.currency||'TRY').trim().toUpperCase();
 const paymentId=body.payment_id==null?null:String(body.payment_id).trim();
 if(!/^[a-z0-9][a-z0-9._-]{0,79}$/.test(provider))return {ok:false,error:'Invalid payment provider'};
 if(paymentId!==null&&(!paymentId||paymentId.length>200||Array.from(paymentId).some(char=>char.charCodeAt(0)<32||char.charCodeAt(0)===127)))return {ok:false,error:'Invalid payment identifier'};
 if(expectedProvider&&provider!==expectedProvider.trim().toLowerCase())return {ok:false,error:'Unexpected payment provider'};
 if(!eventId||eventId.length>200||/[\x00-\x1f\x7f]/.test(eventId)||!orderId)return {ok:false,error:'Missing payment event fields'};
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId)||
   !['payment.succeeded','payment.failed','payment.refunded'].includes(eventType)||
   !/^[A-Z]{3}$/.test(currency)||
   typeof body.amount!=='number'||!Number.isFinite(body.amount)||body.amount<0||body.amount>10000000)
   return {ok:false,error:'Invalid payment event data'};
 return {ok:true,provider,eventId,eventType,orderId,currency,amount:body.amount,paymentId};
}
