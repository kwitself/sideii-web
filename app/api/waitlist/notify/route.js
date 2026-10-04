import {createClient} from '@supabase/supabase-js';

export async function POST(request){
 try{
  const auth=request.headers.get('authorization')||'';
  const {variant_id}=await request.json();
  const apiKey=process.env.RESEND_API_KEY;
  if(!apiKey)return Response.json({ok:true,sent:0,reason:'email_provider_not_configured'});

  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)return Response.json({ok:false,error:'Store email service unavailable'},{status:503});

  const sb=createClient(url,key,{global:{headers:{Authorization:auth}},auth:{persistSession:false}});
  const {data,error}=await sb.rpc('admin_get_waitlist_pending',{p_variant_id:variant_id});
  if(error)return Response.json({ok:false,error:error.message},{status:403});

  const rows=Array.isArray(data)?data:[];
  if(!rows.length)return Response.json({ok:true,sent:0});

  const from=process.env.SIDEII_ORDER_FROM||'SIDE:II Store <onboarding@resend.dev>';
  const sentIds=[];

  for(const row of rows){
    const text=[
      'BACK IN STOCK',
      '',
      String(row.title||'SIDE:II').toUpperCase(),
      String(row.format||'').toUpperCase()+' · '+String(row.sku||''),
      '',
      'The edition you asked about is available again.',
      'Visit the SIDE:II store to order while stock lasts.'
    ].join('\n');

    const res=await fetch('https://api.resend.com/emails',{
      method:'POST',
      headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},
      body:JSON.stringify({
        from,to:[row.email],
        subject:'Back in stock · '+row.title,
        text
      })
    });
    if(res.ok)sentIds.push(row.id);
  }

  if(sentIds.length){
    await sb.rpc('admin_mark_waitlist_notified',{p_ids:sentIds});
  }
  return Response.json({ok:true,sent:sentIds.length,pending:rows.length-sentIds.length});
 }catch(error){
  return Response.json({ok:false,error:String(error?.message||error)},{status:400});
 }
}
