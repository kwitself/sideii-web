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
  const body=await request.json().catch(()=>({}));
  const mode=['launch','gift','all'].includes(body?.mode)?body.mode:'all';
  const base=(process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000').replace(/\/$/,'');
  const from=process.env.SIDEII_ORDER_FROM||'SIDE:II Store <onboarding@resend.dev>';
  let launchSent=0,giftSent=0;

  if(mode==='launch'||mode==='all'){
   const {data,error}=await server.rpc('claim_due_launch_notifications',{p_limit:50});
   if(error)return Response.json({ok:false,error:error.message},{status:400});
   const ids=[];
   for(const row of Array.isArray(data)?data:[]){
    const href=base+(row.product_type==='merch'?'/store/':'/releases/')+row.slug;
    const text=['THE DROP IS LIVE','',String(row.title||'SIDE:II').toUpperCase(),'','The release you asked about is now available.',href].join('\n');
    const res=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+resend,'Content-Type':'application/json'},body:JSON.stringify({from,to:[row.email],subject:'Now live · '+row.title,text})});
    if(res.ok){ids.push(row.id);launchSent++}
   }
   if(ids.length)await server.rpc('mark_launch_notifications_sent',{p_ids:ids});
  }

  if(mode==='gift'||mode==='all'){
   const {data,error}=await server.rpc('claim_due_gift_notifications',{p_limit:50});
   if(error)return Response.json({ok:false,error:error.message},{status:400});
   const ids=[];
   for(const row of Array.isArray(data)?data:[]){
    const giftUrl=base+'/gift/'+row.gift_public_token;
    const text=['A SIDE:II GIFT FOR YOU','','Order #SII-'+String(row.order_no).padStart(4,'0'),row.gift_message?String(row.gift_message):'A gift has been prepared for you.','','Open your gift:',giftUrl,'','Sent through SIDE:II.'].filter(Boolean).join('\n');
    const res=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+resend,'Content-Type':'application/json'},body:JSON.stringify({from,to:[row.recipient_email],subject:'A SIDE:II gift for you',text})});
    if(res.ok){ids.push(row.order_id);giftSent++}
   }
   if(ids.length)await server.rpc('mark_gift_notifications_sent',{p_order_ids:ids});
  }
  return Response.json({ok:true,launch_sent:launchSent,gift_sent:giftSent,total:launchSent+giftSent});
 }catch(error){return Response.json({ok:false,error:String(error?.message||error)},{status:400})}
}
