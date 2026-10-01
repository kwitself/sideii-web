import Link from 'next/link';

const releases = [
  { cat:'LETH—001', no:'01', title:'NOCTURNE I', format:'VINYL · LIMITED EDITION', media:'vinyl' },
  { cat:'LETH—002', no:'02', title:'AFTERIMAGE', format:'CD · LIMITED EDITION', media:'cd' },
  { cat:'LETH—003', no:'03', title:'BLACK VEIL', format:'CASSETTE · LIMITED EDITION', media:'cassette' },
];

export default function Lethargia(){
 return <main className="lethargiaPage">
  <style>{`
    .lethHero{background:radial-gradient(circle at 82% 50%,rgba(72,24,31,.10),transparent 35%)}
    .lethOrb{right:-12vw!important;width:48vw!important;opacity:.22!important;background:repeating-radial-gradient(circle,rgba(117,72,78,.42) 0 1px,rgba(10,8,9,.04) 2px 7px)!important;box-shadow:0 35px 100px rgba(0,0,0,.55);transition:opacity .7s ease,transform 18s linear}
    .lethOrb:before{content:'';position:absolute;inset:3%;border-radius:50%;background:radial-gradient(circle at 38% 32%,rgba(255,255,255,.035),transparent 25%),linear-gradient(120deg,transparent 42%,rgba(255,255,255,.025) 50%,transparent 58%);pointer-events:none}
    .lethOrb:after{inset:44%!important;background:#4a1b23!important;box-shadow:0 0 0 9px rgba(7,6,7,.72),0 0 65px rgba(82,27,37,.24)!important}
    .lethHero:hover .lethOrb{opacity:.29!important;transform:rotate(7deg)}
    @media(max-width:800px){.lethOrb{right:-35vw!important;width:86vw!important;opacity:.16!important}.lethHero{background:radial-gradient(circle at 95% 50%,rgba(72,24,31,.08),transparent 42%)}}
  `}</style>
  <header className="lethNav shell"><Link href="/" className="lethBack">SIDE:II ↗</Link><div className="lethWord">Lethargia <i>Records</i></div><nav><a href="#releases">Releases</a><a href="#manifesto">Manifesto</a><a href="#store">Store</a></nav></header>
  <section className="lethHero shell"><div><small>A SIDE:II IMPRINT · EST. MMXXVI</small><h1>Lethargia<br/><i>Records</i></h1><p>Independent editions for<br/>distinctive sound.</p></div><div className="lethOrb" aria-hidden="true"><span/></div><a href="#releases" className="lethScroll">ENTER THE CATALOGUE ↓</a></section>
  <section id="manifesto" className="lethManifest shell"><span>01 / MANIFESTO</span><h2>Music made tangible.<br/><i>Edition by edition.</i></h2><p>Selected releases curated under Side:II and produced with attention to sound, artwork and physical form. Each edition is made to stand on its own.</p></section>
  <section id="releases" className="lethReleases shell"><div className="lethSectionHead"><span>02 / CATALOGUE</span><h2>Selected <i>editions.</i></h2></div><div className="lethGrid">{releases.map(r=><article className={`lethRelease ${r.media}`} key={r.cat}><div className="lethStage"><div className="lethDisc"><i/></div><div className="lethCover"><span>{r.cat}</span><b>{r.no}</b><strong>Lethargia</strong><em>Records</em><small>VIEW EDITION</small></div></div><div className="lethMeta"><span>{r.cat}</span><h3>{r.title}</h3><p>FORTHCOMING · {r.format}</p></div></article>)}</div></section>
  <section id="store" className="lethStore"><div className="shell"><span>03 / STORE</span><h2>Physical editions.<br/><i>Made to keep.</i></h2><p>Lethargia releases will be available through the Side:II store.</p><Link href="/#store">SIDE:II STORE ↗</Link></div></section>
  <footer className="lethFooter shell"><div><strong>Lethargia</strong><i>Records</i></div><span>A SIDE:II IMPRINT · MMXXVI</span><Link href="/">RETURN TO SIDE:II ↑</Link></footer>
 </main>
}
