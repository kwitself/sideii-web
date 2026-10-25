import {createClient} from '@supabase/supabase-js';
import {cache} from 'react';
import {validateDocument, validPageKey, sharedKeys, flattenNodes} from '../page-builder';
import {effectivePublication} from '../builder-publication';
export function builderPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? createClient(url, key, {auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false}, global: {fetch: (url, options) => fetch(url, {...options, cache: 'no-store', signal: AbortSignal.timeout(5000)})}}) : null;
}
const getSnapshot = cache(async key => {
  if (!validPageKey(key)) return null;
  const client = builderPublicClient(); if (!client) return null;
  try {
    const [live,schedule] = await Promise.all([
      client.from('site_builder_publications').select('title,document,version,published_at').eq('page_key', key).maybeSingle(),
      client.from('site_builder_schedules').select('title,document,version,publish_at').eq('page_key',key).lte('publish_at',new Date().toISOString()).maybeSingle(),
    ]);
    const error=live.error,data=effectivePublication(live.data,schedule.error?null:schedule.data);
    if (error) {if (!['42P01','PGRST205'].includes(error.code)) console.error('Page builder publication unavailable:', error.code); return null;}
    return data ? {...data, document: validateDocument(data.document, key, {publishing: true})} : null;
  } catch (error) {console.error('Page builder publication rejected:', error.name); return null;}
});
export async function getPublicSharedDocuments(document) {
  const keys=sharedKeys(document).filter(Boolean).slice(0,20),result={};let count=0;
  for(const [key,page]of await Promise.all(keys.map(async key=>[key,await getSnapshot(key)]))){if(page){count+=flattenNodes(page.document).length;if(count<=1500)result[key]=page.document;}}
  return result;
}
export const getPublishedPage=cache(async key=>{const page=await getSnapshot(key);return page?{...page,sharedDocuments:await getPublicSharedDocuments(page.document)}:null;});
