import {createClient} from '@supabase/supabase-js';

export async function POST(request){
 try{
  const auth=request.headers.get('authorization')||'';
  if(!auth.startsWith('Bearer '))return Response.json({ok:false,error:'Unauthorized'},{status:401});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishable=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secret=process.env.SUPABASE_SECRET_KEY;
  const resend=process.env.RESEND_API_KEY;
  if(!url||!publishable||!secret)return Response.json({ok:false,error:'Lifecycle service unavailable'},{status:503});
  const userClient=createClient(url,publishable,{global:{headers:{Authorization:auth}},auth:{persistSession:false}});
  const {data:userData,error:userError}=await userClient.auth.getUser();
  if(userError||userData?.user?.app_metadata?.role!=='admin')return Response.json({ok:false,error:'Admin access required'},{status:403});
  if(!resend)return Response.json({ok:true,sent:0,reason:'email_provider_not_configured'});
  const server=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
  const recordAttempt=async(kind,reference_id,outcome,error_code=null)=>{
   const {error}=await server.from('commerce_notification_attempts').insert({kind,reference_id,outcome,error_code});
   if(error)console.error('Notification attempt audit unavailable');
  };
  const leaseHolder=crypto.randomUUID();
  const {data:leaseAcquired,error:leaseError}=await server.rpc('acquire_notification_runner_lease',{p_holder:leaseHolder});
  if(leaseError)return Response.json({ok:false,error:'Notification lease unavailable'},{status:503});
  if(!leaseAcquired)return Response.json({ok:false,error:'Notification runner already active'},{status:409});
  try{
  const body=await request.json().catch(()=>({}));
  const mode=['launch','gift','all'].includes(body?.mode)?body.mode:'all';
  const base=(process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000').replace(/\/$/,'');
  const from=process.env.SIDEII_ORDER_FROM||'SIDE:II Store <onboarding@resend.dev>';
  let launchSent=0,giftSent=0,launchFailed=0,giftFailed=0;

  if(mode==='launch'||mode==='all'){
   const {data,error}=await server.rpc('claim_due_launch_notifications',{p_limit:50});
   if(error)return Response.json({ok:false,error:error.message},{status:400});
   const ids=[];
   for(const row of Array.isArray(data)?data:[]){
    const href=base+(row.product_type==='merch'?'/store/':'/releases/')+row.slug;
    const text=['THE DROP IS LIVE','',String(row.title||'SIDE:II').toUpperCase(),'','The release you asked about is now available.',href].join('\n');
    try{
    const res=await fetch('https://api.resend.com/emails',{method:'POST',signal:AbortSignal.timeout(15000),headers:{Authorization:'Bearer '+resend,'Content-Type':'application/json','Idempotency-Key':'sideii-launch-'+row.id},body:JSON.stringify({from,to:[row.email],subject:'Now live · '+row.title,text})});
    if(res.ok){ids.push(row.id);launchSent++;await recordAttempt('launch',row.id,'sent')}else{launchFailed++;await recordAttempt('launch',row.id,'failed','http_'+res.status)}
    }catch{launchFailed++;await recordAttempt('launch',row.id,'failed','network_error')}

   }
   if(ids.length){
    const {error:markError}=await server.rpc('mark_launch_notifications_sent',{p_ids:ids});
    if(markError)return Response.json({ok:false,error:'Launch notifications sent but confirmation failed',launch_sent:launchSent,gift_sent:giftSent},{status:502});
   }
  }

  if(mode==='gift'||mode==='all'){
   const {data,error}=await server.rpc('claim_due_gift_notifications',{p_limit:50});
   if(error)return Response.json({ok:false,error:error.message},{status:400});
   const ids=[];
   for(const row of Array.isArray(data)?data:[]){
    const giftUrl=base+'/gift/'+row.gift_public_token;
    const text=['A SIDE:II GIFT FOR YOU','','Order #SII-'+String(row.order_no).padStart(4,'0'),row.gift_message?String(row.gift_message):'A gift has been prepared for you.','','Open your gift:',giftUrl,'','Sent through SIDE:II.'].filter(Boolean).join('\n');
    try{
    const res=await fetch('https://api.resend.com/emails',{method:'POST',signal:AbortSignal.timeout(15000),headers:{Authorization:'Bearer '+resend,'Content-Type':'application/json','Idempotency-Key':'sideii-gift-'+row.order_id},body:JSON.stringify({from,to:[row.recipient_email],subject:'A SIDE:II gift for you',text})});
    if(res.ok){ids.push(row.order_id);giftSent++;await recordAttempt('gift',row.order_id,'sent')}else{giftFailed++;await recordAttempt('gift',row.order_id,'failed','http_'+res.status)}
    }catch{giftFailed++;await recordAttempt('gift',row.order_id,'failed','network_error')}

   }
   if(ids.length){
    const {error:markError}=await server.rpc('mark_gift_notifications_sent',{p_order_ids:ids});
    if(markError)return Response.json({ok:false,error:'Gift notifications sent but confirmation failed',launch_sent:launchSent,gift_sent:giftSent},{status:502});
   }
  }
  const failed=launchFailed+giftFailed;
  return Response.json({ok:failed===0,launch_sent:launchSent,gift_sent:giftSent,launch_failed:launchFailed,gift_failed:giftFailed,total:launchSent+giftSent,failed},{status:failed?502:200});
  }finally{
    const {error:releaseError}=await server.rpc('release_notification_runner_lease',{p_holder:leaseHolder});
    if(releaseError)console.error('Notification lease release failed');
  }
 }catch(error){return Response.json({ok:false,error:String(error?.message||error)},{status:400})}
}
