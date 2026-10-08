export async function sendOrderEmailPayload(payload){
 const apiKey=process.env.RESEND_API_KEY;
 if(!apiKey)return {ok:true,email_sent:false,reason:'email_provider_not_configured'};

 const guestPortal=payload.guest_portal_token
  ? String(process.env.NEXT_PUBLIC_SITE_URL||'').replace(/\/$/,'')+'/order#'+encodeURIComponent(String(payload.guest_portal_token))
  : '';
 const items=(payload.items||[]).map(function(x){
  const download=x.download_available
   ? (guestPortal?' · DIGITAL DOWNLOAD AVAILABLE IN YOUR PRIVATE ORDER LINK':' · DIGITAL DOWNLOAD AVAILABLE IN YOUR ACCOUNT')
   : '';
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
  'Total: ₺'+Number(payload.total||0).toLocaleString('tr-TR'),
  guestPortal?'':'',
  guestPortal?'Manage this order: '+guestPortal:''
 ].filter(Boolean).join('\n');

 const from=process.env.SIDEII_ORDER_FROM||'SIDE:II Store <onboarding@resend.dev>';
 const res=await fetch('https://api.resend.com/emails',{
  method:'POST',
  headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},
  body:JSON.stringify({
   from,
   to:[payload.email],
   subject:heading+' · #SII-'+String(payload.order_no).padStart(4,'0'),
   text:message
  })
 });

 if(!res.ok)return {ok:false,email_sent:false,detail:await res.text(),status:502};
 return {ok:true,email_sent:true};
}
