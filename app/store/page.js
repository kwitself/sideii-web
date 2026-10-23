import {getBuilderHomepageContent} from '../lib/server/homepage';
import '../catalogue.css';
import {getStoreCatalogue} from '../lib/catalogue';
import StoreClient from './StoreClient';
import './store.css';
import './storefront-polish.css';
import {getPublishedPage} from '../lib/server/pageBuilderPublic';
import PageCanvas from '../components/builder/PageCanvas';
import GlobalHeader from '../components/GlobalHeader';
export const revalidate=0;
export const metadata={title:'Store — Vinyl, CD, Cassette & Digital Editions',description:'Explore independent vinyl records, CDs, cassettes, digital releases and artist-led merch from SIDE:II and its associated imprints.'};
export default async function Store(){
 const [catalogue,custom]=await Promise.all([getStoreCatalogue(),getPublishedPage('store')]);
 const homeData = await getBuilderHomepageContent(custom?.document);
 if(custom)return <main><GlobalHeader/><PageCanvas document={custom.document} homeData={homeData} products={catalogue.releases} slots={{'store-catalogue':<StoreClient releases={catalogue.releases} unavailable={catalogue.unavailable} embedded/>}}/></main>;
 return <StoreClient releases={catalogue.releases} unavailable={catalogue.unavailable}/>;
}
