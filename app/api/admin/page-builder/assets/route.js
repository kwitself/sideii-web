import {builderAdmin,builderResponse,boundedJson} from '../../../../lib/server/pageBuilderAuth';
import {documentUses,effectivePublication} from '../../../../lib/builder-publication';
const validPath=path=>typeof path==='string'&&/^images\/[a-f0-9-]{36}\.(jpg|jpeg|png|webp|avif|gif)$/.test(path);
export async function GET(request) {
 try{
  const auth=await builderAdmin(request);if(auth.error)return builderResponse({error:auth.error},auth.status);
  const params=new URL(request.url).searchParams,usage=params.get('usage');
  if(usage){
   if(!validPath(usage))return builderResponse({error:'Geçersiz dosya.'},400);
   const url=auth.client.storage.from('site-builder-assets').getPublicUrl(usage).data.publicUrl;
   const all=async table=>{let rows=[],more=true;for(let offset=0;more&&offset<10000;offset+=500){const r=await auth.client.from(table).select('*').order('page_key').range(offset,offset+499);if(r.error)throw r.error;rows.push(...r.data);more=r.data.length===500;}return {rows,more};};
   const [drafts,live,plans]=await Promise.all(['site_builder_pages','site_builder_publications','site_builder_schedules'].map(all));
   const uses=[];
   for(const p of drafts.rows)if(documentUses(p.draft_document,url))uses.push({key:p.page_key,title:p.title,state:'Taslak'});
   const current=new Map(live.rows.map(p=>[p.page_key,p]));
   for(const p of plans.rows){if(Date.parse(p.publish_at)>Date.now()){if(documentUses(p.document,url))uses.push({key:p.page_key,title:p.title,state:'Planlı yayın'});}else current.set(p.page_key,effectivePublication(current.get(p.page_key),p));}
   for(const p of current.values())if(documentUses(p.document,url))uses.push({key:p.page_key,title:p.title,state:'Yayında'});
   return builderResponse({uses,incomplete:[drafts,live,plans].some(r=>r.more)});
  }
  const offset=Math.max(0,Math.min(100000,Number(params.get('offset'))||0)),q=(params.get('q')||'').slice(0,100),folder=params.get('folder');
  let query=auth.client.from('site_builder_assets').select('*').order('created_at',{ascending:false}).order('path').range(offset,offset+48);
  if(q)query=query.ilike('name','%'+q.replace(/[\\%_]/g,'\\$&')+'%');if(folder!==null)query=query.eq('folder',folder.slice(0,80));
  const [result,folders]=await Promise.all([query,auth.client.rpc('site_builder_asset_folders')]);
  if(result.error||folders.error)return builderResponse({error:'Görsel arşivi yüklenemedi.'},503);
  return builderResponse({assets:result.data.slice(0,48).map(x=>({...x,url:auth.client.storage.from('site-builder-assets').getPublicUrl(x.path).data.publicUrl})),hasMore:result.data.length>48,folders:folders.data.map(x=>x.folder)});
 }catch{return builderResponse({error:'Görsel arşivine ulaşılamadı.'},503);}
}
export async function POST(request) {
 try{
  const auth=await builderAdmin(request);if(auth.error)return builderResponse({error:auth.error},auth.status);
  const body=await boundedJson(request,5000),{path,name,folder=''}=body;
  if(!validPath(path)||typeof name!=='string'||!name.trim()||name.length>160||typeof folder!=='string'||folder.length>80||/[\u0000-\u001f]/.test(name+folder))return builderResponse({error:'Geçerli dosya adı ve klasör gir.'},400);
  const {error}=await auth.client.from('site_builder_assets').upsert({path,name:name.trim(),folder:folder.trim()},{onConflict:'path'});
  return error?builderResponse({error:'Görsel bilgisi kaydedilemedi.'},503):builderResponse({ok:true});
 }catch{return builderResponse({error:'Görsel bilgisi okunamadı.'},400);}
}
