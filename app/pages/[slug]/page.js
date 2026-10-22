import {notFound} from 'next/navigation';
import {getPublishedPage} from '../../lib/server/pageBuilderPublic';
import {getStoreCatalogue} from '../../lib/catalogue';
import PageCanvas from '../../components/builder/PageCanvas';
import GlobalHeader from '../../components/GlobalHeader';
import StorefrontFooter from '../../components/StorefrontFooter';
export const revalidate = 0;
export async function generateMetadata({params}) {
  const {slug} = await params, page = await getPublishedPage('page:' + slug);
  return page ? {title: page.title, alternates: {canonical: '/pages/' + slug}} : {title: 'Page not found', robots: {index: false, follow: false}};
}
export default async function CustomPage({params}) {
  const {slug} = await params, page = await getPublishedPage('page:' + slug);
  if (!page) notFound();
  const catalogue = await getStoreCatalogue();
  return <><main><GlobalHeader/><PageCanvas document={page.document} products={catalogue.releases}/></main><StorefrontFooter force/></>;
}
