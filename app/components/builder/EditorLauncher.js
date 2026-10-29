'use client';
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import {supabase} from '../../lib/supabase';
export default function EditorLauncher() {
  const path=usePathname(),[admin,setAdmin]=useState(false);
  const key=path==='/'?'home':path==='/store'?'store':/^\/(releases|store)\/[^/]+$/.test(path)?'product':path.startsWith('/pages/')?'page:'+path.slice(7):null;
  useEffect(()=>{if(!supabase)return;let active=true,timer;const check=async()=>{try{const {data,error}=await supabase.auth.getUser();if(active)setAdmin(!error&&data?.user?.app_metadata?.role==='admin');}catch{if(active)setAdmin(false);}};check();const {data}=supabase.auth.onAuthStateChange(()=>{clearTimeout(timer);timer=setTimeout(check,0);});return()=>{active=false;clearTimeout(timer);data.subscription.unsubscribe();};},[]);
  return admin&&key?<a href={'/admin/editor?page='+encodeURIComponent(key)} className="sideiiEditPage" aria-label="Bu sayfayı görsel editörde düzenle">✎ Sayfayı düzenle</a>:null;
}
