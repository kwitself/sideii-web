import {builderMetadata} from '../lib/builder-design';
import {getBuilderHomepageContent} from '../lib/server/homepage';
import '../catalogue.css';
import {getStoreCatalogue} from '../lib/catalogue';
import StoreClient from './StoreClient';
import './store.css';
import './storefront-polish.css';
import {getPublishedPage} from '../lib/server/pageBuilderPublic';
import {starterDocument} from '../lib/page-builder-templates';
import PageCanvas from '../components/builder/PageCanvas';
import GlobalHeader from '../components/GlobalHeader';
export const revalidate=0;
const fallbackMetadata={title:'Store — Vinyl, CD, Cassette & Digital Editions',description:'Explore independent vinyl records, CDs, cassettes, digital releases and artist-led merch from SIDE:II and its associated imprints.'};
export async function generateMetadata(){return builderMetadata((await getPublishedPage('store'))?.document,fallbackMetadata);}
export default async function Store(){
 const [catalogue,custom]=await Promise.all([getStoreCatalogue(),getPublishedPage('store')]);
 const document = custom?.document || starterDocument('store');
 const homeData = await getBuilderHomepageContent(document,custom?.sharedDocuments);
 return <main><GlobalHeader/><PageCanvas sharedDocuments={custom?.sharedDocuments} document={document} pageKey="store" homeData={homeData} products={catalogue.releases} slots={{'store-catalogue':<StoreClient releases={catalogue.releases} unavailable={catalogue.unavailable} embedded/>}}/></main>;
}
