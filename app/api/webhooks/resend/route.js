import {verifyResendSignature} from '../../../lib/server/verifyResendSignature';
import {createClient} from '@supabase/supabase-js';

export async function POST(request){
 const secret=process.env.RESEND_WEBHOOK_SECRET;
 if(!secret)return Response.json({ok:false,error:'Webhook unavailable'},{status:503});
 const id=request.headers.get('svix-id');
 const timestamp=request.headers.get('svix-timestamp');
 const signature=request.headers.get('svix-signature');
 let raw;
 try{raw=await request.text()}catch{return Response.json({ok:false,error:'Invalid body'},{status:400})}
 if(raw.length>65536)return Response.json({ok:false,error:'Payload too large'},{status:413});
 if(!verifyResendSignature({body:raw,id,timestamp,signature,secret})){
  return Response.json({ok:false,error:'Invalid signature'},{status:401});
 }
 let payload;
 try{payload=JSON.parse(raw)}catch{return Response.json({ok:false,error:'Invalid JSON'},{status:400})}
 if(typeof payload?.type!=='string'||typeof payload?.data?.email_id!=='string'){
  return Response.json({ok:false,error:'Invalid event'},{status:400});
 }
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const serviceKey=process.env.SUPABASE_SECRET_KEY;
 if(!url||!serviceKey)return Response.json({ok:false,error:'Webhook storage unavailable'},{status:503});
 const server=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
 const accepted=new Set(['email.sent','email.delivered','email.delivery_delayed','email.bounced','email.complained','email.failed']);
 if(!accepted.has(payload.type))return new Response(null,{status:204});
 const emailId=payload.data.email_id;
 if(emailId.length>255||id.length>255)return Response.json({ok:false,error:'Invalid identifiers'},{status:400});
 const {error}=await server.from('commerce_notification_webhook_events').upsert(
  {event_id:id,provider_email_id:emailId,event_type:payload.type},
  {onConflict:'event_id',ignoreDuplicates:true}
 );
 if(error)return Response.json({ok:false,error:'Webhook storage unavailable'},{status:503});
 return new Response(null,{status:204});
}
