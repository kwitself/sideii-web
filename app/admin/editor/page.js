import AdminGate from '../AdminGate';
import PageBuilder from './PageBuilder';
import {getStoreCatalogue, getProductCredits, getPublicPressKit, getRelatedProducts, getProductBundles} from '../../lib/catalogue';
import {releaseSections} from '../../releases/[slug]/ReleaseSections';
import StoreClient from '../../store/StoreClient';
import '../admin.css';
import '../../store/store.css';
import '../../store/storefront-polish.css';
import '../../releases/[slug]/release-polish.css';
export const dynamic = 'force-dynamic';
export const metadata = {title: 'Visual Studio', robots: {index: false, follow: false}};
export default async function EditorPage() {
  const catalogue = await getStoreCatalogue(), products = catalogue.releases;
  let slots = {'store-catalogue': <StoreClient releases={products} unavailable={catalogue.unavailable} embedded/>};
  const release = products.find(product => !product.isMerch);
  if (release) {
    const [structuredCredits, pressKit, related, bundles] = await Promise.all([getProductCredits(release.id),getPublicPressKit(release.slug),getRelatedProducts(release.id,6),getProductBundles(release.id,3)]);
    slots = {...slots, ...releaseSections({release, structuredCredits, pressKit, related, bundles})};
  }
  return <AdminGate><PageBuilder products={products} slots={slots}/></AdminGate>;
}
