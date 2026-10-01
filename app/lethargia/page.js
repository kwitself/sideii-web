import Link from 'next/link';

const releases = [
  { cat:'LETH—001', no:'01', title:'NOCTURNE I', format:'VINYL · LIMITED EDITION', media:'vinyl' },
  { cat:'LETH—002', no:'02', title:'AFTERIMAGE', format:'CD · LIMITED EDITION', media:'cd' },
  { cat:'LETH—003', no:'03', title:'BLACK VEIL', format:'CASSETTE · LIMITED EDITION', media:'cassette' },
];

export default function Lethargia(){
 return <main className="lethargiaPage">
  <header className="lethNav shell"><Link href="/" className="lethBack">SIDE:II ↗</Link><div className="lethWord">Lethargia <i>Records</i></div><nav><a href="#releases">Releases</a><a href="#manifesto">Manifesto</a><a href="#store">Store</a></nav></header>
  <section className="lethHero shell"><div><small>A SIDE:II IMPRINT · EST. MMXXVI</small><h1>Lethargia<br/><i>Records</i></h1><p>For music that lives<br/>in the shadows.</p></div><div className="lethOrb" aria-hidden="true"><span/></div><a href="#releases" className="lethScroll">ENTER THE CATALOGUE ↓</a></section>
  <section id="manifesto" className="lethManifest shell"><span>01 / MANIFESTO</span><h2>Dark music deserves<br/>a <i>physical presence.</i></h2><p>Atmospheric, uncompromising editions curated under Side:II. Each release is treated as an artefact — not disposable media.</p></section>
  <section id="releases" className="lethReleases shell"><div className="lethSectionHead"><span>02 / CATALOGUE</span><h2>Selected <i>shadows.</i></h2></div><div className="lethGrid">{releases.map(r=><article className={`lethRelease ${r.media}`} key={r.cat}><div className="lethStage"><div className="lethDisc"><i/></div><div className="lethCover"><span>{r.cat}</span><b>{r.no}</b><strong>Lethargia</strong><em>Records</em><small>VIEW EDITION</small></div></div><div className="lethMeta"><span>{r.cat}</span><h3>{r.title}</h3><p>FORTHCOMING · {r.format}</p></div></article>)}</div></section>
  <section id="store" className="lethStore"><div className="shell"><span>03 / STORE</span><h2>Objects from<br/><i>the shadows.</i></h2><p>Lethargia editions will be available through the Side:II store.</p><Link href="/#store">SIDE:II STORE ↗</Link></div></section>
  <footer className="lethFooter shell"><div><strong>Lethargia</strong><i>Records</i></div><span>A SIDE:II IMPRINT · MMXXVI</span><Link href="/">RETURN TO SIDE:II ↑</Link></footer>
 </main>
}
