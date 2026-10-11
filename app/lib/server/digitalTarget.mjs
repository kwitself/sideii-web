// Validate delivery targets independently from entitlement/one-time grant handling.
export function classifyDownloadTarget(raw,requestUrl,hostConfig=''){
 if(typeof raw!=='string'||!raw||/[\x00-\x1f\x7f\\]/.test(raw))return {kind:'invalid'};
 if(raw==='sideii-internal://demo-digital')return {kind:'demo'};
 if(raw.startsWith('storage-private://')){
  const path=raw.slice('storage-private://'.length);
  if(!path||path.startsWith('/')||path.split('/').some(s=>!s||s==='.'||s==='..'||s.includes('%')))return {kind:'invalid'};
  return {kind:'private',path};
 }
 let destination;
 try {destination=new URL(raw,requestUrl)}catch{return {kind:'invalid'}}
 if(raw.startsWith('/')&&!raw.startsWith('//')){
  if(destination.origin!==new URL(requestUrl).origin)return {kind:'invalid'};
  return {kind:'same-origin',url:destination.href};
 }
 // External destinations require explicit HTTPS host allowlisting.
 const allowed=new Set(hostConfig.split(',').map(x=>x.trim().toLowerCase()).filter(Boolean));
 if(!/^https:\/\//i.test(raw)||destination.protocol!=='https:'||!allowed.has(destination.hostname.toLowerCase())||destination.username||destination.password)return {kind:'forbidden'};
 return {kind:'external',url:destination.href};
}
