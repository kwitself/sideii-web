import Link from 'next/link';
import GlobalHeader from '../../components/GlobalHeader';

export const metadata = {
  title: 'SIDEII—001 · First Edition',
  description: 'SIDE:II First Edition — CD digipak physical release preview.',
};

export default function Release001() {
  return (
    <main className="productPage">
      <GlobalHeader/>

      <section className="productHero shell">
        <div className="productVisual cd">
          <div className="productCdObject" aria-hidden="true">
            <div className="productCdDisc"><i /><b>SIDEII—001</b><span>side: II</span></div>
          </div>
          <div className="productCover">
            <span>SIDEII—001</span><b>01</b>
            <img src="/brand/sideii-logo-flat.png" alt="" />
            <em>FIRST EDITION</em>
          </div>
        </div>
        <div className="productInfo">
          <span className="productIndex">01 / RELEASE</span>
          <h1>First<br/><i>Edition.</i></h1>
          <p className="productLead">The first physical object in the SIDE:II catalogue.</p>
          <dl><div><dt>ARTIST</dt><dd>FORTHCOMING</dd></div><div><dt>FORMAT</dt><dd>CD · DIGIPAK EDITION</dd></div><div><dt>CATALOGUE</dt><dd>SIDEII—001</dd></div><div><dt>STATUS</dt><dd>IN PREPARATION</dd></div></dl>
          <button className="productButton" disabled>ORDER · COMING SOON</button>
        </div>
      </section>

      <section className="productNote shell"><span>THE OBJECT</span><p>A tactile CD digipak edition for selected music. Artwork, edition details and release information will live here as the catalogue takes shape.</p><Link href="/#releases">← BACK TO CATALOGUE</Link></section>
    </main>
  );
}
