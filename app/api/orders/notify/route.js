import {createClient} from '@supabase/supabase-js';

export async function POST(request){
 try{
  const body=await request.json();
  const order_id=body.order_id;
  const email=body.email;
  const type=String(body.type||'received').toLowerCase();
  const allowedTypes=new Set(['received','paid','preparing','shipped','completed']);
  if(!allowedTypes.has(type))return Response.json({ok:false,error:'Invalid notification type'},{status:400});

  const apiKey=process.env.RESEND_API_KEY;
  if(!apiKey){
   return Response.json({ok:true,email_sent:false,reason:'email_provider_not_configured'});
  }

  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key){
   return Response.json({ok:false,error:'Store email service unavailable'},{status:503});
  }

  const sb=createClient(url,key,{auth:{persistSession:false}});
  const claimed=await sb.rpc('claim_order_email',{
   p_order_id:order_id,
   p_email:email,
   p_type:type
  });

  if(claimed.error){
   return Response.json({ok:false,error:claimed.error.message},{status:400});
  }

  const payload=claimed.data;
  if(!payload){
   return Response.json({ok:true,email_sent:false,reason:'already_sent_or_not_found'});
  }

  const items=(payload.items||[]).map(function(x){
   const download=x.download_available?' · DIGITAL DOWNLOAD AVAILABLE IN YOUR ACCOUNT':'';
   return String(x.title||'')+' · '+String(x.format||'')+' · QTY '+String(x.quantity||0)+download;
  }).join('\n');

  const labels={
   received:'ORDER RECEIVED',
   paid:'PAYMENT CONFIRMED',
   preparing:'ORDER PREPARING',
   shipped:'ORDER SHIPPED',
   completed:'ORDER COMPLETED'
  };

  const heading=labels[payload.type]||'ORDER UPDATE';
  const tracking=payload.tracking_number
   ? '\nCarrier: '+String(payload.shipping_carrier||'—')+'\nTracking: '+String(payload.tracking_number)
   : '';

  const message=[
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
   headers:{
    Authorization:'Bearer '+apiKey,
    'Content-Type':'application/json'
   },
   body:JSON.stringify({
    from:from,
    to:[payload.email],
    subject:heading+' · #SII-'+String(payload.order_no).padStart(4,'0'),
    text:message
   })
  });

  if(!res.ok){
   return Response.json({ok:false,email_sent:false,detail:await res.text()},{status:502});
  }

  return Response.json({ok:true,email_sent:true});
 }catch(error){
  return Response.json({ok:false,error:String(error&&error.message?error.message:error)},{status:400});
 }
}
