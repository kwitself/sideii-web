'use client';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';

const items=[
 ['overview','01','Dashboard'],
 ['products','02','Products'],
 ['preview','03','Preview'],
 ['merchandising','04','Merchandising'],
 ['orders','05','Orders'],
 ['inventory','06','Inventory'],
 ['customers','07','Customers'],
 ['commerce','08','Commerce'],
 ['catalogue','09','Catalogue'],
 ['growth','10','Growth'],
 ['impact','11','Impact'],
 ['fulfillment','12','Fulfillment'],
 ['localization','13','Localization'],
 ['settings','14','Settings'],
 ['launch','15','Launch'],
 ['seo','16','SEO Audit'],
 ['emails','17','Email Studio'],
 ['finance','18','Finance']
];

const valid=new Set(items.map(x=>x[0]));

export default function AdminRail(){
 const [active,setActive]=useState('overview');
 const [isMobile,setIsMobile]=useState(false);
 useEffect(()=>{const media=window.matchMedia('(max-width:800px)');const sync=()=>{setIsMobile(media.matches);if(!media.matches)setMobileOpen(false);};sync();media.addEventListener('change',sync);return()=>media.removeEventListener('change',sync)},[]);
 const [mobileOpen,setMobileOpen]=useState(false);
 const railRef=useRef(null),menuTriggerRef=useRef(null);

 useEffect(()=>{
  const fromHash=String(window.location.hash||'').replace('#','');
  const remembered=window.localStorage.getItem('sideii-admin-last-view');
  const initial=valid.has(fromHash)?fromHash:valid.has(remembered)?remembered:'overview';
  if(!valid.has(fromHash))history.replaceState(null,'','#'+initial);
  window.localStorage.setItem('sideii-admin-last-view',initial);
  setActive(initial);
  window.dispatchEvent(new CustomEvent('sideii-admin-view',{detail:initial}));
  const onView=e=>{const next=e?.detail;if(valid.has(next)){setActive(next);window.localStorage.setItem('sideii-admin-last-view',next)}};
  const onHash=()=>{const next=String(window.location.hash||'').replace('#','');if(valid.has(next)){setActive(next);window.localStorage.setItem('sideii-admin-last-view',next);window.dispatchEvent(new CustomEvent('sideii-admin-view',{detail:next}))}};
  window.addEventListener('sideii-admin-view',onView);
  window.addEventListener('hashchange',onHash);
  document.body.classList.add('sideii-admin-page');
  return()=>{document.body.classList.remove('sideii-admin-page');window.removeEventListener('sideii-admin-view',onView);window.removeEventListener('hashchange',onHash)};
 },[]);

 useEffect(()=>{
  if(!mobileOpen)return;
  const oldOverflow=document.body.style.overflow;
  const oldFocus=document.activeElement;
  document.body.style.overflow='hidden';
  requestAnimationFrame(()=>railRef.current?.querySelector('.adminRailMobileHead button')?.focus());
  const onKey=e=>{
   if(e.key==='Escape'){e.preventDefault();setMobileOpen(false);return}
   if(e.key!=='Tab')return;
   const items=[...(railRef.current?.querySelectorAll('a[href],button:not([disabled])')||[])].filter(node=>node.getClientRects().length);
   if(!items.length)return;
   if(e.shiftKey&&document.activeElement===items[0]){e.preventDefault();items[items.length-1].focus()}
   else if(!e.shiftKey&&document.activeElement===items[items.length-1]){e.preventDefault();items[0].focus()}
  };
  window.addEventListener('keydown',onKey);
  return()=>{document.body.style.overflow=oldOverflow;window.removeEventListener('keydown',onKey);requestAnimationFrame(()=>oldFocus?.isConnected?oldFocus.focus():menuTriggerRef.current?.focus())};
 },[mobileOpen]);

 const go=(e,id)=>{
  e.preventDefault();
  setActive(id);
  window.localStorage.setItem('sideii-admin-last-view',id);
  history.replaceState(null,'','#'+id);
  window.dispatchEvent(new CustomEvent('sideii-admin-view',{detail:id}));
  setMobileOpen(false);
  window.scrollTo({top:0,behavior:'smooth'});
 };

 return <>
  <header className="adminMobileTop">
   <Link href="/" className="adminMobileBrand"><img src="/brand/sideii-logo-flat.png" alt="Side II"/></Link>
   <span>{items.find(x=>x[0]===active)?.[2]||'Control Room'}</span>
   <button ref={menuTriggerRef} type="button" onClick={()=>setMobileOpen(true)} aria-label="Open admin navigation" aria-controls="admin-navigation" aria-expanded={mobileOpen}>MENU <i>≡</i></button>
  </header>
  <button className={'adminMobileShade '+(mobileOpen?'open':'')} type="button" aria-label="Close admin navigation" onClick={()=>setMobileOpen(false)}/>
  <aside id="admin-navigation" inert={isMobile&&!mobileOpen} aria-hidden={isMobile&&!mobileOpen} aria-label="Administration navigation" ref={railRef} className={'adminRail '+(mobileOpen?'mobileOpen':'')}>
   <div className="adminRailMobileHead"><span>NAVIGATION</span><button type="button" onClick={()=>setMobileOpen(false)}>CLOSE ×</button></div>
   <Link href="/" className="adminBrand"><img src="/brand/sideii-logo-flat.png" alt="Side II"/><small>CONTROL ROOM</small></Link>
   <nav className="adminNav" aria-label="Administration">{items.map(([id,n,label])=><a key={id} aria-current={active===id?'page':undefined} className={active===id?'active':''} href={'#'+id} onClick={e=>go(e,id)}><i>{n}</i>{label}</a>)}</nav>
   <Link href="/admin/editor" className="adminEditorLink" style={{display:'block',margin:'16px 20px',padding:'14px 12px',border:'1px solid #555',color:'#eee',fontSize:12,textDecoration:'none'}}>✎ Visual Studio ↗</Link>
   <div className="railFoot"><span>WORKSPACE</span><b><i/>ADMINISTRATION</b><small>MMXXVI / SIDE:II</small></div>
  </aside>
 </>;
}
