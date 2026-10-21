import {builderAdmin, builderResponse, boundedJson} from '../../../lib/server/pageBuilderAuth';
import {validateDocument, validPageKey} from '../../../lib/page-builder';
import {starterDocument} from '../../../lib/page-builder-templates';
const titles = {home: 'Ana sayfa', store: 'Mağaza', product: 'Ürün şablonu'};
const dbError = error => builderResponse({error: error.code === '40001' ? 'Sayfa başka bir oturumda değişti. Çalışmanı dışa aktarıp güncel sürümü yükle.' : ['42P01','PGRST205','PGRST202'].includes(error.code) ? 'Sayfa editörünün veritabanı kurulumu henüz tamamlanmamış.' : 'Sayfa kaydedilemedi veya yüklenemedi. Tekrar deneyin.'}, error.code === '40001' ? 409 : 503);
export async function GET(request) {
  try {
    const auth = await builderAdmin(request); if (auth.error) return builderResponse({error: auth.error}, auth.status);
    const params = new URL(request.url).searchParams, key = params.get('key');
    if (!key) {
      const {data, error} = await auth.client.from('site_builder_pages').select('page_key,title,version,updated_at').order('updated_at', {ascending: false});
      if (error) return dbError(error);
      return builderResponse({pages: data, userId: auth.user.id});
    }
    if (!validPageKey(key)) return builderResponse({error: 'Geçersiz sayfa.'}, 400);
    if (params.get('history') === '1') {
      const {data, error} = await auth.client.from('site_builder_revisions').select('id,title,version,action,created_at').eq('page_key', key).order('version', {ascending: false}).limit(50);
      return error ? dbError(error) : builderResponse({revisions: data});
    }
    const [page, publication] = await Promise.all([
      auth.client.from('site_builder_pages').select('*').eq('page_key', key).maybeSingle(),
      auth.client.from('site_builder_publications').select('version,published_at').eq('page_key', key).maybeSingle(),
    ]);
    if (page.error || publication.error) return dbError(page.error || publication.error);
    return builderResponse({page: page.data || {page_key: key, title: titles[key] || key.slice(5), draft_document: starterDocument(key), version: 0}, publishedVersion: publication.data?.version ?? null, publishedAt: publication.data?.published_at ?? null, userId: auth.user.id});
  } catch {return builderResponse({error: 'Editör verisine ulaşılamadı. Tekrar deneyin.'}, 503);}
}
export async function POST(request) {
  try {
    const auth = await builderAdmin(request); if (auth.error) return builderResponse({error: auth.error}, auth.status);
    let body;
    try {body = await boundedJson(request);} catch (error) {return builderResponse({error: error.message}, 400);}
    const {key, action, expectedVersion} = body;
    if (!validPageKey(key) || !['save','publish','unpublish','restore'].includes(action) || !Number.isSafeInteger(expectedVersion) || expectedVersion < 0) return builderResponse({error: 'Geçersiz işlem.'}, 400);
    let title = body.title, input = body.document;
    if (action === 'restore') {
      if (!Number.isSafeInteger(body.revisionId)) return builderResponse({error: 'Geçersiz sürüm.'}, 400);
      const revision = await auth.client.from('site_builder_revisions').select('title,document').eq('id', body.revisionId).eq('page_key', key).maybeSingle();
      if (revision.error) return dbError(revision.error);
      if (!revision.data) return builderResponse({error: 'Sürüm bulunamadı.'}, 404);
      title = revision.data.title; input = revision.data.document;
    }
    if (typeof title !== 'string' || !title.trim() || title.trim().length > 120) return builderResponse({error: 'Sayfa adı 1–120 karakter olmalı.'}, 400);
    let document;
    try {document = validateDocument(input, key, {publishing: action === 'publish'});} catch (error) {return builderResponse({error: error.message}, 400);}
    const {data, error} = await auth.client.rpc('save_site_builder_page', {p_key: key, p_title: title.trim(), p_document: document, p_expected_version: expectedVersion, p_action: action});
    return error ? dbError(error) : builderResponse(data);
  } catch {return builderResponse({error: 'Bağlantı kesildi. Kaydetmeden önce güncel sürümü kontrol edin.'}, 503);}
}
