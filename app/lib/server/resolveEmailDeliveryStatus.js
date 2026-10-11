const PRIORITY={'email.complained':90,'email.bounced':80,'email.failed':70,'email.delivered':60,'email.delivery_delayed':40,'email.sent':20};
export function resolveEmailDeliveryStatus(events){
 const ordered=(events||[]).filter(e=>typeof e?.event_type==='string').sort((a,b)=>{
  const pa=PRIORITY[a.event_type]||0,pb=PRIORITY[b.event_type]||0;
  return pb-pa||Date.parse(b.received_at||0)-Date.parse(a.received_at||0);
 });
 return ordered[0]?.event_type||null;
}
