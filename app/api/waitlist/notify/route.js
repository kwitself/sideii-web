import {createClient} from '@supabase/supabase-js';

export async function POST(request){
 try{
  const auth=request.headers.get('authorization')||'';
  if(!auth.startsWith('Bearer '))return Response.json({ok:false,error:'Unauthorized'},{status:401});
  const {variant_id}=await request.json();
  if(typeof variant_id!=='string'||!/^[0-9a-f-]{36}$/i.test(variant_id))return Response.json({ok:false,error:'Valid variant_id required'},{status:400});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secret=process.env.SUPABASE_SECRET_KEY;
  if(!url||!key||!secret)return Response.json({ok:false,error:'Notification service unavailable'},{status:503});
  const client=createClient(url,key,{global:{headers:{Authorization:auth}},auth:{persistSession:false}});
  const {data:user,error:userError}=await client.auth.getUser();
  if(userError||!user?.user)return Response.json({ok:false,error:'Unauthorized'},{status:401});
  if(user.user.app_metadata?.role!=='admin')return Response.json({ok:false,error:'Admin access required'},{status:403});
  const apiKey=process.env.RESEND_API_KEY;
  if(!apiKey)return Response.json({ok:true,sent:0,reason:'email_provider_not_configured'});
  const server=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await server.rpc('claim_stock_waitlist_for_variant',{p_variant_id:variant_id,p_limit:20});
  if(error)return Response.json({ok:false,error:error.message},{status:400});
  const rows=Array.isArray(data)?data:[];
  const from=process.env.SIDEII_ORDER_FROM||'SIDE:II Store <onboarding@resend.dev>';
  let sent=0,failed=0;
  for(const row of rows){
   const message=['BACK IN STOCK','',String(row.title||'SIDE:II').toUpperCase(),
    String(row.format||'').toUpperCase()+' · '+String(row.sku||''),
    '','The edition you asked about is available again.','Visit the SIDE:II store to order while stock lasts.'].join('\n');
   let delivered=false,errorText='';
   try{
    const res=await fetch('https://api.resend.com/emails',{method:'POST',signal:AbortSignal.timeout(15000),headers:{
     Authorization:'Bearer '+apiKey,'Content-Type':'application/json',
     'Idempotency-Key':'sideii-stock-'+row.id
    },body:JSON.stringify({from,to:[row.email],subject:'Back in stock · '+row.title,text:message})});
    delivered=res.ok;
    if(!res.ok)errorText='Provider status '+res.status;
   }catch(e){errorText=String(e?.message||e).slice(0,200)}
   const {data:acked,error:ackError}=await server.rpc('complete_stock_waitlist_notification',{
    p_id:row.id,p_claim_token:row.claim_token,p_delivered:delivered,p_error:errorText||null
   });
   if(delivered&&acked&&!ackError)sent++;
   else failed++;
  }
  return Response.json({ok:true,sent,failed,pending:Math.max(0,rows.length-sent)});
 }catch(error){return Response.json({ok:false,error:String(error?.message||error)},{status:400})}
}
