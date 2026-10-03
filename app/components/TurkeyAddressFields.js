'use client';
import {useEffect,useState} from 'react';

const API='https://api.turkiyeapi.dev/v2';

export default function TurkeyAddressFields({form,setForm}){
 const [provinces,setProvinces]=useState([]),[districts,setDistricts]=useState([]),[loading,setLoading]=useState(true),[failed,setFailed]=useState(false);

 useEffect(()=>{let live=true;fetch(API+'/provinces?fields=id,name&limit=81&sort=name').then(r=>{if(!r.ok)throw new Error();return r.json()}).then(j=>{if(live)setProvinces(j.data||[])}).catch(()=>{if(live)setFailed(true)}).finally(()=>{if(live)setLoading(false)});return()=>{live=false}},[]);

 useEffect(()=>{const p=provinces.find(x=>x.name===form.city);if(!p){setDistricts([]);return}let live=true;setDistricts([]);fetch(API+'/provinces/'+p.id+'/districts?fields=id,name&limit=1000&sort=name').then(r=>{if(!r.ok)throw new Error();return r.json()}).then(j=>{if(live)setDistricts(j.data||[])}).catch(()=>{if(live)setFailed(true)});return()=>{live=false}},[form.city,provinces]);

 if(failed)return <div className="checkoutSplit"><label>DISTRICT<input required value={form.district} onChange={e=>setForm({...form,district:e.target.value})}/></label><label>CITY<input required value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/></label></div>;

 return <div className="checkoutSplit">
  <label>CITY<select required disabled={loading} value={form.city} onChange={e=>setForm({...form,city:e.target.value,district:''})}><option value="">{loading?'LOADING…':'SELECT CITY'}</option>{provinces.map(p=><option key={p.id} value={p.name}>{p.name}</option>)}</select></label>
  <label>DISTRICT<select required disabled={!form.city} value={form.district} onChange={e=>setForm({...form,district:e.target.value})}><option value="">{form.city?'SELECT DISTRICT':'SELECT CITY FIRST'}</option>{districts.map(d=><option key={d.id} value={d.name}>{d.name}</option>)}</select></label>
 </div>
}
