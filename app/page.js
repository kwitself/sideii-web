import {builderMetadata} from './lib/builder-design';
import './catalogue.css';
import {getPublishedPage} from './lib/server/pageBuilderPublic';
import {getHomepageContent} from './lib/server/homepage';
import {getBuilderProducts} from './lib/server/builderCatalogue';
import {starterDocument} from './lib/page-builder-templates';
import PageCanvas from './components/builder/PageCanvas';

export const revalidate = 0;

export async function generateMetadata(){return builderMetadata((await getPublishedPage('home'))?.document);}

export default async function Home() {
  const [custom, homeData] = await Promise.all([getPublishedPage('home'), getHomepageContent()]);
  const document = custom?.document || starterDocument('home');
  const products = await getBuilderProducts(document, custom?.sharedDocuments, homeData.products);
  return <main><PageCanvas sharedDocuments={custom?.sharedDocuments} document={document} products={products} homeData={homeData} pageKey="home"/></main>;
}
