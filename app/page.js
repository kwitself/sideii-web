const releases = [
  { cat: 'SIDEII—001', no: '01', title: 'FIRST EDITION', artist: 'FORTHCOMING', format: 'CD · PHYSICAL RELEASE' },
  { cat: 'SIDEII—002', no: '02', title: 'SECOND EDITION', artist: 'FORTHCOMING', format: 'VINYL · PHYSICAL RELEASE' },
];

export default function Home() {
  return (
    <main>
      <header className="nav shell">
        <a className="brand" href="#top" aria-label="Side II home"><img src="/brand/sideii-logo-flat.png" alt="Side II" /></a>
        <nav><a href="#releases">Releases</a><a href="#imprints">Imprints</a><a href="#about">About</a><a href="#store">Store</a></nav>
      </header>

      <section id="top" className="hero shell">
        <div className="heroCore">
          <div className="eyebrow">INDEPENDENT PHYSICAL MUSIC LABEL · EST. MMXXVI</div>
          <div className="heroLogo"><img src="/brand/sideii-logo-silver.png" alt="Side II" /></div>
          <p className="tagline">The other side of sound.</p>
        </div>
        <a className="scrollCue" href="#manifesto"><span>SCROLL TO DISCOVER</span><b>↓</b></a>
        <div className="heroFoot"><span>SELECTED RELEASES</span><span>CD · VINYL · CASSETTE · LIMITED EDITIONS</span></div>
      </section>

      <section id="manifesto" className="statement shell">
        <p>Music deserves<br/>an <em>object.</em></p>
        <div><span>01 / PHILOSOPHY</span><p>Selected music, given physical form. No genre boundaries. No disposable editions.</p><small>MADE TO BE HEARD. MADE TO BE KEPT.</small></div>
      </section>

      <section id="releases" className="section shell">
        <div className="sectionHead"><span>02 / CATALOGUE</span><h2>Selected<br/><i>releases.</i></h2></div>
        <div className="releaseGrid">
          {releases.map((r) => <article className="release" key={r.cat}>
            <div className="cover"><span>{r.cat}</span><b>{r.no}</b><div className="disc"/><img className="coverLogo" src="/brand/sideii-logo-flat.png" alt="" /><em>DETAILS FORTHCOMING</em></div>
            <div className="releaseMeta"><span>{r.cat}</span><h3>{r.title}</h3><p>{r.artist} · {r.format}</p></div>
          </article>)}
        </div>
        <div className="catalogueFoot"><p className="forthcoming">First editions forthcoming.</p><span>THE CATALOGUE BEGINS HERE.</span></div>
      </section>

      <section id="imprints" className="imprint">
        <div className="shell imprintInner"><span>03 / IMPRINT</span><div><small className="imprintKicker">SIDE:II PRESENTS</small><h2>Lethargia<br/><i>Records</i></h2><p>Independent imprint for darker sounds.<br/>Selected physical editions.</p><small>A SIDE:II IMPRINT · EST. MMXXVI</small></div></div>
      </section>

      <section id="about" className="section about shell">
        <div className="sectionHead"><span>04 / ABOUT</span><h2>Beyond<br/>the <i>format.</i></h2></div>
        <div className="aboutCopy"><p>Side:II is an independent music label focused on selected physical editions. We treat every release as an object worth keeping — from compact disc to vinyl, cassette and limited editions.</p><p>Artists keep their identity.<br/>We build the edition around it.</p><div className="formats"><span>01 CD</span><span>02 VINYL</span><span>03 CASSETTE</span><span>04 LIMITED</span></div></div>
      </section>

      <section id="store" className="store shell"><span>05 / STORE</span><h2>The shelf is<br/><em>almost</em> ready.</h2><div className="storeRow"><p>Our first physical editions are in preparation.</p><button disabled>STORE · COMING SOON</button></div></section>

      <footer className="shell"><div className="footerLogo"><img src="/brand/sideii-logo-flat.png" alt="Side II" /></div><div><span>INDEPENDENT PHYSICAL MUSIC LABEL</span><span>THE OTHER SIDE OF SOUND.</span><span>© MMXXVI SIDE:II</span></div></footer>
    </main>
  );
}
