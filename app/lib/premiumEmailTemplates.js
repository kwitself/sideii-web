export const EMAIL_EVENTS=[
 ['order_created','ORDER RECEIVED','Your order has been received.'],
 ['payment_confirmed','PAYMENT CONFIRMED','Your payment is confirmed.'],
 ['preparing','PREPARING YOUR EDITION','Your physical edition is being prepared.'],
 ['shipped','YOUR ORDER HAS SHIPPED','Your parcel is on its way.'],
 ['digital_ready','YOUR DIGITAL EDITION','Your purchased files are ready.'],
 ['preorder_update','PRE-ORDER UPDATE','Your pre-order has an update.'],
 ['cancelled','ORDER CANCELLED','Your order has been cancelled.'],
 ['refund_update','REFUND UPDATE','An update on your refund request.'],
 ['back_in_stock','BACK IN STOCK','An edition you followed has returned.'],
 ['password_reset','ACCOUNT SECURITY','Your password reset was requested.']
];
export const EMAIL_DEMOS={
 order_created:{orderNumber:'SII-0042',productName:'Selected Vinyl Edition',format:'12″ LP · BLACK · QTY 1',total:'₺699'},
 payment_confirmed:{orderNumber:'SII-0042',productName:'Selected Vinyl Edition',format:'PAID · CARD PAYMENT',total:'₺699'},
 preparing:{orderNumber:'SII-0042',productName:'Selected Vinyl Edition',format:'PREPARING · PHYSICAL EDITION',total:'₺699'},
 shipped:{orderNumber:'SII-0042',productName:'Selected Vinyl Edition',format:'SHIPPED · TRACKING PENDING',trackingNumber:'QA-TRACK-001'},
 digital_ready:{orderNumber:'SII-0043',productName:'Selected Digital Edition',format:'WAV · FLAC · MP3',downloadLimit:'5 DOWNLOADS'},
 preorder_update:{orderNumber:'SII-0044',productName:'Limited Vinyl Pre-order',format:'PRE-ORDER · PRODUCTION UPDATE',update:'Production is progressing. We will confirm the dispatch date when it is available.'},
 cancelled:{orderNumber:'SII-0042',productName:'Selected Vinyl Edition',format:'ORDER CANCELLED'},
 refund_update:{orderNumber:'SII-0042',refundStatus:'REQUEST UNDER REVIEW',refundAmount:'₺699'},
 back_in_stock:{productName:'Limited Vinyl Edition',format:'12″ LP · NEW STOCK AVAILABLE'},
 password_reset:{recipient:'listener@example.com'}
};
export const EMAIL_FIELDS={
 order_created:['orderNumber','productName','format','total'],
 payment_confirmed:['orderNumber','productName','format','total'],
 preparing:['orderNumber','productName','format'],
 shipped:['orderNumber','productName','trackingNumber'],
 digital_ready:['orderNumber','productName','format','downloadLimit'],
 preorder_update:['orderNumber','productName','update'],
 cancelled:['orderNumber','productName'],
 refund_update:['orderNumber','refundStatus','refundAmount'],
 back_in_stock:['productName','format'],
 password_reset:['recipient']
};
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const row=(label,value)=>value?'<tr><td style="padding:9px 0;color:#aaa39d;font:10px Arial,sans-serif;letter-spacing:1.2px">'+esc(label)+'</td><td style="padding:9px 0;text-align:right;color:#eae5df;font:13px Georgia,serif">'+esc(value)+'</td></tr>':'';
function panel(rows){return '<table role="presentation" style="width:100%;border-collapse:collapse;border:1px solid #454545;padding:16px"><tbody>'+rows+'</tbody></table>';}
export function premiumEmailHtml(event='order_created',details={}){
 const type=EMAIL_EVENTS.some(x=>x[0]===event)?event:'order_created';
 const d={...EMAIL_DEMOS[type],...details};
 const title=EMAIL_EVENTS.find(x=>x[0]===type)[1];
 const copy={
 order_created:'We have received your order. You can review its details while payment and fulfilment are processed.',
 payment_confirmed:'Your payment has been confirmed. Your receipt and order details are available in your account.',
 preparing:'Your physical edition is being carefully prepared. We will notify you when it ships.',
 shipped:'Your parcel has left our studio. Tracking information appears below when available.',
 digital_ready:'Your digital edition is ready. Open your account to access your secure download entitlement.',
 preorder_update:'An update from the studio about your reserved edition.',
 cancelled:'Your order is cancelled. If a payment was collected, any applicable refund will be handled separately.',
 refund_update:'Here is the latest status of your refund request. This message does not confirm money has been returned unless the status says so.',
 back_in_stock:'An edition you followed is available again. Quantities may be limited.',
 password_reset:'A password reset was requested for this account. Only follow a verified, time-limited reset link when one is included. If this was not you, you can ignore this email.'
 }[type];
 let rows='';
 if(['order_created','payment_confirmed','preparing','shipped','digital_ready','preorder_update','cancelled'].includes(type)){
 rows+=row('ORDER','#'+String(d.orderNumber||'').replace(/^#/,''));
 rows+=row('EDITION',d.productName);
 if(type!=='shipped')rows+=row('FORMAT / STATUS',d.format);
 if(['order_created','payment_confirmed'].includes(type))rows+=row('TOTAL',d.total);
 if(type==='shipped')rows+=row('TRACKING NUMBER',d.trackingNumber);
 if(type==='digital_ready')rows+=row('DOWNLOAD ENTITLEMENT',d.downloadLimit);
 if(type==='preorder_update')rows+=row('PRODUCTION NOTE',d.update);
 }
 if(type==='refund_update'){rows+=row('ORDER','#'+String(d.orderNumber||'').replace(/^#/,''));rows+=row('REFUND STATUS',d.refundStatus);rows+=row('AMOUNT',d.refundAmount);}
 if(type==='back_in_stock'){rows+=row('EDITION',d.productName);rows+=row('AVAILABILITY',d.format);}
 if(type==='password_reset')rows+=row('ACCOUNT',d.recipient);
 const cta={
 order_created:['VIEW YOUR ORDER','/account'],payment_confirmed:['VIEW YOUR ORDER','/account'],preparing:['TRACK ORDER STATUS','/account'],shipped:['VIEW TRACKING','/account'],digital_ready:['OPEN DOWNLOADS','/account'],preorder_update:['VIEW PRE-ORDER','/account'],cancelled:['VIEW ORDER','/account'],refund_update:['VIEW REQUEST','/account'],back_in_stock:['VIEW EDITION','/store'],password_reset:['RESET PASSWORD',null]
 }[type];
 // Never invent an account-reset URL. A real reset token URL must be provided explicitly by the auth system.
 const validUrl=(url)=>typeof url==='string'&&/^https:\/\/[^ "'<>]+$/i.test(url);
 const explicit=type==='password_reset'?d.resetUrl:d.actionUrl;
 const root=validUrl(d.siteUrl)?d.siteUrl.replace(/\/$/,''):null;
 const href=validUrl(explicit)?explicit:(type!=='password_reset'&&root?root+cta[1]:null);
 const button=href?'<a href="'+esc(href)+'" style="display:block;background:#e6e0d8;color:#151515;padding:17px;text-align:center;text-decoration:none;font:bold 11px Arial,sans-serif;letter-spacing:1.8px">'+esc(cta[0])+' →</a>':'<div style="border:1px solid #555;padding:17px;text-align:center;color:#a7a29d;font:11px Arial,sans-serif;letter-spacing:1px">SECURE ACTION LINK NOT CONFIGURED · PREVIEW ONLY</div>';
 return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:28px 12px;background:#090909;color:#eee7e1"><div style="max-width:600px;margin:auto;padding:30px 26px;background:#121212;border:1px solid #383838"><table role="presentation" style="width:100%"><tr><td style="font:bold 24px Georgia,serif;color:#f0eae4">SIDE:II</td><td style="text-align:right;color:#b1a8a1;font:10px Arial,sans-serif;letter-spacing:1px">'+esc(title)+'</td></tr></table><div style="height:1px;background:#3a3a3a;margin:24px 0 30px"></div><p style="font:10px Arial,sans-serif;letter-spacing:1.5px;color:#aaa29d">SIDE:II / '+(type==='password_reset'?'ACCOUNT SERVICES':type==='back_in_stock'?'CATALOGUE UPDATES':'INDEPENDENT EDITIONS')+'</p><h1 style="font:normal 34px/1.1 Georgia,serif;color:#f4eee8;margin:18px 0">'+esc(title.replace(/\b\w/g,x=>x.toUpperCase()).toLowerCase().replace(/\b\w/g,x=>x.toUpperCase()))+'.'+'</h1><p style="font:15px/1.7 Georgia,serif;color:#c9c0b9;margin:0 0 25px">'+esc(copy)+'</p><div style="border:1px solid #454545;padding:17px 20px;margin:0 0 22px">'+panel(rows)+'</div>'+button+'<p style="margin:25px 0 0;font:11px/1.6 Arial,sans-serif;color:#a5a09a">'+(type==='password_reset'?'For your safety, SIDE:II will never ask for your password by email.':'This is a SIDE:II notification. For help, visit our official website.')+'</p></div><div style="text-align:center;margin:20px auto;color:#97918b;font:10px Arial,sans-serif;letter-spacing:1px">SIDE:II · THE OTHER SIDE OF SOUND · © 2026</div></body></html>';
}