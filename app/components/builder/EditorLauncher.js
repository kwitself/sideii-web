'use client';
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import {supabase} from '../../lib/supabase';
export default function EditorLauncher() {
  const path=usePathname(),[admin,setAdmin]=useState(false);
  const key=path==='/'?'home':path==='/store'?'store':/^\/(releases|store)\/[^/]+$/.test(path)?'product':path.startsWith('/pages/')?'page:'+path.slice(7):null;
  useEffect(()=>{if(!supabase)return;let active=true,timer;const check=async()=>{try{const {data,error}=await supabase.auth.getUser();if(active)setAdmin(!error&&data?.user?.app_metadata?.role==='admin');}catch{if(active)setAdmin(false);}};check();const {data}=supabase.auth.onAuthStateChange(()=>{clearTimeout(timer);timer=setTimeout(check,0);});return()=>{active=false;clearTimeout(timer);data.subscription.unsubscribe();};},[]);
  return admin&&key?<a href={'/admin/editor?page='+encodeURIComponent(key)} className="sideiiEditPage" style={{position:'fixed',right:18,bottom:20,zIndex:80,padding:'12px 18px',border:'1px solid #777',borderRadius:4,background:'#171719',color:'#eee',font:'12px Arial,sans-serif',boxShadow:'0 4px 30px #0005',textDecoration:'none'}}>✎ Sayfayı düzenle</a>:null;
}
