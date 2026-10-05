'use client';
import {useEffect,useMemo,useState} from 'react';
import {supabase} from '../lib/supabase';

const emptyCampaign={id:null,name:'',beneficiary_name:'',beneficiary_url:'',rule_type:'percent',rule_value:'10',customer_message:'',active:true};
const money=(n,c='TRY')=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:c||'TRY',maximumFractionDigits:2}).format(Number(n||0));

export default function ImpactPanel({products=[]}){
 const [campaigns,setCampaigns]=useState([]),[rules,setRules]=useState([]),[allocations,setAllocations]=useState([]),[batches,setBatches]=useState([]);
 const [form,setForm]=useState(emptyCampaign),[busy,setBusy]=useState(''),[message,setMessage]=useState('');
 const merch=useMemo(()=>products.filter(p=>p.product_type==='merch'),[products]);

 async function load(){
  if(!supabase)return;
  const [c,r,a,b]=await Promise.all([
   supabase.rpc('admin_list_impact_campaigns'),
   supabase.rpc('admin_list_product_impact_rules'),
   supabase.rpc('admin_list_impact_allocations'),
   supabase.rpc('admin_list_impact_batches')
  ]);
  if(c.error)return setMessage(c.error.message);
  setCampaigns(c.data||[]);setRules(r.data||[]);setAllocations(a.data||[]);setBatches(b.data||[]);
 }
 useEffect(()=>{load()},[]);

 const pending=allocations.filter(x=>x.status==='pending');
 const donated=allocations.filter(x=>x.status==='donated');
 const pendingTotal=pending.reduce((s,x)=>s+Number(x.amount||0),0);
 const donatedTotal=donated.reduce((s,x)=>s+Number(x.amount||0),0);

 async function saveCampaign(e){
  e.preventDefault();setBusy('campaign');setMessage('');
  const {error}=await supabase.rpc('admin_save_impact_campaign',{
   p_id:form.id||null,p_name:form.name.trim(),p_beneficiary_name:form.beneficiary_name.trim(),
   p_beneficiary_url:form.beneficiary_url.trim()||null,p_rule_type:form.rule_type,
   p_rule_value:Number(form.rule_value)||0,p_customer_message:form.customer_message.trim()||null,p_active:!!form.active
  });
  setBusy('');if(error)return setMessage(error.message);
  setForm(emptyCampaign);setMessage('Impact campaign saved.');load();
 }

 async function assignProduct(productId,campaignId,enabled=true){
  setBusy('rule:'+productId);setMessage('');
  const {error}=await supabase.rpc('admin_set_product_impact_rule',{p_product_id:productId,p_campaign_id:campaignId,p_enabled:enabled});
  setBusy('');if(error)return setMessage(error.message);
  setMessage('Product impact rule saved.');load();
 }

 async function createBatch(campaignId){
  setBusy('batch:'+campaignId);setMessage('');
  const {error}=await supabase.rpc('admin_create_impact_batch',{p_campaign_id:campaignId});
  setBusy('');if(error)return setMessage(error.message);
  setMessage('Donation batch created from pending allocations.');load();
 }

 async function updateBatch(batch,status){
  const ref=window.prompt('Transfer reference',batch.transfer_reference||'');
  if(ref===null)return;
  const proof=window.prompt('Proof / receipt URL',batch.proof_url||'');
  if(proof===null)return;
  setBusy('update:'+batch.id);setMessage('');
  const {error}=await supabase.rpc('admin_update_impact_batch',{
   p_batch_id:batch.id,p_status:status,p_transfer_reference:ref,p_proof_url:proof,
   p_transferred_at:status==='draft'||status==='cancelled'?null:(batch.transferred_at||new Date().toISOString())
  });
  setBusy('');if(error)return setMessage(error.message);
  setMessage(status==='verified'?'Batch verified. Customer proof is now eligible for delivery.':'Batch updated.');load();
 }

 const campaignById=id=>campaigns.find(x=>x.id===id);

 return <section id="impact" className="adminSection impactSection">
  <div className="sectionLabel"><span>09 / IMPACT LEDGER</span><p>Paid order → allocation → donation batch → proof.</p></div>
  {message&&<p className="dbNotice">{message}</p>}

  <div className="metricGrid impactMetrics">
   <article><span>PENDING IMPACT</span><strong>{money(pendingTotal)}</strong><small>{pending.length} allocation(s)</small></article>
   <article><span>DONATED</span><strong>{money(donatedTotal)}</strong><small>{donated.length} verified allocation(s)</small></article>
   <article><span>CAMPAIGNS</span><strong>{String(campaigns.length).padStart(2,'0')}</strong><small>{campaigns.filter(x=>x.active).length} active</small></article>
   <article><span>BATCHES</span><strong>{String(batches.length).padStart(2,'0')}</strong><small>{batches.filter(x=>x.status==='verified').length} verified</small></article>
  </div>

  <div className="impactGrid">
   <form className="adminPanel impactCampaignForm" onSubmit={saveCampaign}>
    <header><span>{form.id?'EDIT CAMPAIGN':'NEW CAMPAIGN'}</span><small>Define exactly what each eligible sale contributes.</small></header>
    <div className="impactFormGrid">
     <label><span>CAMPAIGN NAME</span><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Wear What You Support / 01"/></label>
     <label><span>BENEFICIARY</span><input required value={form.beneficiary_name} onChange={e=>setForm({...form,beneficiary_name:e.target.value})} placeholder="Organisation name"/></label>
     <label><span>BENEFICIARY URL</span><input value={form.beneficiary_url} onChange={e=>setForm({...form,beneficiary_url:e.target.value})} placeholder="https://..."/></label>
     <label><span>RULE</span><select value={form.rule_type} onChange={e=>setForm({...form,rule_type:e.target.value})}><option value="percent">PERCENT OF ITEM SALES</option><option value="fixed">FIXED TRY / UNIT</option></select></label>
     <label><span>{form.rule_type==='percent'?'PERCENT / %':'TRY / UNIT'}</span><input type="number" min="0" step=".01" value={form.rule_value} onChange={e=>setForm({...form,rule_value:e.target.value})}/></label>
     <label className="impactToggle"><input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})}/><span>ACTIVE</span></label>
     <label className="impactWide"><span>CUSTOMER PROOF MESSAGE</span><textarea value={form.customer_message} onChange={e=>setForm({...form,customer_message:e.target.value})} placeholder="Your purchase contributed to..."/></label>
    </div>
    <div className="formActions"><button type="button" className="ghostButton" onClick={()=>setForm(emptyCampaign)}>RESET</button><button className="saveButton" disabled={busy==='campaign'}>{busy==='campaign'?'SAVING…':'SAVE CAMPAIGN'}</button></div>
   </form>

   <article className="adminPanel impactCampaignList">
    <header><span>CAMPAIGNS</span><small>{campaigns.length} total</small></header>
    {campaigns.length===0?<p className="emptyNote">No impact campaign yet.</p>:campaigns.map(c=><div className="impactCampaignRow" key={c.id}>
      <div><b>{c.name}</b><small>{c.beneficiary_name} · {c.rule_type==='percent'?c.rule_value+'%':money(c.rule_value)+' / UNIT'}</small></div>
      <span>{c.active?'ACTIVE':'PAUSED'}</span>
      <button className="ghostButton" onClick={()=>setForm({...c,rule_value:String(c.rule_value??0),beneficiary_url:c.beneficiary_url||'',customer_message:c.customer_message||''})}>EDIT</button>
      <button className="saveButton" disabled={busy==='batch:'+c.id} onClick={()=>createBatch(c.id)}>CREATE BATCH</button>
    </div>)}
   </article>
  </div>

  <article className="adminPanel impactProducts">
   <header><span>WEAR PRODUCT RULES</span><small>Only paid orders create allocations.</small></header>
   {merch.length===0?<p className="emptyNote">No merch products yet.</p>:merch.map(p=>{const rule=rules.find(x=>x.product_id===p.id);return <div className="impactProductRow" key={p.id}>
    <div><b>{p.title}</b><small>{p.catalogue_no} · {String(p.merch_category||'MERCH').toUpperCase()}</small></div>
    <select value={rule?.campaign_id||''} onChange={e=>e.target.value&&assignProduct(p.id,e.target.value,true)} disabled={busy==='rule:'+p.id}>
      <option value="">NO IMPACT RULE</option>{campaigns.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
    </select>
    <label><input type="checkbox" checked={!!rule?.enabled} disabled={!rule||busy==='rule:'+p.id} onChange={e=>assignProduct(p.id,rule.campaign_id,e.target.checked)}/><span>ENABLED</span></label>
   </div>})}
  </article>

  <div className="impactGrid impactLower">
   <article className="adminPanel impactAllocations">
    <header><span>RECENT ALLOCATIONS</span><small>{allocations.length}</small></header>
    {allocations.length===0?<p className="emptyNote">No paid impact orders yet.</p>:allocations.slice(0,20).map(a=><div className="impactAllocationRow" key={a.allocation_id}>
      <div><b>#SII-{String(a.order_no).padStart(4,'0')} · {a.product_title}</b><small>{a.email} · {campaignById(a.campaign_id)?.name||a.campaign_name}</small></div>
      <strong>{money(a.amount,a.currency)}</strong><span className={'impactStatus '+a.status}>{String(a.status).toUpperCase()}</span>
    </div>)}
   </article>

   <article className="adminPanel impactBatches">
    <header><span>DONATION BATCHES</span><small>Proof workflow</small></header>
    {batches.length===0?<p className="emptyNote">No donation batch yet.</p>:batches.map(b=><div className="impactBatchRow" key={b.id}>
      <div><b>{campaignById(b.campaign_id)?.name||'Impact campaign'}</b><small>{new Date(b.created_at).toLocaleString('tr-TR')} · {b.transfer_reference||'NO TRANSFER REF'}</small></div>
      <strong>{money(b.amount,b.currency)}</strong>
      <span className={'impactStatus '+b.status}>{b.status.toUpperCase()}</span>
      <div className="impactBatchActions">{b.status==='draft'&&<><button className="saveButton" onClick={()=>updateBatch(b,'sent')}>MARK SENT</button><button className="ghostButton" onClick={()=>updateBatch(b,'cancelled')}>CANCEL</button></>}{b.status==='sent'&&<button className="saveButton" onClick={()=>updateBatch(b,'verified')}>VERIFY PROOF</button>}{b.proof_url&&<a href={b.proof_url} target="_blank" rel="noreferrer">PROOF ↗</a>}</div>
    </div>)}
   </article>
  </div>

  <p className="impactFootnote">Automatic bank transfer and customer email delivery are intentionally not active yet. This ledger already records the auditable amount from paid orders and links it to a verified transfer proof.</p>
 </section>;
}
