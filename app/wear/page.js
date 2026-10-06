import Link from 'next/link';
import T from '../components/T';
import {getStoreReleases} from '../lib/catalogue';
import Money from '../components/Money';
import './wear.css';
import GlobalHeader from '../components/GlobalHeader';

export const revalidate=0;
export const metadata={
  title:'Wear What You Support',
  description:'SIDE:II apparel and objects developed from the visual language of the catalogue.'
};

export default async function WearPage(){
  const products=(await getStoreReleases()).filter(x=>x.isMerch);
  return <main className="wearPage">
    <GlobalHeader/>
    <section className="wearHero shell">
      <span><T k="SIDE:II / OBJECTS"/></span>
      <h1><T k="Wear what"/><br/><i><T k="you support."/></i></h1>
      <p>Apparel and objects built from the same visual language as the catalogue — made to carry the release beyond the shelf.</p>
      <div className="wearHeroMeta"><small>APPAREL · OBJECTS · LIMITED RUNS</small><Link href="/store?media=merch"><T k="SHOP MERCH →"/></Link></div>
    </section>

    <section className="wearManifest shell">
      <span>01 / POSITION</span>
      <div><h2>Not separate<br/>from the release.</h2><p>Merch is treated as another physical format: typography, artwork, placement and production are developed as part of the same identity system.</p></div>
    </section>

    <section className="wearProducts shell">
      <div className="wearSectionHead"><span>02 / AVAILABLE OBJECTS</span><p>{products.length?products.length+' current product'+(products.length===1?'':'s'):'Catalogue in preparation'}</p></div>
      {products.length?<div className="wearGrid">{products.map((p,i)=><Link key={p.slug} href={'/store/'+p.slug} className="wearCard">
        <div className="wearVisual">{p.cover?<img src={p.cover} alt={p.title}/>:<div className="wearPlaceholder">SIDE:II<br/>OBJECT {String(i+1).padStart(2,'0')}</div>}</div>
        <div className="wearCardMeta"><small>{p.catalogue} · {String(p.merchCategory||'MERCH').toUpperCase()}</small><h3>{p.title}</h3><span>{p.variants?.[0]?.price!=null?<Money value={p.variants[0].price}/>:'VIEW PRODUCT'}</span></div>
      </Link>)}</div>:<div className="wearEmpty"><small>OBJECTS / IN PREPARATION</small><h3>The first SIDE:II objects will appear here when they are published from Control Room.</h3><Link href="/store">OPEN STORE →</Link></div>}
    </section>

    <section className="wearSystem">
      <div className="shell wearSystemInner"><span>03 / SYSTEM</span><p>Release → identity → object → <i>worn.</i></p><small>THE CATALOGUE DOES NOT END AT THE RECORD.</small></div>
    </section>

    <footer><div className="shell footerInner"><div className="footerLogo"><img src="/brand/sideii-logo-flat.png" alt="SIDE:II"/><small>INDEPENDENT PHYSICAL MUSIC LABEL</small></div><div className="footerNav"><Link href="/">HOME</Link><Link href="/store">STORE</Link><Link href="/wear">WEAR WHAT YOU SUPPORT</Link><Link href="/policies">STORE POLICIES</Link></div><div className="footerMeta"><span>SIDE:II · EST. MMXXVI</span><span>APPAREL · OBJECTS · EDITIONS</span><span>© MMXXVI SIDE:II</span></div></div></footer>
  </main>
}
