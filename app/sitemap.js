import {getArchiveReleases,getStoreReleases} from './lib/catalogue';

export const revalidate=3600;

export default async function sitemap(){
  const base=(process.env.NEXT_PUBLIC_SITE_URL||'https://sideii-web.vercel.app').replace(/\/$/,'');
  const staticRoutes=['/','/store','/wear','/imprints/lethargia','/archive','/collections','/bundles','/artists','/credits','/timeline','/wholesale','/policies','/apply'];
  const [store,archive]=await Promise.all([getStoreReleases(),getArchiveReleases()]);
  const dynamic=[...(store||[]),...(archive||[])].map(x=>x.isMerch?'/store/'+x.slug:'/releases/'+x.slug);
  return [...new Set([...staticRoutes,...dynamic])].map(path=>({
    url:base+path,
    changeFrequency:path==='/'?'weekly':'monthly',
    priority:path==='/'?1:path==='/store'?0.9:0.7,
  }));
}
