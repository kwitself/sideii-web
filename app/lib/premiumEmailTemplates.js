export const EMAIL_EVENTS=[
 ['order_created','ORDER RECEIVED','Your order is in our system.'],
 ['payment_confirmed','PAYMENT CONFIRMED','Your payment has been confirmed.'],
 ['preparing','PREPARING YOUR EDITION','We are preparing your selection.'],
 ['shipped','YOUR ORDER HAS SHIPPED','Your edition is on its way.'],
 ['digital_ready','YOUR DIGITAL EDITION','Your download is ready in your account.'],
 ['preorder_update','PRE-ORDER UPDATE','An update about your pre-order.'],
 ['cancelled','ORDER CANCELLED','Your order has been cancelled.'],
 ['refund_update','REFUND UPDATE','An update about your refund request.'],
 ['back_in_stock','BACK IN STOCK','An edition you followed is available again.'],
 ['password_reset','ACCOUNT SECURITY','Use the secure link to reset your password.']
];
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function premiumEmailHtml(event='order_created',details={}){
 const info=EMAIL_EVENTS.find(x=>x[0]===event)||EMAIL_EVENTS[0];
 const order=esc(details.orderNumber||'SII-0001');
 const title=esc(details.productName||'Vinyl Edition');
 const format=esc(details.format||'12” LP · BLACK · QTY 1');
 const amount=esc(details.total||'₺699');
 const brandUrl=details.siteUrl&&/^https:\/\/[^\s"'<>]+$/i.test(details.siteUrl)?details.siteUrl.replace(/\/$/,''):null;
 const path=event==='digital_ready'?'/account':event==='password_reset'?'/account':'/account';
 const link=brandUrl?brandUrl+path:null;
 const action=event==='digital_ready'?'OPEN DOWNLOADS':event==='password_reset'?'OPEN ACCOUNT':'VIEW YOUR ORDER';
 const button=link?`<a href="${esc(link)}" style="display:block;text-align:center;padding:17px;background:#e6e1da;color:#141414;text-decoration:none;font:700 11px Arial,sans-serif;letter-spacing:2px">${action} →</a>`:`<div style="padding:17px;border:1px solid #5b5754;text-align:center;color:#c9c4be;font:11px Arial,sans-serif;letter-spacing:2px">ACTION LINK WILL BE ADDED AT LAUNCH</div>`;
 return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:32px 12px;background:#090909;color:#e6e1da;font-family:Arial,sans-serif"><div style="max-width:600px;margin:0 auto;background:#121212;border:1px solid #333;padding:32px 27px"><table role="presentation" style="width:100%;border-collapse:collapse"><tr><td style="font:bold 23px Georgia,serif;letter-spacing:-1px;color:#ece7e0">SIDE:II</td><td style="text-align:right;color:#99928e;font-size:10px;letter-spacing:1.6px">${esc(info[1])}</td></tr></table><div style="height:1px;background:#383838;margin:24px 0 33px"></div><p style="font-size:10px;letter-spacing:2px;color:#aaa39e;margin:0 0 14px">SIDE:II / INDEPENDENT EDITIONS</p><h1 style="font:normal 35px/1.1 Georgia,serif;letter-spacing:-1px;color:#f0ebe5;margin:0 0 18px">${esc(info[1].replace(/\b\w/g,c=>c.toUpperCase()).toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()))}.</h1><p style="font:15px/1.7 Georgia,serif;color:#c6beb7;margin:0 0 30px">${esc(info[2])} We'll keep you informed as your order progresses.</p><div style="border:1px solid #424242;padding:22px;margin-bottom:22px"><table role="presentation" style="width:100%;border-collapse:collapse"><tr><td style="font-size:10px;letter-spacing:1.5px;color:#aaa29c">ORDER</td><td style="text-align:right;color:#ede6df;font-size:12px">#${order}</td></tr></table><div style="height:1px;background:#343434;margin:18px 0"></div><p style="font:17px Georgia,serif;margin:0 0 8px">${title}</p><p style="font-size:11px;letter-spacing:1px;color:#aaa19d;margin:0 0 18px">${format}</p><div style="height:1px;background:#343434;margin-bottom:17px"></div><table role="presentation" style="width:100%"><tr><td style="font-size:11px;letter-spacing:1px;color:#b5aeaa">TOTAL</td><td style="text-align:right;font:22px Georgia,serif;color:#eee7df">${amount}</td></tr></table></div>${button}<p style="font:11px/1.7 Arial,sans-serif;color:#9e9892;margin:28px 0 0">This is a transactional email from SIDE:II. If you did not request this action, please contact support using our official website.</p></div><div style="max-width:600px;margin:17px auto;color:#8c8682;text-align:center;font-size:10px;letter-spacing:1px">SIDE:II · THE OTHER SIDE OF SOUND · © 2026</div></body></html>`;
}
