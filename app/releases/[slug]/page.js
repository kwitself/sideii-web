import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDatabaseRelease, getProductCredits, getPublicPressKit, getRelatedProducts, getProductBundles } from '../../lib/catalogue';
import EditionSelector from './EditionSelector';
import GlobalHeader from '../../components/GlobalHeader';
import ProductDiscovery from '../../components/ProductDiscovery';
import ProductShare from '../../components/ProductShare';
import ProductLaunchGate from '../../components/ProductLaunchGate';
import {jsonLd,productSchema} from '../../lib/productCommerceMeta';

export const revalidate = 0;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const release = await getDatabaseRelease(slug);
  if (!release) return {};
  const seo=release.seoConfig||{};
  const title=seo.title||`${release.catalogue} · ${release.title}`;
  const description=seo.description||`${release.artist} — ${release.title}. ${release.formatDetail}.`;
  const ogImage=seo.og_image||('/api/share-card/release/'+encodeURIComponent(slug)+'?preset=link');
  return {
    title,
    description,
    alternates:{canonical:seo.canonical||('/releases/'+slug)},
    openGraph:{title,description,url:seo.canonical||('/releases/'+slug),images:ogImage?[ogImage]:[]},
    twitter:{card:'summary_large_image',title,description,images:ogImage?[ogImage]:[]},
  };
}

export default async function ReleasePage({ params }) {
  const { slug } = await params;
  const release = await getDatabaseRelease(slug);
  if (!release) notFound();
  const structuredCredits = await getProductCredits(release.id);
  const pressKit = await getPublicPressKit(slug);
  const [titleA, titleB] = release.displayTitle;
  const detail = release.storefrontConfig?.detail||{};
  const isCassette = release.media === 'cassette';
  const schema=productSchema(release);
  const [related,bundles]=await Promise.all([
    detail.related===false?Promise.resolve([]):getRelatedProducts(release.id,6),
    detail.related===false?Promise.resolve([]):getProductBundles(release.id,3)
  ]);

  return <main className={'productPage '+(release.imprint==='lethargia'?'productPageLethargia':'productPageSideii')}>
    {schema&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(schema)}}/>}
    <GlobalHeader/>
    <section className="productHero shell">
      <div className="productReleaseLayout"><div className={'productInfo releaseHeroIdentity '+(release.imprint==='lethargia'?'releaseHeroLethargia':'releaseHeroSideii')}>
        <div className="releaseHeroPair">
          <div className="releaseImprintWordmark">{release.imprint==='lethargia'?<Link href="/imprints/lethargia" aria-label="Open Lethargia Records imprint"><img src="/brand/lethargia/lethargia-logo.png" alt="Lethargia Records"/></Link>:<Link href="/" aria-label="Open SIDE:II"><img src="/brand/sideii-logo-flat.png" alt="SIDE:II"/></Link>}</div>
          <b className="releaseHeroX">×</b>
          <h1>{titleA}<br/><i>{titleB}</i></h1>
        </div>
        <span className="productIndex">{release.number} / RELEASE</span>
        <ProductShare product={release} kind="release"/><ProductLaunchGate productId={release.id}/>
      </div><EditionSelector release={release}/></div>
    </section>
    {release.imprint==='lethargia'&&<section className="releaseImprintStrip shell"><div><small>A SIDE:II IMPRINT</small><img src="/brand/lethargia/lethargia-logo.png" alt="Lethargia Records"/></div><p>Release identity follows the work: sound, artwork and format developed as one object.</p><Link href="/imprints/lethargia">OPEN IMPRINT ↗</Link></section>}
    {release.gallery.length>0&&<section className={"releaseGallery shell gallery-"+(detail.gallery_layout||'grid')}><span>OBJECT / DETAILS</span><div>{release.gallery.map((img,i)=><img src={img} alt={`${release.title} detail ${i+1}`} key={img}/>)}</div></section>}
    {detail.listening_preview!==false&&release.listeningPreviewUrl&&<section className="releaseListen shell"><span>LISTEN / PREVIEW</span><div><p>A short catalogue preview.</p><audio controls preload="none" src={release.listeningPreviewUrl}/></div></section>}{release.digitalBookletUrl&&<section className="releaseBooklet shell"><span>DIGITAL BOOKLET</span><div><p>Artwork, notes and release details.</p><a href={release.digitalBookletUrl} target="_blank" rel="noreferrer">OPEN BOOKLET ↗</a></div></section>}{detail.tracklist!==false&&release.tracks.length>0&&<section className="trackSection shell"><span>TRACKLIST</span><ol>{release.tracks.map((track,index)=><li key={index}><b>{String(index+1).padStart(2,'0')}</b><span>{typeof track==='string'?track:(track?.title||track?.name||track?.label||`Track ${index+1}`)}</span></li>)}</ol></section>}
    <section className="productNote shell"><span>{detail.object_note!==false?'THE OBJECT':'RELEASE'}</span><small className="pressingMeta">{release.pressingLabel} · PRESSING {release.pressingGeneration}</small>{detail.object_note!==false&&<p>{release.note}</p>}{detail.press_kit!==false&&pressKit&&<div className="releasePressEntry"><Link href={'/press/'+slug}>PRESS / MEDIA KIT ↗</Link></div>}{detail.credits!==false&&(structuredCredits.length>0?<div className="releaseCredits structured"><b>CREDITS</b>{structuredCredits.map((x,i)=><p key={i}><span>{x.role}</span>{x.person_name}</p>)}</div>:release.credits&&<div className="releaseCredits"><b>CREDITS</b><p>{release.credits}</p></div>)}<Link href={release.imprint==='lethargia'?'/imprints/lethargia':'/#releases'}>← BACK TO {release.imprint==='lethargia'?'LETHARGIA':'CATALOGUE'}</Link></section>
    {detail.related!==false&&<ProductDiscovery current={release} related={related} bundles={bundles}/>} 
  </main>;
}
