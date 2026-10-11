'use client';
import {useMemo,useState} from 'react';
import {EMAIL_EVENTS,EMAIL_DEMOS,EMAIL_FIELDS,premiumEmailHtml} from '../lib/premiumEmailTemplates';

const labels={orderNumber:'ORDER REFERENCE',productName:'EDITION / PRODUCT',format:'FORMAT / STATUS',total:'ORDER TOTAL',trackingNumber:'TRACKING NUMBER',downloadLimit:'DOWNLOAD LIMIT',update:'PRE-ORDER UPDATE',refundStatus:'REFUND STATUS',refundAmount:'REFUND AMOUNT',recipient:'ACCOUNT EMAIL'};
export default function EmailStudio(){
 const [event,setEvent]=useState('order_created');
 const [overrides,setOverrides]=useState({});
 const details={...EMAIL_DEMOS[event],...(overrides[event]||{})};
 const html=useMemo(()=>premiumEmailHtml(event,details),[event,JSON.stringify(details)]);
 const edit=(key,value)=>setOverrides(previous=>({...previous,[event]:{...(previous[event]||{}),[key]:value}}));
 return <section className="adminSection emailStudio"><div className="sectionLabel"><span>PREMIUM EMAIL STUDIO / V2</span><p>Event-specific layouts and content · preview only, no outgoing mail.</p></div>
 <div className="emailStudioBanner"><b>PREVIEW ONLY</b><span>All examples are synthetic. Secure action links and real email delivery remain disabled until launch integrations are verified.</span></div>
 <div className="emailStudioControls">
 <label>EMAIL EVENT<select value={event} onChange={e=>setEvent(e.target.value)}>{EMAIL_EVENTS.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
 {(EMAIL_FIELDS[event]||[]).map(field=><label key={event+field}>{labels[field]||field}<input value={details[field]||''} onChange={e=>edit(field,e.target.value)} maxLength={field==='update'?400:120}/></label>)}
 </div>
 <div className="emailStudioActions"><button type="button" onClick={()=>{const b=new Blob([html],{type:'text/html;charset=utf-8'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='sideii-'+event+'-preview.html';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}}>DOWNLOAD HTML PREVIEW ↓</button><span>{event==='password_reset'?'Password reset preview intentionally contains no order data or dummy reset link.':'No customer messages will be sent.'}</span></div>
 <iframe key={event} title={EMAIL_EVENTS.find(x=>x[0]===event)?.[1]+' email preview'} className="emailStudioFrame" sandbox="" srcDoc={html}/>
 </section>;
}