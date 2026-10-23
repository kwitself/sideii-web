import {getDatabaseReleases, getHomepageSelectedReleases, getHomepageStoreReleases} from '../catalogue';

import {flattenNodes} from '../page-builder';

export async function getBuilderHomepageContent(document) {
  return document && flattenNodes(document).some(node => node.type === 'siteSection') ? getHomepageContent() : {};
}

export async function getHomepageContent() {
  const [products, selected, storeReleases] = await Promise.all([
    getDatabaseReleases(), getHomepageSelectedReleases(), getHomepageStoreReleases(3),
  ]);
  return {products, featured: selected.length ? selected : products.filter(r => r.storefrontConfig?.visibility?.homepage !== false).slice(0, 3), storeReleases};
}
