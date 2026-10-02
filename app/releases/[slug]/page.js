import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDatabaseRelease } from '../../lib/catalogue';

export const revalidate = 0;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const release = await getDatabaseRelease(slug);
  if (!release) return {};
  return {
    title: `${release.catalogue} · ${release.title}`,
    description: `${release.artist} — ${release.title}. ${release.formatDetail}.`,
  };
}

export default async function ReleasePage({ params }) {
  const { slug } = await params;
  const release = await getDatabaseRelease(slug);
  if (!release) notFound();
  const [titleA, titleB] = release.displayTitle;
  const isCassette = release.media === 'cassette';

  return <main className="productPage">
    <header className="nav shell"><Link className="brand" href="/" aria-label="Side II home"><img src="/brand/sideii-logo-flat.png" alt="Side II" /></Link><nav><Link href="/#releases">Releases</Link><Link href="/#imprints">Imprints</Link><Link href="/#about">About</Link><Link href="/#store">Store</Link></nav></header>
    <section className="productHero shell">
      <div className={`productVisual ${release.media}`}>
        {isCassette ? <div className="productCassette" aria-hidden="true"><div className="productCassetteLabel"><span>SIDE:II</span><b>{release.number}</b></div><div className="productCassetteWindow"><i/><i/></div><div className="productCassetteBase"><i/><i/><i/></div></div> : <div className="productCdObject" aria-hidden="true"><div className="productCdDisc"><i/><b>SIDE:II</b><span>{release.number}</span></div></div>}
        <div className="productCover">{release.cover?<img className="productArtwork" src={release.cover} alt={`${release.artist} — ${release.title}`} />:<><span>{release.catalogue}</span><b>{release.number}</b><img src="/brand/sideii-logo-flat.png" alt="" /><em>{release.title}</em></>}</div>
      </div>
      <div className="productInfo"><span className="productIndex">{release.number} / RELEASE</span><h1>{titleA}<br/><i>{titleB}</i></h1><p className="productLead">{release.lead}</p><dl><div><dt>ARTIST</dt><dd>{release.artist}</dd></div><div><dt>FORMAT</dt><dd>{release.formatDetail}</dd></div><div><dt>CATALOGUE</dt><dd>{release.catalogue}</dd></div><div><dt>EDITION</dt><dd>{release.edition}</dd></div><div><dt>RELEASE</dt><dd>{release.releaseDate}</dd></div><div><dt>STATUS</dt><dd>{release.status}</dd></div></dl>{release.orderUrl?<a className="productButton" href={release.orderUrl}>ORDER EDITION →</a>:<button className="productButton" disabled>ORDER · COMING SOON</button>}</div>
    </section>
    {release.tracks.length>0&&<section className="trackSection shell"><span>TRACKLIST</span><ol>{release.tracks.map((track,index)=><li key={`${track}-${index}`}><b>{String(index+1).padStart(2,'0')}</b><span>{track}</span></li>)}</ol></section>}
    <section className="productNote shell"><span>THE OBJECT</span><p>{release.note}</p><Link href="/#releases">← BACK TO CATALOGUE</Link></section>
  </main>;
}
