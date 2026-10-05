import { createClient } from '@supabase/supabase-js';

const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const PRODUCT_SELECT='id,catalogue_no,slug,title,artist_project,description,imprint,artwork_path,gallery_images,has_shrinkwrap,release_date,credits,tracklist,gallery_paths,status,is_public,product_origin,original_label,original_catalogue_no,barcode,homepage_selected,product_type,merch_category,created_at,product_variants(id,sku,format,edition_name,edition_details,price,currency,stock_qty,reserved_qty,low_stock_threshold,active,digital_formats,audio_specs,vinyl_size,vinyl_speed,vinyl_weight_g,vinyl_color,option_size,option_color,option_style,weight_g,shipping_class,preorder_enabled,preorder_limit,edition_numbering_enabled,edition_total,next_edition_number,digital_download_url)';

function client(){return url&&key?createClient(url,key,{auth:{persistSession:false}}):null}
function numberFromCatalogue(value,index=0){const m=String(value||'').match(/(\d+)(?!.*\d)/);return m?m[1].padStart(2,'0'):String(index+1).padStart(2,'0')}
function titleParts(title){const words=String(title||'Release').trim().split(/\s+/);if(words.length<2)return [words[0]||'Release','Edition.'];return [words.slice(0,-1).join(' '),words.at(-1)+'.']}
function assetUrl(sb,value){if(!value)return null;if(/^https?:\/\//i.test(String(value)))return String(value);return sb.storage.from('release-artwork').getPublicUrl(value).data.publicUrl}
function galleryUrl(sb,item){if(!item)return null;if(typeof item==='string')return assetUrl(sb,item);return assetUrl(sb,item.url||item.path||item.src)}
function merchVariant(x,p){const size=x.option_size||null,color=x.option_color||null,style=x.option_style||null;return {id:x.id,sku:x.sku,format:'merch',media:'merch',formatLabel:[size||'ONE SIZE',color||'DEFAULT'].join(' · '),formatDetail:[style,color].filter(Boolean).join(' · ')||String(p.merch_category||'MERCH').toUpperCase(),edition:style||p.title,price:x.price??null,currency:x.currency||'TRY',stock:Number(x.stock_qty||0),size,color,style,weightG:x.weight_g||null,shippingClass:x.shipping_class||null,preorderEnabled:!!x.preorder_enabled,preorderLimit:x.preorder_limit??null,editionNumberingEnabled:!!x.edition_numbering_enabled,editionTotal:x.edition_total??null,nextEditionNumber:x.next_edition_number??1,digitalDownloadUrl:x.digital_download_url||null,digitalFormats:[],audioSpecs:null,vinylSize:null,vinylSpeed:null,vinylWeight:null,vinylColor:null}}
function releaseVariant(x,p){return {id:x.id,sku:x.sku,format:x.format,media:x.format,formatLabel:x.format==='cassette'?'CASSETTE':x.format==='digital'?'DIGITAL':x.format==='vinyl'?'VINYL':'CD',formatDetail:x.format==='cassette'?'CASSETTE · PHYSICAL EDITION':x.format==='digital'?'DIGITAL MASTER':x.format==='vinyl'?'VINYL · PHYSICAL EDITION':'CD · PHYSICAL EDITION',edition:x.edition_details||x.edition_name||p.title,price:x.price??null,currency:x.currency||'TRY',stock:x.format==='digital'?null:Number(x.stock_qty||0),digitalFormats:Array.isArray(x.digital_formats)?x.digital_formats:[],audioSpecs:x.audio_specs||null,vinylSize:x.vinyl_size||null,vinylSpeed:x.vinyl_speed||null,vinylWeight:x.vinyl_weight_g||null,vinylColor:x.vinyl_color||null,shippingClass:x.shipping_class||null,preorderEnabled:!!x.preorder_enabled,preorderLimit:x.preorder_limit??null,editionNumberingEnabled:!!x.edition_numbering_enabled,editionTotal:x.edition_total??null,nextEditionNumber:x.next_edition_number??1,digitalDownloadUrl:x.digital_download_url||null}}
function mapRelease(sb,p,index=0){
 const isMerch=p.product_type==='merch';
 const activeVariants=(p.product_variants||[]).filter(v=>v.active!==false);
 const v=activeVariants[0]||{};
 const format=isMerch?'MERCH':v.format==='cassette'?'CASSETTE':v.format==='digital'?'DIGITAL':v.format==='vinyl'?'VINYL':'CD';
 const status=p.status==='active'?'AVAILABLE':p.status==='forthcoming'?'FORTHCOMING':'IN PREPARATION';
 const dateLabel=p.release_date?new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(p.release_date+'T00:00:00Z')).toUpperCase():null;
 const variants=activeVariants.map(x=>isMerch?merchVariant(x,p):releaseVariant(x,p));
 const rawGallery=Array.isArray(p.gallery_images)?p.gallery_images:[];
 const galleryImages=rawGallery.map(item=>typeof item==='string'?{url:galleryUrl(sb,item),kind:'gallery'}:{...item,url:galleryUrl(sb,item)}).filter(x=>x.url);
 const frontImage=galleryImages.find(x=>(x.kind||'').toLowerCase()==='front');
 const frontMockup=galleryImages.find(x=>x?.mockup?.side==='front');
 const backMockup=galleryImages.find(x=>x?.mockup?.side==='back');
 const cover=isMerch?(frontImage?.url||frontMockup?.url||galleryImages[0]?.url||assetUrl(sb,p.artwork_path)||null):assetUrl(sb,p.artwork_path);
 const formatDetail=isMerch?String(p.merch_category||'MERCH').toUpperCase():format==='CASSETTE'?'CASSETTE · PHYSICAL EDITION':format==='DIGITAL'?'DIGITAL MASTER':format==='VINYL'?'VINYL · PHYSICAL EDITION':'CD · PHYSICAL EDITION';
 return {slug:p.slug,productType:p.product_type||'release',isMerch,merchCategory:p.merch_category||null,imprint:p.imprint||'sideii',productOrigin:p.product_origin||'own',originalLabel:p.original_label||null,originalCatalogue:p.original_catalogue_no||null,barcode:p.barcode||null,homepageSelected:!!p.homepage_selected,catalogue:p.catalogue_no,number:numberFromCatalogue(p.catalogue_no,index),title:String(p.title||'UNTITLED').toUpperCase(),displayTitle:titleParts(p.title),artist:isMerch?'SIDE:II MERCH':(p.artist_project||'SIDE:II'),format,formatDetail,media:isMerch?'merch':format.toLowerCase(),variants,status,releaseDate:dateLabel||(status==='AVAILABLE'?'AVAILABLE NOW':'FORTHCOMING'),edition:isMerch?(v.option_style||p.title):(v.edition_details||v.edition_name||p.title),price:v.price??null,stock:Number(v.stock_qty||0),cover,hasShrinkwrap:!!p.has_shrinkwrap,orderUrl:null,lead:p.description||(isMerch?'SIDE:II apparel and objects.':(p.imprint==='lethargia'?`${format} edition in the Lethargia Records catalogue.`:`${format} edition in the SIDE:II catalogue.`)),note:p.description||(isMerch?'Designed as part of the SIDE:II object system.':(p.imprint==='lethargia'?'Sound, artwork and physical format are developed together as a single Lethargia edition.':'Sound, artwork, packaging and physical format are developed together as one complete SIDE:II edition.')),tracks:isMerch?[]:(Array.isArray(p.tracklist)?p.tracklist:[]),credits:isMerch?null:(p.credits||null),gallery:isMerch?galleryImages.map(x=>x.url):(Array.isArray(p.gallery_paths)?p.gallery_paths:[]).map(x=>assetUrl(sb,x)),galleryImages,mockups:{front:frontMockup?.mockup||null,back:backMockup?.mockup||null}};
}
export async function getDatabaseReleases(){
 const sb=client(); if(!sb)return [];
 const {data,error}=await sb.from('products').select(PRODUCT_SELECT).eq('imprint','sideii').eq('is_public',true).or('product_type.is.null,product_type.neq.merch').in('status',['forthcoming','active']).order('created_at',{ascending:false});
 if(error)return []; return (data||[]).map((p,i)=>mapRelease(sb,p,i));
}
export async function getDatabaseRelease(slug){
 const sb=client(); if(!sb)return null;
 const {data,error}=await sb.from('products').select(PRODUCT_SELECT).eq('slug',slug).eq('is_public',true).in('status',['forthcoming','active']).maybeSingle();
 return error||!data?null:mapRelease(sb,data,0);
}
export async function getStoreProduct(slug){return getDatabaseRelease(slug)}
export async function getLethargiaReleases(){
 const sb=client(); if(!sb)return [];
 const {data,error}=await sb.from('products').select(PRODUCT_SELECT).eq('imprint','lethargia').eq('is_public',true).or('product_type.is.null,product_type.neq.merch').in('status',['forthcoming','active']).order('created_at',{ascending:false});
 if(error)return []; return (data||[]).map((p,i)=>mapRelease(sb,p,i));
}
export async function getStoreReleases(){
 const sb=client(); if(!sb)return [];
 const {data,error}=await sb.from('products').select(PRODUCT_SELECT).eq('is_public',true).in('status',['forthcoming','active']).order('created_at',{ascending:false});
 if(error)return []; return (data||[]).map((x,i)=>mapRelease(sb,x,i));
}
export async function getHomepageSelectedReleases(){
 const sb=client(); if(!sb)return [];
 const {data,error}=await sb.from('products').select(PRODUCT_SELECT).eq('homepage_selected',true).eq('is_public',true).or('product_type.is.null,product_type.neq.merch').in('status',['forthcoming','active']).order('created_at',{ascending:false});
 if(error)return []; return (data||[]).map((p,i)=>mapRelease(sb,p,i));
}
export async function getHomepageStoreReleases(limit=3){
 const sb=client(); if(!sb)return [];
 const {data,error}=await sb.from('products').select(PRODUCT_SELECT).eq('is_public',true).or('product_type.is.null,product_type.neq.merch').eq('status','active').order('created_at',{ascending:false}).limit(limit);
 if(error)return []; return (data||[]).map((p,i)=>mapRelease(sb,p,i));
}
