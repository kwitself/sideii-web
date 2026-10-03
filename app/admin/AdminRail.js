'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';

const items=[
 ['overview','01','Overview'],
 ['products','02','Products'],
 ['orders','03','Orders'],
 ['inventory-list','04','Inventory'],
 ['customers','05','Customers'],
 ['settings','06','Settings']
];

export default function AdminRail(){
 const [active,setActive]=useState('overview');

 useEffect(()=>{
  let frame=0;
  const update=()=>{
   frame=0;
   const marker=Math.min(window.innerHeight*.38,320);
   const maxScroll=document.documentElement.scrollHeight-window.innerHeight;
   if(maxScroll>0&&window.scrollY>=maxScroll-4){setActive(items[items.length-1][0]);return}
   const targets=items.map(([id])=>({id,el:document.getElementById(id)})).filter(x=>x.el);
   let current=targets[0]?.id||'overview';
   for(const target of targets){
    const rect=target.el.getBoundingClientRect();
    if(rect.top<=marker) current=target.id;
   }
   setActive(current);
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update)};
  update();
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule);
  const observer=new ResizeObserver(schedule);
  const main=document.querySelector('.adminMain');
  if(main)observer.observe(main);
  return()=>{
   window.removeEventListener('scroll',schedule);
   window.removeEventListener('resize',schedule);
   observer.disconnect();
   if(frame)cancelAnimationFrame(frame);
  };
 },[]);

 const go=(e,id)=>{
  e.preventDefault();
  const el=document.getElementById(id);
  if(!el)return;
  setActive(id);
  el.scrollIntoView({behavior:'smooth',block:'start'});
  history.replaceState(null,'','#'+id);
 };

 return <aside className="adminRail"><Link href="/" className="adminBrand"><img src="/brand/sideii-logo-flat.png" alt="Side II"/><small>CONTROL ROOM</small></Link><nav className="adminNav">{items.map(([id,n,label])=><a key={id} className={active===id?'active':''} href={'#'+id} onClick={e=>go(e,id)}><i>{n}</i>{label}</a>)}</nav><div className="railFoot"><span>STORE STATUS</span><b><i/>DATABASE LIVE</b><small>MMXXVI / SIDE:II</small></div></aside>;
}
