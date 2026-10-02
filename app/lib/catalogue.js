import { createClient } from '@supabase/supabase-js';

const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function client(){return url&&key?createClient(url,key,{auth:{persistSession:false}}):null}
function numberFromCatalogue(value,index=0){const m=String(value||'').match(/(\d+)(?!.*\d)/);return m?m[1].padStart(2,'0'):String(index+1).padStart(2,'0')}
function titleParts(title){const words=String(title||'Release').trim().split(/\s+/);if(words.length<2)return [words[0]||'Release','Edition.'];return [words.slice(0,-1).join(' '),words.at(-1)+'.']}
function artworkUrl(sb,path){return path?sb.storage.from('release-artwork').getPublicUrl(path).data.publicUrl:null}
function mapRelease(sb,p,index=0){
 const v=(p.product_variants||[])[0]||{}; const format=v.format==='cassette'?'CASSETTE':'CD'; const status=p.status==='active'?'AVAILABLE':p.status==='forthcoming'?'FORTHCOMING':'IN PREPARATION';
 return {slug:p.slug,catalogue:p.catalogue_no,number:numberFromCatalogue(p.catalogue_no,index),title:String(p.title||'UNTITLED').toUpperCase(),displayTitle:titleParts(p.title),artist:p.artist_project||'SIDE:II',format,formatDetail:format==='CASSETTE'?'CASSETTE · PHYSICAL EDITION':'CD · PHYSICAL EDITION',media:format.toLowerCase(),status,releaseDate:status==='AVAILABLE'?'AVAILABLE NOW':'FORTHCOMING',edition:v.edition_name||p.title,price:v.price??null,cover:artworkUrl(sb,p.artwork_path),orderUrl:null,lead:p.description||`${format} edition in the SIDE:II catalogue.`,note:p.description||'Artwork, packaging and edition specifications are managed through the SIDE:II Control Room.',tracks:[]};
}
export async function getDatabaseReleases(){
 const sb=client(); if(!sb)return [];
 const {data,error}=await sb.from('products').select('id,catalogue_no,slug,title,artist_project,description,artwork_path,status,is_public,created_at,product_variants(format,edition_name,price,currency,stock_qty,active)').eq('is_public',true).in('status',['forthcoming','active']).order('created_at',{ascending:false});
 if(error)return []; return (data||[]).map((p,i)=>mapRelease(sb,p,i));
}
export async function getDatabaseRelease(slug){
 const sb=client(); if(!sb)return null;
 const {data,error}=await sb.from('products').select('id,catalogue_no,slug,title,artist_project,description,artwork_path,status,is_public,created_at,product_variants(format,edition_name,price,currency,stock_qty,active)').eq('slug',slug).eq('is_public',true).in('status',['forthcoming','active']).maybeSingle();
 return error||!data?null:mapRelease(sb,data,0);
}
