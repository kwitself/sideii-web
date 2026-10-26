import {builderAdmin,builderResponse} from '../../../../lib/server/pageBuilderAuth';
export async function POST(request) {
  try {
    const auth=await builderAdmin(request);if(auth.error)return builderResponse({error:auth.error},auth.status);
    const reader=request.body?.getReader();if(!reader)return builderResponse({error:'Font dosyası gerekiyor.'},400);
    const chunks=[];let size=0;
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2200000){await reader.cancel();return builderResponse({error:'Font en fazla 2 MB olabilir.'},400);}chunks.push(value);}
    const form=await new Response(new Blob(chunks),{headers:{'Content-Type':request.headers.get('content-type')||''}}).formData();
    const file=form.get('file'),name=String(form.get('name')||'').trim();
    if(!file||typeof file.arrayBuffer!=='function'||!name||name.length>80||file.size>2097152||file.size<48)return builderResponse({error:'Geçerli bir WOFF2 dosyası ve font adı gir.'},400);
    const bytes=new Uint8Array(await file.arrayBuffer()),view=new DataView(bytes.buffer);
    if(new TextDecoder().decode(bytes.slice(0,4))!=='wOF2'||view.getUint32(8)!==bytes.length||view.getUint16(12)<1||view.getUint16(12)>100||view.getUint32(16)>20971520)return builderResponse({error:'WOFF2 dosyası geçersiz.'},400);
    const id=crypto.randomUUID(),path=id+'.woff2';
    const {error}=await auth.client.storage.from('site-builder-fonts').upload(path,bytes,{contentType:'font/woff2',upsert:false,cacheControl:'31536000'});
    if(error)return builderResponse({error:'Font yüklenemedi.'},503);
    return builderResponse({font:{id:'custom-'+id.replaceAll('-',''),name,url:auth.client.storage.from('site-builder-fonts').getPublicUrl(path).data.publicUrl}});
  }catch{return builderResponse({error:'Font dosyası okunamadı.'},400);}
}
