import {createClient} from '@supabase/supabase-js';
import {getArchiveReleases,getStoreReleases} from './lib/catalogue';

export const revalidate=3600;

function slugify(s){
 return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}

function client(){
 const u=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const k=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 return u&&k?createClient(u,k,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}):null;
}

export default async function sitemap(){
 const base=(process.env.NEXT_PUBLIC_SITE_URL||'https://sideii-web.vercel.app').replace(/\/$/,'');
 const staticRoutes=['/','/store','/wear','/impact','/lethargia','/imprints/lethargia','/archive','/collections','/bundles','/artists','/credits','/timeline','/wholesale','/policies','/apply'];
 const [store,archive]=await Promise.all([getStoreReleases(),getArchiveReleases()]);
 const dynamic=[...(store||[]),...(archive||[])].map(x=>x.isMerch?'/store/'+x.slug:'/releases/'+x.slug);

 const sb=client();
 if(sb){
  const [collections,artists,credits]=await Promise.all([
   sb.rpc('get_public_collections'),
   sb.rpc('get_public_artist_names'),
   sb.rpc('get_public_credit_people')
  ]);
  for(const c of Array.isArray(collections.data)?collections.data:[])if(c?.slug)dynamic.push('/collections/'+c.slug);
  for(const a of Array.isArray(artists.data)?artists.data:[]){const slug=slugify(a?.artist_project);if(slug)dynamic.push('/artists/'+slug)}
  for(const c of Array.isArray(credits.data)?credits.data:[]){const slug=slugify(c?.person_name);if(slug)dynamic.push('/credits/'+slug)}
 }

 return [...new Set([...staticRoutes,...dynamic])].map(path=>({
  url:base+path,
  changeFrequency:path==='/'?'weekly':'monthly',
  priority:path==='/'?1:path==='/store'?0.9:0.7,
 }));
}
