'use client';
import {useEffect,useRef,useState} from 'react';

export function useLocalFormDraft(key,initial){
 const [form,setForm]=useState(initial);
 const [ready,setReady]=useState(false);
 const [notice,setNotice]=useState('');
 const restored=useRef(false);
 useEffect(()=>{
  try{
   const raw=window.localStorage.getItem(key);
   if(raw){
    const saved=JSON.parse(raw);
    if(saved&&typeof saved==='object'&&!Array.isArray(saved)){
     setForm(prev=>({...prev,...Object.fromEntries(Object.entries(saved).filter(([k])=>Object.hasOwn(prev,k)))}));
     setNotice('Unsaved form restored from this browser. Images must be selected again.');
    }
   }
  }catch{setNotice('Local draft could not be restored.');}
  restored.current=true;setReady(true);
 },[key]);
 useEffect(()=>{
  if(!restored.current||!ready)return;
  try{window.localStorage.setItem(key,JSON.stringify(form));}
  catch{setNotice('Browser storage is unavailable; copy your details before leaving.');}
 },[form,key,ready]);
 const clear=()=>{try{window.localStorage.removeItem(key)}catch{};restored.current=false;};
 return {form,setForm,notice,ready,clear};
}
