// Only provider-owned HTTPS URLs may be opened as iyzico Link checkout targets.
export function trustedIyziLink(value){
 try{
  if(typeof value!=='string'||!value.trim())return null;
  const url=new URL(value);
  if(url.protocol!=='https:'||url.username||url.password)return null;
  if(!['iyzi.link','sandbox.iyzi.link'].includes(url.hostname.toLowerCase()))return null;
  if(url.port&&url.port!=='443')return null;
  return url.href;
 }catch{return null;}
}
