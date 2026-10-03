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
  const onScroll=()=>{
   const y=window.scrollY+window.innerHeight*.34;
   let current=items[0][0];
   for(const [id] of items){const el=document.getElementById(id);if(el&&el.offsetTop<=y)current=id}
   setActive(current);
  };
  onScroll();window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('resize',onScroll);
  return()=>{window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',onScroll)};
 },[]);
 const go=(e,id)=>{e.preventDefault();document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'});history.replaceState(null,'','#'+id)};
 return <aside className="adminRail"><Link href="/" className="adminBrand"><img src="/brand/sideii-logo-flat.png" alt="Side II"/><small>CONTROL ROOM</small></Link><nav className="adminNav">{items.map(([id,n,label])=><a key={id} className={active===id?'active':''} href={'#'+id} onClick={e=>go(e,id)}><i>{n}</i>{label}</a>)}</nav><div className="railFoot"><span>STORE STATUS</span><b><i/>DATABASE LIVE</b><small>MMXXVI / SIDE:II</small></div></aside>;
}
