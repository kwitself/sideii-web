// Pure advisory lint; never mutates a draft or blocks publication.
export function auditPage(document, {products=[]}={}) {
  const issues=[];
  const walk=(nodes,path=[])=>{
    for(const node of nodes||[]){
      const location=[...path,node.name||node.type].join(' / ');
      const p=node.props||{};
      const report=(message,level='warning')=>issues.push({id:node.id,type:node.type,location,message,level});
      if(node.type==='image'&&!p.src)report('Görsel kaynağı eksik.');
      if(node.type==='video'&&!p.src)report('Video bağlantısı eksik.');
      if(node.type==='audio'&&!p.src)report('Ses dosyası eklenmemiş.');
      if(node.type==='album'&&(!p.slug||!products.some(product=>product.slug===p.slug)))report('Yayımlanmış katalogdan albüm seçilmeli.');
      if(node.type==='artist'&&!p.image)report('Sanatçı görseli eklenmemiş.','info');
      if(node.type==='gallery'&&(!p.items?.length||p.items.some(item=>!item.src)))report('Galeri görselleri eksik.');
      if(node.type==='events'&&!p.items?.length)report('Etkinlik listesi boş.','info');
      if(node.type==='countdown'&&!p.date)report('Geri sayım tarihi belirtilmemiş.');
      if(node.type==='shared'&&!p.key)report('Ortak bölüm seçilmemiş.');
      if(node.type==='button'&&!p.href)report('Buton bağlantısı belirtilmemiş.');
      walk(node.children,[...path,node.name||node.type]);
    }
  };
  walk(document?.children);
  return issues;
}
