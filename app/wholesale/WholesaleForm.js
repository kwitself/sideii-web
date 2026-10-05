'use client';
import {useState} from 'react';
import {supabase} from '../lib/supabase';

export default function WholesaleForm(){
 const [form,setForm]=useState({company:'',contact:'',email:'',country:'TR',notes:''});
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function submit(e){
  e.preventDefault();setBusy(true);setMessage('');
  const {error}=await supabase.rpc('submit_wholesale_application',{
   p_company_name:form.company,p_contact_name:form.contact||null,p_email:form.email,
   p_country_code:form.country||'TR',p_notes:form.notes||null
  });
  setBusy(false);
  if(error)return setMessage(error.message);
  setMessage('Application received.');setForm({company:'',contact:'',email:'',country:'TR',notes:''});
 }
 return <form className="wholesaleForm" onSubmit={submit}>
  <label><span>COMPANY / STORE</span><input required value={form.company} onChange={e=>setForm({...form,company:e.target.value})}/></label>
  <label><span>CONTACT NAME</span><input value={form.contact} onChange={e=>setForm({...form,contact:e.target.value})}/></label>
  <label><span>EMAIL</span><input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
  <label><span>COUNTRY CODE</span><input maxLength="2" value={form.country} onChange={e=>setForm({...form,country:e.target.value.toUpperCase()})}/></label>
  <label><span>STORE / DISTRIBUTION NOTES</span><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Store type, city, catalogue interests, approximate quantities…"/></label>
  {message&&<p>{message}</p>}
  <button disabled={busy}>{busy?'SENDING…':'SUBMIT TRADE INTEREST →'}</button>
 </form>
}
