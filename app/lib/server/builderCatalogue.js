import {getStoreReleases} from '../catalogue';
import {flattenNodes} from '../page-builder';

export async function getBuilderProducts(document, sharedDocuments = {}, fallback = []) {
  const needsCatalogue = [document, ...Object.values(sharedDocuments)]
    .filter(Boolean)
    .some(doc => flattenNodes(doc).some(node => node.type === 'album' || node.type === 'products'));

  // Match the editor's public catalogue, not the native section's curated list
  // or the current product's related items. Native sections keep their own data.
  return needsCatalogue ? getStoreReleases() : fallback;
}
