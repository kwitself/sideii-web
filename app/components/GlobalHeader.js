'use client';

import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';

const MOBILE_LINKS=[
  ['Releases','/#releases'],
  ['Imprints','/#imprints'],
  ['Store','/store'],
  ['Wear','/wear'],
  ['Collections','/collections'],
  ['Bundles','/bundles'],
  ['Artists','/artists'],
  ['Credits','/credits'],
  ['Timeline','/timeline'],
  ['Archive','/archive'],
  ['Impact','/impact'],
  ['Wholesale','/wholesale'],
  ['Policies','/policies'],
  ['Track Order','/track-order'],
  ['Apply','/apply']
];

export default function GlobalHeader({homeHref='/',className=''}) {
  const [mobileOpen,setMobileOpen]=useState(false);
  const [exploreOpen,setExploreOpen]=useState(false);
  const mobileDrawerRef=useRef(null),mobileTriggerRef=useRef(null),exploreRef=useRef(null);

  useEffect(()=>{
    if(!mobileOpen){
      document.body.classList.remove('sideii-mobile-nav-open');
      return;
    }
    const previousFocus=document.activeElement;
    requestAnimationFrame(()=>mobileDrawerRef.current?.querySelector('.mobileNavHead button')?.focus());
    const onKey=e=>{
      if(e.key==='Escape'){e.preventDefault();setMobileOpen(false);return}
      if(e.key!=='Tab')return;
      const nodes=[...(mobileDrawerRef.current?.querySelectorAll('a[href],button:not([disabled])')||[])];
      if(!nodes.length)return;
      if(e.shiftKey&&document.activeElement===nodes[0]){e.preventDefault();nodes[nodes.length-1].focus()}
      else if(!e.shiftKey&&document.activeElement===nodes[nodes.length-1]){e.preventDefault();nodes[0].focus()}
    };
    const prev=document.body.style.overflow;
    document.body.style.overflow='hidden';
    document.body.classList.add('sideii-mobile-nav-open');
    window.addEventListener('keydown',onKey);
    return()=>{
      document.body.style.overflow=prev;
      document.body.classList.remove('sideii-mobile-nav-open');
      window.removeEventListener('keydown',onKey);
      requestAnimationFrame(()=>{if(previousFocus?.isConnected)previousFocus.focus()});
    };
  },[mobileOpen]);

  useEffect(()=>{
    if(!exploreOpen)return;
    const close=e=>{if(e.key==='Escape'){setExploreOpen(false);exploreRef.current?.querySelector('button')?.focus()}else if(e.type==='pointerdown'&&!exploreRef.current?.contains(e.target))setExploreOpen(false)};
    window.addEventListener('keydown',close);document.addEventListener('pointerdown',close);
    return()=>{window.removeEventListener('keydown',close);document.removeEventListener('pointerdown',close)};
  },[exploreOpen]);

  return <>
    <header className={'nav globalSiteHeader shell '+className}>
      <Link className="brand" href={homeHref} aria-label="SIDE:II home">
        <img src="/brand/sideii-logo-flat.png" alt="SIDE:II"/>
      </Link>

      <nav className="primaryNav" aria-label="Primary navigation">
        <Link href="/#releases" className="navReleases">Releases</Link>
        <Link href="/#imprints" className="navImprints">Imprints</Link>
        <Link href="/store" className="navStore">Store</Link>
        <Link href="/wear" className="navWear">Wear</Link>
        <div ref={exploreRef} className={"navExplore "+(exploreOpen?"isOpen":"")} onMouseLeave={()=>setExploreOpen(false)}>
          <button type="button" aria-haspopup="true" aria-expanded={exploreOpen} onClick={()=>setExploreOpen(v=>!v)}>Explore <span>{exploreOpen?"−":"＋"}</span></button>
          <div className="navExploreMenu" onClick={()=>setExploreOpen(false)}>
            <Link href="/collections">Collections</Link>
            <Link href="/bundles">Bundles</Link>
            <Link href="/artists">Artists</Link>
            <Link href="/credits">Credits</Link>
            <Link href="/timeline">Timeline</Link>
            <Link href="/archive">Archive</Link>
            <Link href="/impact">Impact</Link>
            <Link href="/wholesale">Wholesale</Link>
            <Link href="/policies">Policies</Link>
            <Link href="/track-order">Track Order</Link>
          </div>
        </div>
        <Link href="/apply" className="navApply">Apply</Link>
      </nav>

      <button
        type="button"
        className="mobileMenuTrigger"
        ref={mobileTriggerRef}
        aria-label="Open navigation"
        aria-expanded={mobileOpen}
        onClick={()=>setMobileOpen(true)}
      >
        <span>MENU</span><i>≡</i>
      </button>
    </header>

    <button
      type="button"
      className={'mobileNavShade '+(mobileOpen?'open':'')}
      aria-label="Close navigation"
      onClick={()=>setMobileOpen(false)}
    />

    <aside ref={mobileDrawerRef} className={'mobileNavDrawer '+(mobileOpen?'open':'')} aria-hidden={!mobileOpen} inert={!mobileOpen} role="dialog" aria-modal={mobileOpen} aria-label="Mobile navigation">
      <div className="mobileNavHead">
        <Link href={homeHref} onClick={()=>setMobileOpen(false)} aria-label="SIDE:II home">
          <img src="/brand/sideii-logo-flat.png" alt="SIDE:II"/>
        </Link>
        <button type="button" onClick={()=>setMobileOpen(false)}>CLOSE ×</button>
      </div>
      <div className="mobileNavIndex">NAVIGATION</div>
      <nav aria-label="Mobile navigation">
        {MOBILE_LINKS.map(([label,href],i)=><Link key={href} href={href} onClick={()=>setMobileOpen(false)}>
          <span>{String(i+1).padStart(2,'0')}</span><b>{label}</b><i>↗</i>
        </Link>)}
      </nav>
      <div className="mobileNavFoot"><span>SIDE:II</span><small>Music, in another form.</small></div>
    </aside>
  </>;
}
