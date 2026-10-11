import {verifyResendSignature} from '../../../lib/server/verifyResendSignature';

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
 // Verified endpoint. Event persistence and provider-id correlation are separate release gates.
 // Acknowledge valid events without modifying customer orders or notification state.
 return new Response(null,{status:204});
}
