import { createClient } from '@supabase/supabase-js';

const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function client(){return url&&key?createClient(url,key,{auth:{persistSession:false}}):null}
function numberFromCatalogue(value,index=0){const m=String(value||'').match(/(\d+)(?!.*\d)/);return m?m[1].padStart(2,'0'):String(index+1).padStart(2,'0')}
function titleParts(title){const words=String(title||'Release').trim().split(/\s+/);if(words.length<2)return [words[0]||'Release','Edition.'];return [words.slice(0,-1).join(' '),words.at(-1)+'.']}
function artworkUrl(sb,path){return path?sb.storage.from('release-artwork').getPublicUrl(path).data.publicUrl:null}
function mapRelease(sb,p,index=0){
 const activeVariants=(p.product_variants||[]).filter(v=>v.active!==false);
 const v=activeVariants[0]||{}; const format=v.format==='cassette'?'CASSETTE':v.format==='digital'?'DIGITAL':'CD'; const status=p.status==='active'?'AVAILABLE':p.status==='forthcoming'?'FORTHCOMING':'IN PREPARATION';
 const dateLabel=p.release_date?new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(p.release_date+'T00:00:00Z')).toUpperCase():null;
 const variants=activeVariants.map((x,n)=>({id:x.id,sku:x.sku,format:x.format,media:x.format,formatLabel:x.format==='cassette'?'CASSETTE':x.format==='digital'?'DIGITAL':x.format==='vinyl'?'VINYL':'CD',formatDetail:x.format==='cassette'?'CASSETTE · PHYSICAL EDITION':x.format==='digital'?'DIGITAL MASTER':x.format==='vinyl'?'VINYL · PHYSICAL EDITION':'CD · PHYSICAL EDITION',edition:x.edition_details||x.edition_name||p.title,price:x.price??null,currency:x.currency||'TRY',stock:x.format==='digital'?null:Number(x.stock_qty||0),digitalFormats:Array.isArray(x.digital_formats)?x.digital_formats:[],audioSpecs:x.audio_specs||null}));
 return {slug:p.slug,imprint:p.imprint||'sideii',catalogue:p.catalogue_no,number:numberFromCatalogue(p.catalogue_no,index),title:String(p.title||'UNTITLED').toUpperCase(),displayTitle:titleParts(p.title),artist:p.artist_project||'SIDE:II',format,formatDetail:format==='CASSETTE'?'CASSETTE · PHYSICAL EDITION':format==='DIGITAL'?'DIGITAL MASTER':'CD · PHYSICAL EDITION',media:format.toLowerCase(),variants,status,releaseDate:dateLabel||(status==='AVAILABLE'?'AVAILABLE NOW':'FORTHCOMING'),edition:v.edition_details||v.edition_name||p.title,price:v.price??null,stock:Number(v.stock_qty||0),cover:artworkUrl(sb,p.artwork_path),hasShrinkwrap:!!p.has_shrinkwrap,orderUrl:null,lead:p.description||`${format} edition in the SIDE:II catalogue.`,note:p.description||'Artwork, packaging and edition specifications are managed through the SIDE:II Control Room.',tracks:Array.isArray(p.tracklist)?p.tracklist:[],credits:p.credits||null,gallery:(Array.isArray(p.gallery_paths)?p.gallery_paths:[]).map(x=>artworkUrl(sb,x))};
}
export async function getDatabaseReleases(){
 const sb=client(); if(!sb)return [];
 const {data,error}=await sb.from('products').select('id,catalogue_no,slug,title,artist_project,description,imprint,artwork_path,has_shrinkwrap,release_date,credits,tracklist,gallery_paths,status,is_public,created_at,product_variants(id,sku,format,edition_name,edition_details,price,currency,stock_qty,active,digital_formats,audio_specs,vinyl_size,vinyl_speed,vinyl_weight_g,vinyl_color)').eq('imprint','sideii').eq('is_public',true).in('status',['forthcoming','active']).order('created_at',{ascending:false});
 if(error)return []; return (data||[]).map((p,i)=>mapRelease(sb,p,i));
}
export async function getDatabaseRelease(slug){
 const sb=client(); if(!sb)return null;
 const {data,error}=await sb.from('products').select('id,catalogue_no,slug,title,artist_project,description,imprint,artwork_path,has_shrinkwrap,release_date,credits,tracklist,gallery_paths,status,is_public,created_at,product_variants(id,sku,format,edition_name,edition_details,price,currency,stock_qty,active,digital_formats,audio_specs,vinyl_size,vinyl_speed,vinyl_weight_g,vinyl_color)').eq('slug',slug).eq('is_public',true).in('status',['forthcoming','active']).maybeSingle();
 return error||!data?null:mapRelease(sb,data,0);
}

export async function getLethargiaReleases(){
 const sb=client(); if(!sb)return [];
 const {data,error}=await sb.from('products').select('id,catalogue_no,slug,title,artist_project,description,imprint,artwork_path,has_shrinkwrap,release_date,credits,tracklist,gallery_paths,status,is_public,created_at,product_variants(id,sku,format,edition_name,edition_details,price,currency,stock_qty,active,digital_formats,audio_specs,vinyl_size,vinyl_speed,vinyl_weight_g,vinyl_color)').eq('imprint','lethargia').eq('is_public',true).in('status',['forthcoming','active']).order('created_at',{ascending:false});
 if(error)return []; return (data||[]).map((p,i)=>mapRelease(sb,p,i));
}

export async function getStoreReleases(){
 const sb=client(); if(!sb)return [];
 const {data,error}=await sb.from('products').select('id,catalogue_no,slug,title,artist_project,description,imprint,artwork_path,has_shrinkwrap,release_date,credits,tracklist,gallery_paths,status,is_public,created_at,product_variants(id,sku,format,edition_name,edition_details,price,currency,stock_qty,active,digital_formats,audio_specs,vinyl_size,vinyl_speed,vinyl_weight_g,vinyl_color)').eq('is_public',true).in('status',['forthcoming','active']).order('created_at',{ascending:false});
 if(error)return []; return (data||[]).map((x,i)=>mapRelease(sb,x,i));
}
