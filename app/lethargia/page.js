import Link from 'next/link';
import { getLethargiaReleases } from '../lib/catalogue';

export const revalidate = 0;

export default async function Lethargia(){
 const releases=await getLethargiaReleases();
 return <main className="lethargiaPage">
  <style>{`
    .lethargiaPage .shell{width:min(1760px,calc(100% - 96px))}
    .lethHero{background:radial-gradient(circle at 82% 50%,rgba(72,24,31,.10),transparent 35%)}
    .lethOrb{right:-8vw!important;width:54vw!important;opacity:.22!important;background:repeating-radial-gradient(circle,rgba(117,72,78,.42) 0 1px,rgba(10,8,9,.04) 2px 7px)!important;box-shadow:0 35px 100px rgba(0,0,0,.55);transition:opacity .7s ease,transform 18s linear}
    .lethOrb:before{content:'';position:absolute;inset:3%;border-radius:50%;background:radial-gradient(circle at 38% 32%,rgba(255,255,255,.035),transparent 25%),linear-gradient(120deg,transparent 42%,rgba(255,255,255,.025) 50%,transparent 58%);pointer-events:none}
    .lethOrb:after{inset:44%!important;background:#4a1b23!important;box-shadow:0 0 0 9px rgba(7,6,7,.72),0 0 65px rgba(82,27,37,.24)!important}
    .lethHero:hover .lethOrb{opacity:.29!important;transform:rotate(7deg)}
    .lethBrandLogo{display:block;width:min(610px,72vw);height:auto;object-fit:contain}
    .lethNavLogo{display:block;width:150px;max-height:48px;object-fit:contain}
    .lethFooterLogo{display:block;width:154px;height:auto;object-fit:contain}
    .lethRelease{text-decoration:none;color:inherit}.lethCover{position:relative;overflow:hidden}.lethCover>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0}.lethCover>small{position:absolute;z-index:4}.lethCover.shrinkwrap:after{content:'';position:absolute;inset:-20%;z-index:3;background:linear-gradient(112deg,transparent 34%,rgba(255,255,255,.12) 46%,rgba(255,255,255,.035) 51%,transparent 60%);transform:rotate(-7deg);pointer-events:none}.lethEmpty{grid-column:1/-1;border-top:1px solid rgba(255,255,255,.1);padding:38px 0;color:#756a6c;font-style:italic}
    @media(max-width:800px){.lethargiaPage .shell{width:calc(100% - 36px)}.lethOrb{right:-35vw!important;width:92vw!important;opacity:.16!important}.lethHero{background:radial-gradient(circle at 95% 50%,rgba(72,24,31,.08),transparent 42%)}.lethBrandLogo{width:min(420px,82vw)}.lethNavLogo{width:112px}}
  `}</style>
  <header className="lethNav shell"><Link href="/" className="lethBack">SIDE:II ↗</Link><div className="lethWord"><img className="lethNavLogo" src="/brand/lethargia/lethargia-logo.png" alt="Lethargia Records" /></div><nav><a href="#releases">Releases</a><a href="#manifesto">Manifesto</a><a href="#store">Store</a></nav></header>
  <section className="lethHero shell"><div><small>A SIDE:II IMPRINT · EST. MMXXVI</small><img className="lethBrandLogo" src="/brand/lethargia/lethargia-logo.png" alt="Lethargia Records" /><p>Independent editions.<br/>Defined by each release.</p></div><div className="lethOrb" aria-hidden="true"><span/></div><a href="#releases" className="lethScroll">ENTER THE CATALOGUE ↓</a></section>
  <section id="manifesto" className="lethManifest shell"><span>01 / MANIFESTO</span><h2>Music, artwork, format.<br/><i>One complete edition.</i></h2><p>Lethargia develops physical releases under Side:II with each project treated on its own terms. Sound, artwork and format are considered together rather than fitted to a house style.</p></section>
  <section id="releases" className="lethReleases shell"><div className="lethSectionHead"><span>02 / CATALOGUE</span><h2>Current <i>editions.</i></h2></div><div className="lethGrid">{releases.length?releases.map(r=><Link href={`/releases/${r.slug}`} className={`lethRelease ${r.media}`} key={r.catalogue}><div className="lethStage"><div className="lethDisc"><i/></div><div className={`lethCover ${r.hasShrinkwrap?'shrinkwrap':''}`}>{r.cover?<img src={r.cover} alt={r.title}/>:<><span>{r.catalogue}</span><b>{r.number}</b><strong>Lethargia</strong><em>Records</em></>}<small>VIEW EDITION</small></div></div><div className="lethMeta"><span>{r.catalogue}</span><h3>{r.title}</h3><p>{r.status} · {r.formatDetail}</p></div></Link>):<div className="lethEmpty">No public Lethargia editions yet.</div>}</div></section>
  <section id="store" className="lethStore"><div className="shell"><span>03 / STORE</span><h2>Records in physical form.<br/><i>Sound, artwork, object.</i></h2><p>Lethargia editions will be available through the Side:II store.</p><Link href="/#store">SIDE:II STORE ↗</Link></div></section>
  <footer className="lethFooter shell"><div><img className="lethFooterLogo" src="/brand/lethargia/lethargia-logo.png" alt="Lethargia Records" /></div><span>A SIDE:II IMPRINT · MMXXVI</span><Link href="/">RETURN TO SIDE:II ↑</Link></footer>
 </main>
}
