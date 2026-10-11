'use client';
import {useMemo,useState} from 'react';
import {EMAIL_EVENTS,premiumEmailHtml} from '../lib/premiumEmailTemplates';

export default function EmailStudio(){
 const [event,setEvent]=useState('order_created');
 const [orderNumber,setOrderNumber]=useState('SII-0001');
 const [productName,setProductName]=useState('Vinyl Edition');
 const [total,setTotal]=useState('₺699');
 const html=useMemo(()=>premiumEmailHtml(event,{orderNumber,productName,total}),[event,orderNumber,productName,total]);
 return <section className="adminSection emailStudio"><div className="sectionLabel"><span>PREMIUM EMAIL STUDIO / V1</span><p>Safe preview mode · no outgoing messages, no customer records modified.</p></div>
 <div className="emailStudioBanner"><b>PREVIEW ONLY</b><span>Sending is disabled until a verified sender, provider and idempotent delivery workflow are configured.</span></div>
 <div className="emailStudioControls"><label>EMAIL EVENT<select value={event} onChange={e=>setEvent(e.target.value)}>{EMAIL_EVENTS.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label><label>ORDER REFERENCE<input value={orderNumber} onChange={e=>setOrderNumber(e.target.value)} maxLength={45}/></label><label>PRODUCT<input value={productName} onChange={e=>setProductName(e.target.value)} maxLength={110}/></label><label>TOTAL<input value={total} onChange={e=>setTotal(e.target.value)} maxLength={25}/></label></div>
 <div className="emailStudioActions"><button type="button" onClick={()=>{const b=new Blob([html],{type:'text/html;charset=utf-8'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='sideii-'+event+'-preview.html';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}}>DOWNLOAD HTML PREVIEW ↓</button><span>Customer delivery and live payment links remain disconnected.</span></div>
 <iframe title="Premium transactional email preview" className="emailStudioFrame" sandbox="" srcDoc={html}/>
 </section>;
}
