import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDatabaseRelease, getProductCredits } from '../../lib/catalogue';
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
  const structuredCredits = await getProductCredits(release.id);
  const [titleA, titleB] = release.displayTitle;
  const isCassette = release.media === 'cassette';

  return <main className={'productPage '+(release.imprint==='lethargia'?'productPageLethargia':'productPageSideii')}>
    <header className="nav shell"><Link className="brand" href="/" aria-label="Side II home"><img src="/brand/sideii-logo-flat.png" alt="Side II" /></Link><nav><Link href="/#releases">Releases</Link><Link href="/#imprints">Imprints</Link><Link href="/#about">About</Link><Link href="/store">Store</Link></nav></header>
    <section className="productHero shell">
      <div className="productReleaseLayout"><div className={'productInfo releaseHeroIdentity '+(release.imprint==='lethargia'?'releaseHeroLethargia':'releaseHeroSideii')}>
        <div className="releaseHeroPair">
          <div className="releaseImprintWordmark">{release.imprint==='lethargia'?<Link href="/imprints/lethargia" aria-label="Open Lethargia Records imprint"><img src="/brand/lethargia/lethargia-logo.png" alt="Lethargia Records"/></Link>:<Link href="/" aria-label="Open SIDE:II"><img src="/brand/sideii-logo-flat.png" alt="SIDE:II"/></Link>}</div>
          <b className="releaseHeroX">×</b>
          <h1>{titleA}<br/><i>{titleB}</i></h1>
        </div>
        <span className="productIndex">{release.number} / RELEASE</span>
      </div><EditionSelector release={release}/></div>
    </section>
    {release.imprint==='lethargia'&&<section className="releaseImprintStrip shell"><div><small>A SIDE:II IMPRINT</small><img src="/brand/lethargia/lethargia-logo.png" alt="Lethargia Records"/></div><p>Release identity follows the work: sound, artwork and format developed as one object.</p><Link href="/imprints/lethargia">OPEN IMPRINT ↗</Link></section>}
    {release.gallery.length>0&&<section className="releaseGallery shell"><span>OBJECT / DETAILS</span><div>{release.gallery.map((img,i)=><img src={img} alt={`${release.title} detail ${i+1}`} key={img}/>)}</div></section>}
    {release.listeningPreviewUrl&&<section className="releaseListen shell"><span>LISTEN / PREVIEW</span><div><p>A short catalogue preview.</p><audio controls preload="none" src={release.listeningPreviewUrl}/></div></section>}{release.digitalBookletUrl&&<section className="releaseBooklet shell"><span>DIGITAL BOOKLET</span><div><p>Artwork, notes and release details.</p><a href={release.digitalBookletUrl} target="_blank" rel="noreferrer">OPEN BOOKLET ↗</a></div></section>}{release.tracks.length>0&&<section className="trackSection shell"><span>TRACKLIST</span><ol>{release.tracks.map((track,index)=><li key={`${track}-${index}`}><b>{String(index+1).padStart(2,'0')}</b><span>{track}</span></li>)}</ol></section>}
    <section className="productNote shell"><span>THE OBJECT</span><small className="pressingMeta">{release.pressingLabel} · PRESSING {release.pressingGeneration}</small><p>{release.note}</p>{structuredCredits.length>0?<div className="releaseCredits structured"><b>CREDITS</b>{structuredCredits.map((x,i)=><p key={i}><span>{x.role}</span>{x.person_name}</p>)}</div>:release.credits&&<div className="releaseCredits"><b>CREDITS</b><p>{release.credits}</p></div>}<Link href={release.imprint==='lethargia'?'/imprints/lethargia':'/#releases'}>← BACK TO {release.imprint==='lethargia'?'LETHARGIA':'CATALOGUE'}</Link></section>
  </main>;
}
