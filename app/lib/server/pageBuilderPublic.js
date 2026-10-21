import {createClient} from '@supabase/supabase-js';
import {validateDocument, validPageKey} from '../page-builder';
export function builderPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? createClient(url, key, {auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false}, global: {fetch: (url, options) => fetch(url, {...options, cache: 'no-store', signal: AbortSignal.timeout(5000)})}}) : null;
}
export async function getPublishedPage(key) {
  if (!validPageKey(key)) return null;
  const client = builderPublicClient(); if (!client) return null;
  try {
    const {data, error} = await client.from('site_builder_publications').select('title,document,version,published_at').eq('page_key', key).maybeSingle();
    if (error) {if (!['42P01','PGRST205'].includes(error.code)) console.error('Page builder publication unavailable:', error.code); return null;}
    return data ? {...data, document: validateDocument(data.document, key, {publishing: true})} : null;
  } catch (error) {console.error('Page builder publication rejected:', error.name); return null;}
}
