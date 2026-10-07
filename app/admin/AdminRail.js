'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';

const items=[
 ['overview','01','Dashboard'],
 ['products','02','Products'],
 ['merchandising','03','Merchandising'],
 ['orders','04','Orders'],
 ['inventory','05','Inventory'],
 ['customers','06','Customers'],
 ['commerce','07','Commerce'],
 ['catalogue','08','Catalogue'],
 ['growth','09','Growth'],
 ['impact','10','Impact'],
 ['fulfillment','11','Fulfillment'],
 ['localization','12','Localization'],
 ['settings','13','Settings'],
 ['launch','14','Launch']
];

const valid=new Set(items.map(x=>x[0]));

export default function AdminRail(){
 const [active,setActive]=useState('overview');

 useEffect(()=>{
  const fromHash=String(window.location.hash||'').replace('#','');
  const initial=valid.has(fromHash)?fromHash:'overview';
  setActive(initial);
  window.dispatchEvent(new CustomEvent('sideii-admin-view',{detail:initial}));
  const onView=e=>{const next=e?.detail;if(valid.has(next))setActive(next)};
  const onHash=()=>{const next=String(window.location.hash||'').replace('#','');if(valid.has(next)){setActive(next);window.dispatchEvent(new CustomEvent('sideii-admin-view',{detail:next}))}};
  window.addEventListener('sideii-admin-view',onView);
  window.addEventListener('hashchange',onHash);
  return()=>{window.removeEventListener('sideii-admin-view',onView);window.removeEventListener('hashchange',onHash)};
 },[]);

 const go=(e,id)=>{
  e.preventDefault();
  setActive(id);
  history.replaceState(null,'','#'+id);
  window.dispatchEvent(new CustomEvent('sideii-admin-view',{detail:id}));
  window.scrollTo({top:0,behavior:'smooth'});
 };

 return <aside className="adminRail">
  <Link href="/" className="adminBrand"><img src="/brand/sideii-logo-flat.png" alt="Side II"/><small>CONTROL ROOM</small></Link>
  <nav className="adminNav">{items.map(([id,n,label])=><a key={id} className={active===id?'active':''} href={'#'+id} onClick={e=>go(e,id)}><i>{n}</i>{label}</a>)}</nav>
  <div className="railFoot"><span>STORE STATUS</span><b><i/>DATABASE LIVE</b><small>MMXXVI / SIDE:II</small></div>
 </aside>;
}
