'use client';
import {useEffect,useMemo,useState} from 'react';
import {supabase} from '../lib/supabase';
import {EMAIL_EVENTS,EMAIL_DEMOS,EMAIL_FIELDS,premiumEmailHtml} from '../lib/premiumEmailTemplates';

const labels={orderNumber:'ORDER REFERENCE',productName:'EDITION / PRODUCT',format:'FORMAT / STATUS',total:'ORDER TOTAL',trackingNumber:'TRACKING NUMBER',downloadLimit:'DOWNLOAD LIMIT',update:'PRE-ORDER UPDATE',refundStatus:'REFUND STATUS',refundAmount:'REFUND AMOUNT',recipient:'ACCOUNT EMAIL'};
export default function EmailStudio(){
 const [event,setEvent]=useState('order_created');
 const [deliveryHealth,setDeliveryHealth]=useState(null);
 const [deliveryHealthError,setDeliveryHealthError]=useState('');
 const loadDeliveryHealth=async()=>{
  if(!supabase)return;
  const {data:{session}}=await supabase.auth.getSession();
  if(!session?.access_token){setDeliveryHealthError('Admin session unavailable');return;}
  try{
   const response=await fetch('/api/admin/notification-overview',{headers:{Authorization:'Bearer '+session.access_token},cache:'no-store'});
   const payload=await response.json();
   if(!response.ok||!payload.ok){setDeliveryHealthError(payload.error||'Overview unavailable');return;}
   setDeliveryHealth(payload);setDeliveryHealthError('');
  }catch{setDeliveryHealthError('Overview unavailable')}
 };
 useEffect(()=>{loadDeliveryHealth()},[]);

 const [orders,setOrders]=useState([]),[selectedOrder,setSelectedOrder]=useState('');
 const [selectedQueuedId,setSelectedQueuedId]=useState('');
 const [statusFilter,setStatusFilter]=useState('all');
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
 const simulate=async(id,action)=>{if(!supabase||queueBusy)return;setQueueBusy(true);setQueueNotice('');
 const {error}=await supabase.rpc('admin_email_queue_simulate',{p_id:id,p_action:action});
 if(error)setQueueNotice(error.message);else setQueueNotice('QA simulation updated. No delivery attempted.');
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
 const queuedEntry=queue.find(q=>q.id===selectedQueuedId);
 const viewOrder=queuedEntry ? (queuedEntry.payload?.items&&queuedEntry.payload?.total!=null?{...queuedEntry.payload,recipient:queuedEntry.recipient}:null) : orderPreview;
 const first=viewOrder?.items?.[0];
 const actual=viewOrder?{
 orderNumber:viewOrder.orderNumber,
 productName:(viewOrder.items||[]).map(i=>i.title+(Number(i.quantity)>1?' ×'+i.quantity:'')).join(' / ')||'Order items unavailable',
 format:(viewOrder.items||[]).map(i=>i.format||'EDITION').join(' · ')||'EDITION',
 total:formatMoney(viewOrder.total,viewOrder.currency),
 recipient:viewOrder.recipient||'',
 trackingNumber:viewOrder.trackingNumber||'Not assigned',
 downloadLimit:first?.digitalDownloadLimit?String(first.digitalDownloadLimit)+' DOWNLOADS':'Not assigned',
 refundStatus:'NOT VERIFIED · '+String(viewOrder.paymentStatus||'unknown').toUpperCase(),
 refundAmount:formatMoney(viewOrder.total,viewOrder.currency)
 }:null;
 const displayedEvent=queuedEntry?.event_type||event;
 const details={...(actual||(!queuedEntry?EMAIL_DEMOS[displayedEvent]:{})),...(!queuedEntry?(overrides[event]||{}):{})};
 const previewMode=queuedEntry?(actual?'QUEUED ORDER SNAPSHOT / NO EMAIL SENT':'OLDER QUEUE RECORD / DATA UNAVAILABLE'):actual?'REAL QA ORDER / NO EMAIL SENT':'DEMO DATA / NO EMAIL SENT';
 const html=useMemo(()=>premiumEmailHtml(displayedEvent,details),[displayedEvent,JSON.stringify(details)]);
 const edit=(key,value)=>setOverrides(previous=>({...previous,[event]:{...(previous[event]||{}),[key]:value}}));
 return <section className="adminSection emailStudio"><div className="sectionLabel"><span>PREMIUM EMAIL STUDIO / V3.3</span><p>Event-specific layouts and content · preview only, no outgoing mail.</p></div>
 <div className="emailStudioBanner"><b>PREVIEW ONLY</b><span>Selected order previews use real QA order data; without a selected order, examples are synthetic. Secure action links and real email delivery remain disabled.</span></div>
 <p role="status" className="emailStudioDataState">{orderLoading?'Loading selected order…':orderError?'Order data unavailable: '+orderError:previewMode}</p>
 <div className="emailStudioControls">
 <label>EMAIL EVENT<select value={event} onChange={e=>{setEvent(e.target.value);setSelectedQueuedId('');}}>{EMAIL_EVENTS.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
 {(EMAIL_FIELDS[event]||[]).map(field=><label key={event+field}>{labels[field]||field}<input value={details[field]||''} onChange={e=>edit(field,e.target.value)} maxLength={field==='update'?400:120}/></label>)}
 </div>
 <div className="emailStudioActions"><button type="button" onClick={()=>{const b=new Blob([html],{type:'text/html;charset=utf-8'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='sideii-'+event+'-preview.html';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}}>DOWNLOAD HTML PREVIEW ↓</button><span>{event==='password_reset'?'Password reset preview intentionally contains no order data or dummy reset link.':'No customer messages will be sent.'}</span></div>
 <section className="emailQueuePanel"><h3>LIVE NOTIFICATION HEALTH · READ ONLY</h3><p>Actual launch/gift notifications; separate from the QA preview queue. No sending actions here.</p><div className="emailQueueFilter"><span>LAUNCH UNNOTIFIED: {deliveryHealth?.counts?.launch_unnotified??'—'} · GIFTS DUE: {deliveryHealth?.counts?.gift_due??'—'} · QA PREVIEW FAILED: {deliveryHealth?.counts?.qa_preview_failed??'—'} · REAL SENT: {deliveryHealth?.counts?.real_send_successes??'—'} · REAL FAILED: {deliveryHealth?.counts?.real_send_failures??'—'}</span><span>RUNNER: {deliveryHealth?.runner?.active?'ACTIVE':'IDLE / UNKNOWN'}</span></div>{deliveryHealthError&&<p role="status">{deliveryHealthError}</p>}<button type="button" onClick={loadDeliveryHealth}>REFRESH HEALTH</button><div className="emailQueueList"><div><b>TYPE</b><b>LAST RESULT</b><b>ATTEMPTS / ERROR</b><b>LAST ATTEMPT</b></div>{(deliveryHealth?.recent_attempts||[]).map((a,i)=><div key={a.kind+'-'+a.attempted_at+'-'+i}><span>{a.kind==='launch'?'Launch':'Gift'}</span><span className="emailQueueState"><strong>{a.delivery_status==='email.delivered'?'Delivered':a.delivery_status==='email.bounced'?'Bounced':a.delivery_status==='email.complained'?'Complaint':a.delivery_status==='email.failed'?'Provider failed':a.delivery_status==='email.delivery_delayed'?'Delayed':a.delivery_status==='email.sent'?'Provider sent':a.delivery_status==='email.accepted'?'Provider accepted':a.outcome==='sent'?'Accepted · unverified':'Failed'}</strong></span><span className="emailQueueState"><small>{a.attempts} recorded attempts</small><small>{a.error_code||'—'}</small><small>{({attention_required:'REVIEW: DELIVERY FAILED',unknown_outcome_review:'REVIEW: OUTCOME UNKNOWN',retry_limit_review:'REVIEW: RETRY LIMIT',awaiting_confirmation:'AWAITING CONFIRMATION',send_failed:'SEND FAILED',delayed:'DELIVERY DELAYED',delivered:'DELIVERED'})[a.review_state]||'STATUS UNKNOWN'}</small></span><span>{a.attempted_at?new Date(a.attempted_at).toLocaleString('tr-TR'):'—'}</span></div>)}{!deliveryHealth?.recent_attempts?.length&&<p>No real delivery attempts recorded yet.</p>}</div><p>Recent attempt counts cover up to 200 audit entries. Delivery status reflects signed provider events where available. Provider acceptance is not inbox confirmation.</p></section>
 <section className="emailQueuePanel"><h3>03 / DELIVERY QUEUE · V3.3 QA</h3><p>Admin-only. Unique order/event entries. No outgoing emails are sent.</p><div className="emailQueueCreate"><select aria-label="Select QA order" value={selectedOrder} onChange={e=>{setSelectedOrder(e.target.value);setSelectedQueuedId('');setOverrides({});}}><option value="">SELECT TEST ORDER</option>{orders.map(o=><option key={o.id} value={o.id}>SII-{String(o.order_no).padStart(4,'0')} · {o.status}</option>)}</select><button type="button" disabled={!selectedOrder||!orderPreview||queueBusy||!['order_created','preparing','shipped','digital_ready','preorder_update','cancelled','refund_update'].includes(event)} onClick={createPreview}>{queueBusy?'SAVING…':'QUEUE PREVIEW EVENT'}</button><button type="button" onClick={loadQueue}>REFRESH</button></div>{queueNotice&&<p role="status">{queueNotice}</p>}<div className="emailQueueFilter"><label>STATUS <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="all">ALL</option><option value="preview">PREVIEW</option><option value="failed">FAILED</option><option value="cancelled">CANCELLED</option></select></label><span>{queue.length} RECORDS · NO EMAIL SENDING</span></div><div className="emailQueueList"><div><b>EVENT</b><b>ORDER</b><b>STATUS / ATTEMPTS</b><b>QA ACTION</b></div>{queue.filter(q=>statusFilter==="all"||q.status===statusFilter).map(q=><div key={q.id}><button type="button" className="emailQueueView" onClick={()=>{setSelectedQueuedId(q.id);setSelectedOrder(q.order_id||'');setEvent(q.event_type);setOverrides({});}}>{q.event_type} ↗</button><span>{orders.find(o=>o.id===q.order_id)?'SII-'+String(orders.find(o=>o.id===q.order_id)?.order_no).padStart(4,'0'):'—'}</span><span className="emailQueueState"><strong>{q.status}</strong><small>{q.attempts} attempts</small>{q.error_message&&<small title={q.error_message}>{q.error_message}</small>}</span><span className="emailQueueActions">{q.status==="preview"&&<><button type="button" disabled={queueBusy} onClick={()=>simulate(q.id,"simulate_failure")}>SIMULATE FAIL</button><button type="button" disabled={queueBusy} onClick={()=>simulate(q.id,"cancel_preview")}>CANCEL</button></>}{q.status==="failed"&&<button type="button" disabled={queueBusy} onClick={()=>simulate(q.id,"retry_preview")}>RETRY PREVIEW</button>}{q.status==="cancelled"&&<button type="button" disabled={queueBusy} onClick={()=>simulate(q.id,"restore_preview")}>RESTORE</button>}</span></div>)}{!queue.length&&<p>No queued preview events yet.</p>}</div></section>
 {queuedEntry&&<p className="emailStudioDataState">QUEUED SNAPSHOT · {queuedEntry.event_type} · {queuedEntry.payload?.orderNumber||'OLD ENTRY WITHOUT SNAPSHOT'} <button type="button" onClick={()=>setSelectedQueuedId('')}>RETURN TO LIVE ORDER</button></p>}
 <iframe key={displayedEvent+'-'+selectedOrder+'-'+selectedQueuedId} title={EMAIL_EVENTS.find(x=>x[0]===displayedEvent)?.[1]+' email preview'} className="emailStudioFrame" sandbox="" srcDoc={html}/>
 </section>;
}