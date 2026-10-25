export function effectivePublication(live,scheduled,now=Date.now()) {return scheduled&&Date.parse(scheduled.publish_at)<=now&&(!live||scheduled.version>live.version)?{...scheduled,published_at:scheduled.publish_at}:live;}
export function documentUses(value,url) {return typeof value==='string'?value===url:Array.isArray(value)?value.some(v=>documentUses(v,url)):value&&typeof value==='object'?Object.values(value).some(v=>documentUses(v,url)):false;}
export function publicationDiff(before,after) {
  if(!before)return ['İlk yayın'];
  const result=[],flat=doc=>{const m=new Map();const walk=children=>children.forEach(n=>{m.set(n.id,n);walk(n.children);});walk(doc.children||[]);return m;},a=flat(before),b=flat(after);
  for(const [id,n]of b)if(!a.has(id))result.push('Eklendi: '+n.name);else if(JSON.stringify(a.get(id))!==JSON.stringify(n))result.push('Değişti: '+n.name);
  for(const [id,n]of a)if(!b.has(id))result.push('Kaldırıldı: '+n.name);
  if(JSON.stringify(before.children?.map(n=>n.id))!==JSON.stringify(after.children?.map(n=>n.id)))result.push('Bölüm sırası');
  for(const [key,label]of [['theme','Sayfa tasarımı'],['seo','SEO ayarları'],['site','Ortak tasarım ve menüler']])if(JSON.stringify(before[key])!==JSON.stringify(after[key]))result.push(label);
  return result.length?result:['İçerik değişikliği yok'];
}
