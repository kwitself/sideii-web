import {builderAdmin,builderResponse,boundedJson} from '../../../../lib/server/pageBuilderAuth';
import {validateDocument} from '../../../../lib/page-builder';
export async function GET(request) {
  try {
    const auth=await builderAdmin(request);if(auth.error)return builderResponse({error:auth.error},auth.status);
    const {data,error}=await auth.client.from('site_builder_blocks').select('id,name,document').order('created_at',{ascending:false}).limit(100);
    return error?builderResponse({error:'Bölüm şablonları yüklenemedi.'},503):builderResponse({blocks:data});
  }catch{return builderResponse({error:'Şablon arşivine ulaşılamadı.'},503);}
}
export async function POST(request) {
  try {
    const auth=await builderAdmin(request);if(auth.error)return builderResponse({error:auth.error},auth.status);
    let body,document;
    try {body=await boundedJson(request);document=validateDocument({schemaVersion:1,theme:{},children:[body.node]},'page:snippet');}catch(error){return builderResponse({error:error.message},400);}
    if(typeof body.name!=='string'||!body.name.trim()||body.name.length>100)return builderResponse({error:'Şablona 1–100 karakter arasında bir ad ver.'},400);
    const {data,error}=await auth.client.from('site_builder_blocks').insert({name:body.name.trim(),document}).select('id,name,document').single();
    return error?builderResponse({error:'Bölüm şablonu kaydedilemedi.'},503):builderResponse({block:data});
  }catch{return builderResponse({error:'Şablon kaydedilemedi.'},503);}
}
