import {createClient} from '@supabase/supabase-js';

export async function POST(request){
 try{
  const auth=request.headers.get('authorization')||'';
  if(!auth.startsWith('Bearer '))return Response.json({ok:false,error:'Unauthorized'},{status:401});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishable=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secret=process.env.SUPABASE_SECRET_KEY;
  const resend=process.env.RESEND_API_KEY;
  if(!url||!publishable||!secret)return Response.json({ok:false,error:'Recovery service unavailable'},{status:503});

  const userClient=createClient(url,publishable,{global:{headers:{Authorization:auth}},auth:{persistSession:false}});
  const {data:userData,error:userError}=await userClient.auth.getUser();
  if(userError||userData?.user?.app_metadata?.role!=='admin')return Response.json({ok:false,error:'Admin access required'},{status:403});
  if(!resend)return Response.json({ok:true,sent:0,reason:'email_provider_not_configured'});

  const server=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await server.rpc('claim_cart_recovery_batch',{p_limit:20});
  if(error)return Response.json({ok:false,error:error.message},{status:400});
  const rows=Array.isArray(data)?data:[];
  const base=(process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000').replace(/\/$/,'');
  const from=process.env.SIDEII_ORDER_FROM||'SIDE:II Store <onboarding@resend.dev>';
  let sent=0;
  for(const row of rows){
   const items=Array.isArray(row.cart)?row.cart:[];
   const names=items.slice(0,4).map(x=>String(x.title||x.sku||'SIDE:II object')).join(', ');
   const link=base+'/recover/'+row.token;
   const text=['YOUR BAG IS STILL HERE','',names||'SIDE:II objects','','Return to your saved bag:',link,'','Stock and reservations are not guaranteed until an order is placed.','','Stop recovery reminders:',link+'?unsubscribe=1'].join('\n');
   const res=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+resend,'Content-Type':'application/json'},body:JSON.stringify({from,to:[row.email],subject:'Your SIDE:II bag is still here',text})});
   if(res.ok){sent++;await server.rpc('mark_cart_recovery_reminded',{p_token:row.token})}
  }
  return Response.json({ok:true,sent,pending:Math.max(0,rows.length-sent)});
 }catch(error){return Response.json({ok:false,error:String(error?.message||error)},{status:400})}
}
