'use client';
import {useEffect,useState} from 'react';

const sections=[
 ['top','00'],['manifesto','01'],['releases','02'],['imprints','03'],['about','04'],['store','05'],['closing','06']
];
export default function HomeSectionRail(){
 const [active,setActive]=useState('00');
 useEffect(()=>{
  const io=new IntersectionObserver(entries=>{
   const visible=entries.filter(x=>x.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
   if(visible){const found=sections.find(x=>x[0]===visible.target.id);if(found)setActive(found[1]);}
  },{rootMargin:'-34% 0px -46% 0px',threshold:[0,.15,.4,.7]});
  sections.forEach(([id])=>{const el=document.getElementById(id);if(el)io.observe(el)});
  return()=>io.disconnect();
 },[]);
 return <aside className="homeSectionRail" aria-label="Page sections"><span className="railCurrent">{active}</span><i/><div>{sections.slice(1).map(([id,n])=><a key={id} href={'#'+id} className={active===n?'active':''}>{n}</a>)}</div></aside>;
}
