import {createClient} from '@supabase/supabase-js';

export async function POST(request){
 try{
  const {order_id,email,type='received'}=await request.json();
  const apiKey=process.env.RESEND_API_KEY;
  if(!apiKey)return Response.json({ok:true,email_sent:false,reason:'email_provider_not_configured'});

  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)return Response.json({ok:false,error:'Store email service unavailable'},{status:503});

  const sb=createClient(url,key,{auth:{persistSession:false}});
  const {data:payload,error}=await sb.rpc('claim_order_email',{
   p_order_id:order_id,p_email:email,p_type:type
  });
  if(error)return Response.json({ok:false,error:error.message},{status:400});
  if(!payload)return Response.json({ok:true,email_sent:false,reason:'already_sent_or_not_found'});

  const items=(payload.items||[]).map(x=>{
   const download=x.download_url?'\nDownload: '+x.download_url:'';
   return `${x.title} · ${x.format} · QTY ${x.quantity}${download}`;
  }).join('\n');

  const labels={
   received:'ORDER RECEIVED',
   paid:'PAYMENT CONFIRMED',
   preparing:'ORDER PREPARING',
   shipped:'ORDER SHIPPED',
   completed:'ORDER COMPLETED'
  };
  const heading=labels[payload.type]||'ORDER UPDATE';
  const tracking=payload.tracking_number?\`\nCarrier: ${payload.shipping_carrier||'—'}\nTracking: ${payload.tracking_number}\`:'';
  const text=[
   heading,
   '',
   'SIDE:II order #SII-'+String(payload.order_no).padStart(4,'0'),
   'Status: '+String(payload.status||'').toUpperCase(),
   'Payment: '+String(payload.payment_status||'').toUpperCase(),
   tracking,
   '',
   items,
   '',
   'Total: ₺'+Number(payload.total||0).toLocaleString('tr-TR')
  ].join('\n');

  const from=process.env.SIDEII_ORDER_FROM||'SIDE:II Store <onboarding@resend.dev>';
  const res=await fetch('https://api.resend.com/emails',{
   method:'POST',
   headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},
   body:JSON.stringify({
    from,to:[payload.email],
    subject:heading+' · #SII-'+String(payload.order_no).padStart(4,'0'),
    text
   })
  });

  if(!res.ok)return Response.json({ok:false,email_sent:false,detail:await res.text()},{status:502});
  return Response.json({ok:true,email_sent:true});
 }catch(error){
  return Response.json({ok:false,error:String(error?.message||error)},{status:400});
 }
}
