import {effectivePublication} from '../builder-publication';
import {getPublicSharedDocuments} from './pageBuilderPublic';
export async function publicationState(client,key,document) {
  const [live,schedule]=await Promise.all([client.from('site_builder_publications').select('*').eq('page_key',key).maybeSingle(),client.from('site_builder_schedules').select('*').eq('page_key',key).maybeSingle()]);
  if(live.error)throw new Error('Yayın verisi yüklenemedi.');
  if(schedule.error&&!['42P01','PGRST205'].includes(schedule.error.code))throw new Error('Yayın planı yüklenemedi.');
  const current=effectivePublication(live.data,schedule.data),pending=schedule.data&&Date.parse(schedule.data.publish_at)>Date.now()?schedule.data:null;
  return {publishedVersion:current?.version??null,publishedAt:current?.published_at??null,publishedDocument:current?.document??null,publishedTitle:current?.title??null,pendingSchedule:pending?{version:pending.version,publish_at:pending.publish_at}:null,sharedDocuments:await getPublicSharedDocuments(document)};
}
