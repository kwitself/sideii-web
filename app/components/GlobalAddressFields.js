'use client';
import {useEffect,useMemo,useState} from 'react';
import {supabase} from '../lib/supabase';

const API='https://api.turkiyeapi.dev/v2';
const COUNTRY_CODES='AD AE AF AG AL AM AO AR AT AU AZ BA BB BD BE BF BG BH BI BJ BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FM FR GA GB GD GE GH GM GN GQ GR GT GW GY HK HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP KE KG KH KI KM KN KP KR KW KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML MM MN MO MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NR NZ OM PA PE PG PH PK PL PR PS PT PW PY QA RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VN VU WS YE ZA ZM ZW'.split(' ');

function countryName(code){
 try{
  const names=new Intl.DisplayNames(['en'],{type:'region'});
  return names.of(code)||code;
 }catch{return code}
}

export default function GlobalAddressFields({form,setForm}){
 const country=form.country||form.country_code||'TR';
 const [provinces,setProvinces]=useState([]),[districts,setDistricts]=useState([]),[loading,setLoading]=useState(false),[districtLoading,setDistrictLoading]=useState(false),[notice,setNotice]=useState('');
 const [internationalEnabled,setInternationalEnabled]=useState(false);
 const countries=useMemo(()=>{
  const source=internationalEnabled?COUNTRY_CODES:['TR'];
  return source.map(code=>({code,name:countryName(code)})).sort((a,b)=>a.name.localeCompare(b.name));
 },[internationalEnabled]);

 useEffect(()=>{
  let live=true;
  if(!supabase)return;
  supabase.rpc('get_store_shipping_scope').then(({data})=>{
   if(!live)return;
   const enabled=!!data?.international_enabled;
   setInternationalEnabled(enabled);
   if(!enabled&&country!=='TR')setCountry('TR');
  });
  return()=>{live=false};
 },[]);

 useEffect(()=>{
  if(country!=='TR'){setProvinces([]);setDistricts([]);setNotice('');return}
  let live=true;setLoading(true);
  fetch(API+'/provinces?fields=id,name&limit=81&sort=name')
   .then(r=>{if(!r.ok)throw new Error();return r.json()})
   .then(j=>{if(live)setProvinces(j.data||[])})
   .catch(()=>{if(live)setNotice('City list could not be loaded. Refresh and try again.')})
   .finally(()=>{if(live)setLoading(false)});
  return()=>{live=false}
 },[country]);

 useEffect(()=>{
  if(country!=='TR'){setDistricts([]);return}
  const p=provinces.find(x=>x.name===form.city);
  if(!p){setDistricts([]);return}
  let live=true;setDistrictLoading(true);setDistricts([]);setNotice('');
  fetch(API+'/districts?provinceId='+p.id+'&fields=id,name&sort=name&limit=100')
   .then(r=>{if(!r.ok)throw new Error();return r.json()})
   .then(j=>{if(live)setDistricts(j.data||[])})
   .catch(()=>{if(live)setNotice('District list could not be loaded. Please try again.')})
   .finally(()=>{if(live)setDistrictLoading(false)});
  return()=>{live=false}
 },[country,form.city,provinces]);

 function setCountry(code){
  const next={...form,country:code,country_code:code,city:'',district:'',state_region:'',postal:''};
  setForm(next);
 }

 return <>
  <label>COUNTRY
   <select required value={internationalEnabled?country:'TR'} onChange={e=>setCountry(e.target.value)}>
    {countries.map(c=><option key={c.code} value={c.code}>{c.name.toUpperCase()}</option>)}
   </select>
  </label>
  {!internationalEnabled&&<small className="addressNotice">International shipping is currently unavailable.</small>}
  {country==='TR'?<>
   <div className="checkoutSplit addressLocation">
    <label>CITY<select required disabled={loading||!provinces.length} value={form.city||''} onChange={e=>setForm({...form,city:e.target.value,district:''})}><option value="">{loading?'LOADING CITIES…':'SELECT CITY'}</option>{provinces.map(p=><option key={p.id} value={p.name}>{p.name}</option>)}</select></label>
    <label>DISTRICT<select required disabled={!form.city||districtLoading||!districts.length} value={form.district||''} onChange={e=>setForm({...form,district:e.target.value})}><option value="">{!form.city?'SELECT CITY FIRST':districtLoading?'LOADING DISTRICTS…':'SELECT DISTRICT'}</option>{districts.map(d=><option key={d.id} value={d.name}>{d.name}</option>)}</select></label>
   </div>
   {notice&&<small className="addressNotice">{notice}</small>}
  </>:<>
   <div className="checkoutSplit addressLocation internationalAddress">
    <label>STATE / REGION<input value={form.state_region||''} onChange={e=>setForm({...form,state_region:e.target.value})} placeholder="State, province or region"/></label>
    <label>CITY<input required value={form.city||''} onChange={e=>setForm({...form,city:e.target.value})} placeholder="City"/></label>
   </div>
  </>}
 </>;
}
