'use client';
import {useState} from 'react';
import {supabase} from '../lib/supabase';

const initial={
  applicant_name:'',applicant_email:'',applicant_phone:'',
  artist_name:'',project_title:'',services:[],
  quantity:'',merch_items:'',print_details:'',description:'',
  reference_links:'',budget_note:''
};

const serviceOptions=[
  ['CD','CD PRESSING'],
  ['MERCH','MERCH PRINTING'],
  ['CASSETTE','CASSETTE'],
  ['VINYL','VINYL'],
  ['PACKAGING','PACKAGING / INSERTS'],
  ['OTHER','OTHER']
];

export default function ApplicationForm(){
 const [form,setForm]=useState(initial);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [done,setDone]=useState(false);

 const set=(key,value)=>setForm(v=>({...v,[key]:value}));
 const toggleService=value=>setForm(v=>({...v,services:v.services.includes(value)?v.services.filter(x=>x!==value):[...v.services,value]}));

 async function submit(e){
  e.preventDefault();
  if(!form.services.length)return setMessage('Select at least one production type.');
  if(!supabase)return setMessage('Application service is unavailable.');

  setBusy(true);setMessage('');
  const payload={
   ...form,
   applicant_name:form.applicant_name.trim(),
   applicant_email:form.applicant_email.trim(),
   applicant_phone:form.applicant_phone.trim()||null,
   artist_name:form.artist_name.trim(),
   project_title:form.project_title.trim(),
   quantity:form.quantity.trim()||null,
   merch_items:form.merch_items.trim()||null,
   print_details:form.print_details.trim()||null,
   description:form.description.trim()||null,
   reference_links:form.reference_links.trim()||null,
   budget_note:form.budget_note.trim()||null
  };

  const {data,error}=await supabase.from('production_applications').insert(payload).select('id').single();
  if(error){setBusy(false);setMessage(error.message);return}

  try{
   await fetch('/api/applications/notify',{
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({...payload,id:data.id})
   });
  }catch{}

  setBusy(false);setDone(true);
 }

 if(done)return <div className="applicationSuccess">
  <span>APPLICATION RECEIVED</span>
  <h2>We got your project.</h2>
  <p>Your production brief has been recorded. SIDE:II will review the details and contact you using the email address you provided.</p>
  <button type="button" onClick={()=>{setForm(initial);setDone(false)}}>SEND ANOTHER APPLICATION →</button>
 </div>;

 return <form className="productionApplicationForm" onSubmit={submit}>
   <section className="applicationGroup">
    <div className="applicationGroupHead"><span>01</span><div><b>CONTACT</b><small>Who should we speak to?</small></div></div>
    <div className="applicationGrid two">
      <label>NAME / CONTACT PERSON<input required value={form.applicant_name} onChange={e=>set('applicant_name',e.target.value)}/></label>
      <label>EMAIL<input type="email" required value={form.applicant_email} onChange={e=>set('applicant_email',e.target.value)}/></label>
      <label>PHONE<input value={form.applicant_phone} onChange={e=>set('applicant_phone',e.target.value)} placeholder="+90 ..."/></label>
    </div>
   </section>

   <section className="applicationGroup">
    <div className="applicationGroupHead"><span>02</span><div><b>PROJECT</b><small>Tell us what is being produced.</small></div></div>
    <div className="applicationGrid two">
      <label>ARTIST / PROJECT NAME<input required value={form.artist_name} onChange={e=>set('artist_name',e.target.value)}/></label>
      <label>ALBUM / RELEASE TITLE<input required value={form.project_title} onChange={e=>set('project_title',e.target.value)}/></label>
    </div>
    <div className="applicationServices">
      <span>WHAT DO YOU WANT TO PRODUCE?</span>
      <div>{serviceOptions.map(([value,label])=><button key={value} type="button" className={form.services.includes(value)?'active':''} onClick={()=>toggleService(value)}>{form.services.includes(value)?'✓ ':''}{label}</button>)}</div>
    </div>
   </section>

   <section className="applicationGroup">
    <div className="applicationGroupHead"><span>03</span><div><b>SPECIFICATION</b><small>Rough details are enough for the first review.</small></div></div>
    <div className="applicationGrid two">
      <label>QUANTITY<input value={form.quantity} onChange={e=>set('quantity',e.target.value)} placeholder="e.g. 100 CD / 50 T-shirts"/></label>
      <label>MERCH ITEMS<input value={form.merch_items} onChange={e=>set('merch_items',e.target.value)} placeholder="T-shirt, hoodie, tote, poster..."/></label>
    </div>
    <label>PRINT / PRODUCTION DETAILS<textarea value={form.print_details} onChange={e=>set('print_details',e.target.value)} placeholder="CD packaging, booklet pages, shirt print position, sizes, garment colours, print technique, special finishes..."/></label>
    <label>PROJECT DESCRIPTION<textarea value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Describe the release, visual direction, deadline, what you already have ready, and anything we should know."/></label>
   </section>

   <section className="applicationGroup">
    <div className="applicationGroupHead"><span>04</span><div><b>FILES / REFERENCES</b><small>Share links to artwork, masters or references.</small></div></div>
    <label>REFERENCE / DRIVE LINKS<textarea value={form.reference_links} onChange={e=>set('reference_links',e.target.value)} placeholder="Google Drive, Dropbox, WeTransfer, artwork mockups, reference images..."/></label>
    <label>BUDGET / DEADLINE NOTE<textarea value={form.budget_note} onChange={e=>set('budget_note',e.target.value)} placeholder="Optional — target budget, launch date or production deadline."/></label>
   </section>

   {message&&<p className="applicationError">{message}</p>}
   <button className="applicationSubmit" disabled={busy}>{busy?'SENDING APPLICATION…':'SEND PRODUCTION APPLICATION →'}</button>
   <small className="applicationPrivacy">By submitting, you allow SIDE:II to contact you about this production request.</small>
 </form>;
}
