import {builderMetadata} from '../../lib/builder-design';
import {getBuilderHomepageContent} from '../../lib/server/homepage';
import {getBuilderProducts} from '../../lib/server/builderCatalogue';
import '../../catalogue.css';
import './release-polish.css';
import {Fragment} from 'react';
import {releaseSections} from './ReleaseSections';
import PageCanvas from '../../components/builder/PageCanvas';
import {getPublishedPage} from '../../lib/server/pageBuilderPublic';
import { notFound } from 'next/navigation';
import { getDatabaseRelease, getProductCredits, getPublicPressKit, getRelatedProducts, getProductBundles } from '../../lib/catalogue';
import GlobalHeader from '../../components/GlobalHeader';
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
  return builderMetadata((await getPublishedPage('product'))?.document,{
    title,
    description,
    alternates:{canonical:seo.canonical||('/releases/'+slug)},
    openGraph:{title,description,url:seo.canonical||('/releases/'+slug),images:ogImage?[ogImage]:[]},
    twitter:{card:'summary_large_image',title,description,images:ogImage?[ogImage]:[]},
  }, release);
}

export default async function ReleasePage({ params }) {
  const { slug } = await params;
  const release = await getDatabaseRelease(slug);
  if (!release) notFound();
  const structuredCredits = await getProductCredits(release.id);
  const pressKit = await getPublicPressKit(slug);
  const detail = release.storefrontConfig?.detail||{};
  const schema=productSchema(release);
  const [related,bundles,custom]=await Promise.all([
    detail.related===false?Promise.resolve([]):getRelatedProducts(release.id,6),
    detail.related===false?Promise.resolve([]):getProductBundles(release.id,3),
    getPublishedPage('product')
  ]);

  const [homeData, products] = await Promise.all([
    getBuilderHomepageContent(custom?.document,custom?.sharedDocuments),
    getBuilderProducts(custom?.document,custom?.sharedDocuments,[release,...related]),
  ]);
  const slots=releaseSections({release,structuredCredits,pressKit,related,bundles});
  return <main className={'productPage '+(release.imprint==='lethargia'?'productPageLethargia':'productPageSideii')}>
    {schema&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(schema)}}/>}
    <GlobalHeader/>
    {custom?<PageCanvas sharedDocuments={custom?.sharedDocuments} document={custom.document} homeData={homeData} products={products} slots={slots}/>:Object.entries(slots).map(([name,section])=><Fragment key={name}>{section}</Fragment>)}
  </main>;
}
