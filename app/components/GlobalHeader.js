'use client';

import Link from 'next/link';
import {useEffect,useState} from 'react';

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

  useEffect(()=>{
    if(!mobileOpen){
      document.body.classList.remove('sideii-mobile-nav-open');
      return;
    }
    const onKey=e=>{if(e.key==='Escape')setMobileOpen(false)};
    const prev=document.body.style.overflow;
    document.body.style.overflow='hidden';
    document.body.classList.add('sideii-mobile-nav-open');
    window.addEventListener('keydown',onKey);
    return()=>{
      document.body.style.overflow=prev;
      document.body.classList.remove('sideii-mobile-nav-open');
      window.removeEventListener('keydown',onKey);
    };
  },[mobileOpen]);

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
        <div className="navExplore">
          <button type="button" aria-haspopup="true">Explore <span>＋</span></button>
          <div className="navExploreMenu">
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

    <aside className={'mobileNavDrawer '+(mobileOpen?'open':'')} aria-hidden={!mobileOpen}>
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
