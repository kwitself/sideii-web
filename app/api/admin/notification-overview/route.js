import {createClient} from '@supabase/supabase-js';

// Admin-only, read-only commerce delivery overview. Never sends messages.
export async function GET(request){
 try{
  const authorization=request.headers.get('authorization')||'';
  if(!/^Bearer\s+\S+$/.test(authorization))return Response.json({ok:false,error:'Unauthorized'},{status:401});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serverKey=process.env.SUPABASE_SECRET_KEY;
  if(!url||!publicKey||!serverKey)return Response.json({ok:false,error:'Service unavailable'},{status:503});
  const userClient=createClient(url,publicKey,{global:{headers:{Authorization:authorization}},auth:{persistSession:false}});
  const {data:userData,error:userError}=await userClient.auth.getUser();
  if(userError||userData?.user?.app_metadata?.role!=='admin'){
   return Response.json({ok:false,error:'Admin access required'},{status:403});
  }
  const server=createClient(url,serverKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const now=new Date().toISOString();
  const [lease,launchPending,giftPending,previewFailed,realFailures,realSuccesses]=await Promise.all([
   server.from('notification_runner_lease').select('expires_at').eq('name','commerce').maybeSingle(),
   server.from('launch_subscriptions').select('*',{count:'exact',head:true}).is('notified_at',null),
   server.from('orders').select('*',{count:'exact',head:true}).eq('is_gift',true).eq('payment_status','paid').is('gift_notified_at',null).not('gift_recipient_email','is',null).not('status','in','(cancelled,refunded)').or('gift_delivery_at.is.null,gift_delivery_at.lte.'+now),
   server.from('email_delivery_queue').select('*',{count:'exact',head:true}).eq('status','failed'),
   server.from('commerce_notification_attempts').select('*',{count:'exact',head:true}).eq('outcome','failed'),
   server.from('commerce_notification_attempts').select('*',{count:'exact',head:true}).eq('outcome','sent')
  ]);
  const failure=[lease,launchPending,giftPending,previewFailed,realFailures,realSuccesses].find(x=>x.error);
  if(failure)return Response.json({ok:false,error:'Delivery overview unavailable'},{status:503});
  const expires=lease.data?.expires_at??null;
  return Response.json({ok:true,checked_at:now,runner:{active:!!expires&&new Date(expires)>new Date(now),expires_at:expires},counts:{
   launch_unnotified:launchPending.count??0,
   gift_due:giftPending.count??0,
   qa_preview_failed:previewFailed.count??0,
   real_send_failures:realFailures.count??0,
   real_send_successes:realSuccesses.count??0
  },note:'Read-only snapshot. QA preview events are not actual delivery failures.'},{headers:{'Cache-Control':'no-store'}});
 }catch{
  return Response.json({ok:false,error:'Delivery overview unavailable'},{status:503});
 }
}
