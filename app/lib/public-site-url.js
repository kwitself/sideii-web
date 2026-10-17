// One canonical public URL policy for metadata, robots and sitemap.
export function getPublicSiteUrl(raw=process.env.NEXT_PUBLIC_SITE_URL){
 const value=raw?.trim();
 if(!value)return null;
 try{
  const url=new URL(value);
  if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)return null;
  const host=url.hostname.toLowerCase();
  if(host==='localhost'||host.endsWith('.localhost')||host.endsWith('.local')||host.endsWith('.internal')||host==='127.0.0.1'||host==='0.0.0.0'||host==='[::1]'||!host.includes('.'))return null;
  if(/^\\d{1,3}(?:\\.\\d{1,3}){3}$/.test(host)){
   const octets=host.split('.').map(Number);
   if(octets.some(n=>n>255)||octets[0]===10||octets[0]===127||octets[0]===0||octets[0]>=224||
      (octets[0]===172&&octets[1]>=16&&octets[1]<=31)||
      (octets[0]===192&&octets[1]===168)||
      (octets[0]===169&&octets[1]===254))return null;
  }
  return url.origin;
 }catch{return null;}
}
