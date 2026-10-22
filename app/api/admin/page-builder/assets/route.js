import {builderAdmin, builderResponse} from '../../../../lib/server/pageBuilderAuth';
export async function GET(request) {
  try {
    const auth = await builderAdmin(request); if (auth.error) return builderResponse({error: auth.error}, auth.status);
    const {data, error} = await auth.client.storage.from('site-builder-assets').list('images', {limit: 100, sortBy: {column: 'created_at', order: 'desc'}});
    if (error) return builderResponse({error: 'Görsel arşivi yüklenemedi.'}, 503);
    return builderResponse({assets: data.filter(x => x.id).map(x => ({name: x.name, url: auth.client.storage.from('site-builder-assets').getPublicUrl('images/' + x.name).data.publicUrl}))});
  } catch {return builderResponse({error: 'Görsel arşivine ulaşılamadı.'}, 503);}
}
