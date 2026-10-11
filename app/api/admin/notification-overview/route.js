import {createClient} from '@supabase/supabase-js';
import {resolveEmailDeliveryStatus} from '../../../lib/server/resolveEmailDeliveryStatus';

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
  const [lease,launchPending,giftPending,previewFailed,realFailures,realSuccesses,recentAttempts]=await Promise.all([
   server.from('notification_runner_lease').select('expires_at').eq('name','commerce').maybeSingle(),
   server.from('launch_subscriptions').select('*',{count:'exact',head:true}).is('notified_at',null),
   server.from('orders').select('*',{count:'exact',head:true}).eq('is_gift',true).eq('payment_status','paid').is('gift_notified_at',null).not('gift_recipient_email','is',null).not('status','in','(cancelled,refunded)').or('gift_delivery_at.is.null,gift_delivery_at.lte.'+now),
   server.from('email_delivery_queue').select('*',{count:'exact',head:true}).eq('status','failed'),
   server.from('commerce_notification_attempts').select('*',{count:'exact',head:true}).eq('outcome','failed'),
   server.from('commerce_notification_attempts').select('*',{count:'exact',head:true}).eq('outcome','sent'),
   server.from('commerce_notification_attempts').select('kind,reference_id,outcome,error_code,attempted_at,provider_email_id').order('attempted_at',{ascending:false}).limit(200)
  ]);
  const failure=[lease,launchPending,giftPending,previewFailed,realFailures,realSuccesses,recentAttempts].find(x=>x.error);
  if(failure)return Response.json({ok:false,error:'Delivery overview unavailable'},{status:503});
  const expires=lease.data?.expires_at??null;
  const attempts=recentAttempts.data||[];
  const grouped=new Map();
  for(const attempt of attempts){
   const key=attempt.kind+':'+attempt.reference_id;
   let item=grouped.get(key);
   if(!item){item={kind:attempt.kind,outcome:attempt.outcome,error_code:attempt.error_code,attempted_at:attempt.attempted_at,attempts:0};grouped.set(key,item)}
   item.attempts++;
  }
  const recentSummaries=[...grouped.values()].slice(0,20);
  const emailIds=[...new Set(attempts.map(a=>a.provider_email_id).filter(Boolean))];
  if(emailIds.length){
   const {data:events,error:eventsError}=await server.from('commerce_notification_webhook_events')
    .select('provider_email_id,event_type,received_at').in('provider_email_id',emailIds)
    .order('received_at',{ascending:false}).limit(500);
   if(eventsError)return Response.json({ok:false,error:'Delivery events unavailable'},{status:503});
   const byEmail=new Map();
   for(const item of events||[])byEmail.set(item.provider_email_id,[...(byEmail.get(item.provider_email_id)||[]),item]);
   const byReference=new Map();
   for(const attempt of attempts){
    const key=attempt.kind+':'+attempt.reference_id;
    if(!byReference.has(key)&&attempt.provider_email_id)byReference.set(key,resolveEmailDeliveryStatus(byEmail.get(attempt.provider_email_id))||'email.accepted');
   }
   for(const [key,summary] of grouped)summary.delivery_status=byReference.get(key)||'unverified';
  }

  return Response.json({ok:true,checked_at:now,runner:{active:!!expires&&new Date(expires)>new Date(now),expires_at:expires},counts:{
   launch_unnotified:launchPending.count??0,
   gift_due:giftPending.count??0,
   qa_preview_failed:previewFailed.count??0,
   real_send_failures:realFailures.count??0,
   real_send_successes:realSuccesses.count??0
  },recent_attempts:recentSummaries,note:'Read-only snapshot. QA preview events are not actual delivery failures.'},{headers:{'Cache-Control':'no-store'}});
 }catch{
  return Response.json({ok:false,error:'Delivery overview unavailable'},{status:503});
 }
}
