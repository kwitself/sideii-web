// One canonical public URL policy for metadata, robots and sitemap.
export function getPublicSiteUrl(raw=process.env.NEXT_PUBLIC_SITE_URL){
 const value=raw?.trim();
 if(!value)return null;
 try{
  const url=new URL(value);
  if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)return null;
  const host=url.hostname.toLowerCase();
  if(host==='localhost'||host.endsWith('.localhost')||host==='127.0.0.1'||host==='0.0.0.0'||host==='[::1]'||!host.includes('.'))return null;
  return url.origin;
 }catch{return null;}
}
