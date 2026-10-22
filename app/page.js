import './catalogue.css';
import {getPublishedPage} from './lib/server/pageBuilderPublic';
import {getHomepageContent} from './lib/server/homepage';
import {starterDocument} from './lib/page-builder-templates';
import PageCanvas from './components/builder/PageCanvas';

export const revalidate = 0;

export default async function Home() {
  const [custom, homeData] = await Promise.all([getPublishedPage('home'), getHomepageContent()]);
  return <main><PageCanvas document={custom?.document || starterDocument('home')} products={homeData.products} homeData={homeData} pageKey="home"/></main>;
}
