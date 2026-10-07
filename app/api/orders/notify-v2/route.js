import {createClient} from '@supabase/supabase-js';
import {sendOrderEmailPayload} from '../../../lib/server/orderEmail';

export async function POST(request){
 try{
  const body=await request.json();
  const orderId=body.order_id;
  const type=String(body.type||'received').toLowerCase();
  if(!['received','paid','preparing','shipped','completed'].includes(type)){
   return Response.json({ok:false,error:'Invalid notification type'},{status:400});
  }

  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishable=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!publishable)return Response.json({ok:false,error:'Store email service unavailable'},{status:503});

  let payload=null;

  if(type==='received'){
   if(!orderId||!body.notification_token){
    return Response.json({ok:false,error:'Order notification token required'},{status:400});
   }
   const client=createClient(url,publishable,{auth:{persistSession:false}});
   const claimed=await client.rpc('claim_received_order_email',{
    p_order_id:orderId,
    p_notification_token:body.notification_token
   });
   if(claimed.error)return Response.json({ok:false,error:claimed.error.message},{status:400});
   payload=claimed.data;
  }else{
   const auth=request.headers.get('authorization')||'';
   if(!auth.startsWith('Bearer '))return Response.json({ok:false,error:'Unauthorized'},{status:401});

   const userClient=createClient(url,publishable,{global:{headers:{Authorization:auth}},auth:{persistSession:false}});
   const {data:userData,error:userError}=await userClient.auth.getUser();
   const user=userData?.user;
   if(userError||!user||user.app_metadata?.role!=='admin'){
    return Response.json({ok:false,error:'Admin access required'},{status:403});
   }

   const serverKey=process.env.SUPABASE_SECRET_KEY;
   if(!serverKey)return Response.json({ok:false,error:'Server email boundary unavailable'},{status:503});
   const server=createClient(url,serverKey,{auth:{persistSession:false,autoRefreshToken:false}});
   const claimed=await server.rpc('claim_server_order_email',{p_order_id:orderId,p_type:type});
   if(claimed.error)return Response.json({ok:false,error:claimed.error.message},{status:400});
   payload=claimed.data;
  }

  if(!payload)return Response.json({ok:true,email_sent:false,reason:'already_sent_or_not_found'});
  const sent=await sendOrderEmailPayload(payload);
  return Response.json(sent,{status:sent.status||200});
 }catch(error){
  return Response.json({ok:false,error:String(error?.message||error)},{status:400});
 }
}
