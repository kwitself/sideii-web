import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDatabaseRelease } from '../../lib/catalogue';
import EditionSelector from './EditionSelector';

export const revalidate = 0;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const release = await getDatabaseRelease(slug);
  if (!release) return {};
  return {
    title: `${release.catalogue} · ${release.title}`,
    description: `${release.artist} — ${release.title}. ${release.formatDetail}.`,
    openGraph:{title:`${release.artist} — ${release.title}`,description:release.lead,images:release.cover?[release.cover]:[]},
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
      <div className="productReleaseLayout"><div className={'productInfo releaseHeroIdentity '+(release.imprint==='lethargia'?'releaseHeroLethargia':'releaseHeroSideii')}>
        <div className="releaseHeroPair">
          <div className="releaseImprintWordmark">{release.imprint==='lethargia'?<img src="/brand/lethargia/lethargia-logo.png" alt="Lethargia Records"/>:<img src="/brand/sideii-logo-flat.png" alt="SIDE:II"/>}</div>
          <b className="releaseHeroX">×</b>
          <h1>{titleA}<br/><i>{titleB}</i></h1>
        </div>
        <span className="productIndex">{release.number} / RELEASE</span>
      </div><EditionSelector release={release}/></div>
    </section>
    {release.gallery.length>0&&<section className="releaseGallery shell"><span>OBJECT / DETAILS</span><div>{release.gallery.map((img,i)=><img src={img} alt={`${release.title} detail ${i+1}`} key={img}/>)}</div></section>}
    {release.tracks.length>0&&<section className="trackSection shell"><span>TRACKLIST</span><ol>{release.tracks.map((track,index)=><li key={`${track}-${index}`}><b>{String(index+1).padStart(2,'0')}</b><span>{track}</span></li>)}</ol></section>}
    <section className="productNote shell"><span>THE OBJECT</span><p>{release.note}</p>{release.credits&&<div className="releaseCredits"><b>CREDITS</b><p>{release.credits}</p></div>}<Link href="/#releases">← BACK TO CATALOGUE</Link></section>
  </main>;
}
