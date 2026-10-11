'use client';
import {useEffect,useMemo,useState} from 'react';
import {supabase} from '../lib/supabase';
import {EMAIL_EVENTS,EMAIL_DEMOS,EMAIL_FIELDS,premiumEmailHtml} from '../lib/premiumEmailTemplates';

const labels={orderNumber:'ORDER REFERENCE',productName:'EDITION / PRODUCT',format:'FORMAT / STATUS',total:'ORDER TOTAL',trackingNumber:'TRACKING NUMBER',downloadLimit:'DOWNLOAD LIMIT',update:'PRE-ORDER UPDATE',refundStatus:'REFUND STATUS',refundAmount:'REFUND AMOUNT',recipient:'ACCOUNT EMAIL'};
export default function EmailStudio(){
 const [event,setEvent]=useState('order_created');
 const [orders,setOrders]=useState([]),[selectedOrder,setSelectedOrder]=useState('');
 const [queue,setQueue]=useState([]),[queueNotice,setQueueNotice]=useState(''),[queueBusy,setQueueBusy]=useState(false);
 const loadQueue=async()=>{if(!supabase)return;const [{data:orderData},{data:queueData,error}]=await Promise.all([
 supabase.from('orders').select('id,order_no,email,status,payment_status').order('created_at',{ascending:false}).limit(30),
 supabase.rpc('admin_list_email_queue')
 ]);setOrders(orderData||[]);if(error)setQueueNotice(error.message);else setQueue(queueData||[])};
 useEffect(()=>{loadQueue()},[]);
 const createPreview=async()=>{if(!selectedOrder||!supabase)return;setQueueBusy(true);setQueueNotice('');
 const {data,error}=await supabase.rpc('admin_preview_email_queue',{p_order_id:selectedOrder,p_event:event});
 if(error)setQueueNotice(error.message);else setQueueNotice(data?.[0]?.inserted?'Preview event queued. No email sent.':'This order/event is already in the preview queue.');
 await loadQueue();setQueueBusy(false);
 };
 const [overrides,setOverrides]=useState({});
 const [orderPreview,setOrderPreview]=useState(null),[orderError,setOrderError]=useState(''),[orderLoading,setOrderLoading]=useState(false);
 useEffect(()=>{let cancelled=false;setOrderPreview(null);setOrderError('');
 if(!selectedOrder||!supabase)return;
 setOrderLoading(true);
 supabase.rpc('admin_email_order_preview',{p_order_id:selectedOrder}).then(({data,error})=>{
 if(cancelled)return;if(error)setOrderError(error.message);else setOrderPreview(data);
 setOrderLoading(false);
 });
 return()=>{cancelled=true};
 },[selectedOrder]);
 const formatMoney=(value,currency)=>{try{return new Intl.NumberFormat('tr-TR',{style:'currency',currency:currency||'TRY'}).format(Number(value)||0)}catch{return String(value??'')}};
 const first=orderPreview?.items?.[0];
 const actual=orderPreview?{
 orderNumber:orderPreview.orderNumber,
 productName:(orderPreview.items||[]).map(i=>i.title+(Number(i.quantity)>1?' ×'+i.quantity:'')).join(' / ')||'Order items unavailable',
 format:(orderPreview.items||[]).map(i=>i.format||'EDITION').join(' · ')||'EDITION',
 total:formatMoney(orderPreview.total,orderPreview.currency),
 recipient:orderPreview.recipient||'',
 trackingNumber:orderPreview.trackingNumber||'Not assigned',
 downloadLimit:first?.digitalDownloadLimit?String(first.digitalDownloadLimit)+' DOWNLOADS':'Not assigned',
 refundStatus:'NOT VERIFIED · '+String(orderPreview.paymentStatus||'unknown').toUpperCase(),
 refundAmount:formatMoney(orderPreview.total,orderPreview.currency)
 }:null;
 const details={...(actual||EMAIL_DEMOS[event]),...(overrides[event]||{})};
 const previewMode=actual?'REAL QA ORDER / NO EMAIL SENT':'DEMO DATA / NO EMAIL SENT';
 const html=useMemo(()=>premiumEmailHtml(event,details),[event,JSON.stringify(details)]);
 const edit=(key,value)=>setOverrides(previous=>({...previous,[event]:{...(previous[event]||{}),[key]:value}}));
 return <section className="adminSection emailStudio"><div className="sectionLabel"><span>PREMIUM EMAIL STUDIO / V2</span><p>Event-specific layouts and content · preview only, no outgoing mail.</p></div>
 <div className="emailStudioBanner"><b>PREVIEW ONLY</b><span>Selected order previews use real QA order data; without a selected order, examples are synthetic. Secure action links and real email delivery remain disabled.</span></div>
 <p role="status" className="emailStudioDataState">{orderLoading?'Loading selected order…':orderError?'Order data unavailable: '+orderError:previewMode}</p>
 <div className="emailStudioControls">
 <label>EMAIL EVENT<select value={event} onChange={e=>setEvent(e.target.value)}>{EMAIL_EVENTS.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
 {(EMAIL_FIELDS[event]||[]).map(field=><label key={event+field}>{labels[field]||field}<input value={details[field]||''} onChange={e=>edit(field,e.target.value)} maxLength={field==='update'?400:120}/></label>)}
 </div>
 <div className="emailStudioActions"><button type="button" onClick={()=>{const b=new Blob([html],{type:'text/html;charset=utf-8'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='sideii-'+event+'-preview.html';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}}>DOWNLOAD HTML PREVIEW ↓</button><span>{event==='password_reset'?'Password reset preview intentionally contains no order data or dummy reset link.':'No customer messages will be sent.'}</span></div>
 <section className="emailQueuePanel"><h3>03 / DELIVERY QUEUE · SIMULATION</h3><p>Admin-only. Unique order/event entries. No outgoing emails are sent.</p><div className="emailQueueCreate"><select aria-label="Select QA order" value={selectedOrder} onChange={e=>{setSelectedOrder(e.target.value);setOverrides({});}}><option value="">SELECT TEST ORDER</option>{orders.map(o=><option key={o.id} value={o.id}>SII-{String(o.order_no).padStart(4,'0')} · {o.status}</option>)}</select><button type="button" disabled={!selectedOrder||!orderPreview||queueBusy||!['order_created','preparing','shipped','digital_ready','preorder_update','cancelled','refund_update'].includes(event)} onClick={createPreview}>{queueBusy?'SAVING…':'QUEUE PREVIEW EVENT'}</button><button type="button" onClick={loadQueue}>REFRESH</button></div>{queueNotice&&<p role="status">{queueNotice}</p>}<div className="emailQueueList"><div><b>EVENT</b><b>ORDER</b><b>STATUS</b></div>{queue.map(q=><div key={q.id}><span>{q.event_type}</span><span>{orders.find(o=>o.id===q.order_id)?'SII-'+String(orders.find(o=>o.id===q.order_id)?.order_no).padStart(4,'0'):'—'}</span><strong>{q.status}</strong></div>)}{!queue.length&&<p>No queued preview events yet.</p>}</div></section>
 <iframe key={event+'-'+selectedOrder} title={EMAIL_EVENTS.find(x=>x[0]===event)?.[1]+' email preview'} className="emailStudioFrame" sandbox="" srcDoc={html}/>
 </section>;
}