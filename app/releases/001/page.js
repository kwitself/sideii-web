import Link from 'next/link';

export const metadata = {
  title: 'SIDEII—001 · First Edition',
  description: 'SIDE:II First Edition — physical release preview.',
};

export default function Release001() {
  return (
    <main className="productPage">
      <header className="nav shell">
        <Link className="brand" href="/" aria-label="Side II home"><img src="/brand/sideii-logo-flat.png" alt="Side II" /></Link>
        <nav><Link href="/#releases">Releases</Link><Link href="/#imprints">Imprints</Link><Link href="/#about">About</Link><Link href="/#store">Store</Link></nav>
      </header>

      <section className="productHero shell">
        <div className="productVisual">
          <div className="productDisc" aria-hidden="true"><i /></div>
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
          <dl><div><dt>ARTIST</dt><dd>FORTHCOMING</dd></div><div><dt>FORMAT</dt><dd>VINYL · PHYSICAL RELEASE</dd></div><div><dt>CATALOGUE</dt><dd>SIDEII—001</dd></div><div><dt>STATUS</dt><dd>IN PREPARATION</dd></div></dl>
          <button className="productButton" disabled>ORDER · COMING SOON</button>
        </div>
      </section>

      <section className="productNote shell"><span>THE OBJECT</span><p>Selected music, given physical form. Artwork, edition details and release information will live here as the catalogue takes shape.</p><Link href="/#releases">← BACK TO CATALOGUE</Link></section>
    </main>
  );
}
