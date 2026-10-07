import { createClient } from '@supabase/supabase-js';

const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
let cachedClient=null;

const PRODUCT_SELECT='id,catalogue_no,slug,title,artist_project,description,imprint,artwork_path,gallery_images,has_shrinkwrap,release_date,credits,tracklist,gallery_paths,status,is_public,product_origin,original_label,original_catalogue_no,barcode,homepage_selected,hover_media_format,storefront_config,seo_config,commerce_config,product_type,merch_category,archive_visible,pressing_generation,pressing_label,listening_preview_url,digital_booklet_url,created_at,product_variants(id,sku,format,edition_name,edition_details,price,currency,stock_qty,reserved_qty,low_stock_threshold,active,digital_formats,audio_specs,vinyl_size,vinyl_speed,vinyl_weight_g,vinyl_color,option_size,option_color,option_style,weight_g,shipping_class,preorder_enabled,preorder_limit,preorder_target,preorder_deadline,edition_numbering_enabled,edition_total,next_edition_number,digital_download_url)';

function client(){
 if(!url||!key)return null;
 if(!cachedClient)cachedClient=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 return cachedClient;
}
function numberFromCatalogue(value,index=0){const m=String(value||'').match(/(\d+)(?!.*\d)/);return m?m[1].padStart(2,'0'):String(index+1).padStart(2,'0')}
function titleParts(title){const words=String(title||'Release').trim().split(/\s+/);if(words.length<2)return [words[0]||'Release','Edition.'];return [words.slice(0,-1).join(' '),words.at(-1)+'.']}
function assetUrl(sb,value){if(!value)return null;if(/^https?:\/\//i.test(String(value)))return String(value);return sb.storage.from('release-artwork').getPublicUrl(value).data.publicUrl}
function galleryUrl(sb,item){if(!item)return null;if(typeof item==='string')return assetUrl(sb,item);return assetUrl(sb,item.url||item.path||item.src)}
function merchVariant(x,p){const size=x.option_size||null,color=x.option_color||null,style=x.option_style||null;return {id:x.id,sku:x.sku,format:'merch',media:'merch',formatLabel:[size||'ONE SIZE',color||'DEFAULT'].join(' · '),formatDetail:[style,color].filter(Boolean).join(' · ')||String(p.merch_category||'MERCH').toUpperCase(),edition:style||p.title,price:x.price??null,currency:x.currency||'TRY',stock:Number(x.stock_qty||0),size,color,style,weightG:x.weight_g||null,shippingClass:x.shipping_class||null,preorderEnabled:!!x.preorder_enabled,preorderLimit:x.preorder_limit??null,preorderTarget:x.preorder_target??null,preorderDeadline:x.preorder_deadline||null,editionNumberingEnabled:!!x.edition_numbering_enabled,editionTotal:x.edition_total??null,nextEditionNumber:x.next_edition_number??1,digitalDownloadUrl:x.digital_download_url||null,digitalFormats:[],audioSpecs:null,vinylSize:null,vinylSpeed:null,vinylWeight:null,vinylColor:null}}
function releaseVariant(x,p){return {id:x.id,sku:x.sku,format:x.format,media:x.format,formatLabel:x.format==='cassette'?'CASSETTE':x.format==='digital'?'DIGITAL':x.format==='vinyl'?'VINYL':'CD',formatDetail:x.format==='cassette'?'CASSETTE · PHYSICAL EDITION':x.format==='digital'?'DIGITAL MASTER':x.format==='vinyl'?'VINYL · PHYSICAL EDITION':'CD · PHYSICAL EDITION',edition:x.edition_details||x.edition_name||p.title,price:x.price??null,currency:x.currency||'TRY',stock:x.format==='digital'?null:Number(x.stock_qty||0),digitalFormats:Array.isArray(x.digital_formats)?x.digital_formats:[],audioSpecs:x.audio_specs||null,vinylSize:x.vinyl_size||null,vinylSpeed:x.vinyl_speed||null,vinylWeight:x.vinyl_weight_g||null,vinylColor:x.vinyl_color||null,shippingClass:x.shipping_class||null,preorderEnabled:!!x.preorder_enabled,preorderLimit:x.preorder_limit??null,preorderTarget:x.preorder_target??null,preorderDeadline:x.preorder_deadline||null,editionNumberingEnabled:!!x.edition_numbering_enabled,editionTotal:x.edition_total??null,nextEditionNumber:x.next_edition_number??1,digitalDownloadUrl:x.digital_download_url||null}}
function mapRelease(sb,p,index=0){
 const isMerch=p.product_type==='merch';
 const activeVariants=(p.product_variants||[]).filter(v=>v.active!==false);
 const v=activeVariants[0]||{};
 const format=isMerch?'MERCH':v.format==='cassette'?'CASSETTE':v.format==='digital'?'DIGITAL':v.format==='vinyl'?'VINYL':'CD';
 const status=p.status==='active'?'AVAILABLE':p.status==='forthcoming'?'FORTHCOMING':p.status==='archived'?'ARCHIVED':'IN PREPARATION';
 const dateLabel=p.release_date?new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(p.release_date+'T00:00:00Z')).toUpperCase():null;
 const variants=activeVariants.map(x=>isMerch?merchVariant(x,p):releaseVariant(x,p));
 const rawGallery=Array.isArray(p.gallery_images)?p.gallery_images:[];
 const galleryImages=rawGallery.map(item=>typeof item==='string'?{url:galleryUrl(sb,item),kind:'gallery'}:{...item,url:galleryUrl(sb,item)}).filter(x=>x.url);
 const frontImage=galleryImages.find(x=>(x.kind||'').toLowerCase()==='front');
 const frontMockup=galleryImages.find(x=>x?.mockup?.side==='front');
 const backMockup=galleryImages.find(x=>x?.mockup?.side==='back');
 const cover=isMerch?(frontMockup?.mockup?.previewCleanUrl||frontMockup?.url||frontImage?.url||galleryImages[0]?.url||assetUrl(sb,p.artwork_path)||null):assetUrl(sb,p.artwork_path);
 const formatDetail=isMerch?String(p.merch_category||'MERCH').toUpperCase():format==='CASSETTE'?'CASSETTE · PHYSICAL EDITION':format==='DIGITAL'?'DIGITAL MASTER':format==='VINYL'?'VINYL · PHYSICAL EDITION':'CD · PHYSICAL EDITION';
 return {id:p.id,slug:p.slug,productType:p.product_type||'release',isMerch,merchCategory:p.merch_category||null,imprint:p.imprint||'sideii',productOrigin:p.product_origin||'own',originalLabel:p.original_label||null,originalCatalogue:p.original_catalogue_no||null,barcode:p.barcode||null,homepageSelected:!!p.homepage_selected,storefrontConfig:p.storefront_config||{},seoConfig:p.seo_config||{},commerceConfig:p.commerce_config||{},hoverMediaFormat:p.storefront_config?.hover?.format||p.hover_media_format||'auto',catalogue:p.catalogue_no,number:numberFromCatalogue(p.catalogue_no,index),title:String(p.title||'UNTITLED').toUpperCase(),rawTitle:String(p.title||'UNTITLED'),displayTitle:titleParts(p.title),artist:isMerch?'SIDE:II MERCH':(p.artist_project||'SIDE:II'),format,formatDetail,media:isMerch?'merch':format.toLowerCase(),variants,status,releaseDate:dateLabel||(status==='AVAILABLE'?'AVAILABLE NOW':'FORTHCOMING'),edition:isMerch?(v.option_style||p.title):(v.edition_details||v.edition_name||p.title),price:v.price??null,stock:Number(v.stock_qty||0),cover,hasShrinkwrap:!!p.has_shrinkwrap,orderUrl:null,lead:p.description||(isMerch?'SIDE:II apparel and objects.':(p.imprint==='lethargia'?`${format} edition in the Lethargia Records catalogue.`:`${format} edition in the SIDE:II catalogue.`)),note:p.description||(isMerch?'Designed as part of the SIDE:II object system.':(p.imprint==='lethargia'?'Sound, artwork and physical format are developed together as a single Lethargia edition.':'Sound, artwork, packaging and physical format are developed together as one complete SIDE:II edition.')),tracks:isMerch?[]:(Array.isArray(p.tracklist)?p.tracklist.map((track,index)=>{if(typeof track==='string')return track;if(track&&typeof track==='object')return String(track.title||track.name||track.label||('Track '+(track.position||index+1)));return String(track||'Track '+(index+1))}):[]),credits:isMerch?null:(p.credits||null),gallery:isMerch?galleryImages.map(x=>x.url):(Array.isArray(p.gallery_paths)?p.gallery_paths:[]).map(x=>assetUrl(sb,x)),galleryImages,mockups:{front:frontMockup?.mockup||null,back:backMockup?.mockup||null},archiveVisible:!!p.archive_visible,pressingGeneration:p.pressing_generation||1,pressingLabel:p.pressing_label||'FIRST PRESSING',listeningPreviewUrl:p.listening_preview_url||null,digitalBookletUrl:p.digital_booklet_url||null};
}
export async function getDatabaseReleases(){
 const sb=client(); if(!sb)return [];
 const {data,error}=await sb.from('products').select(PRODUCT_SELECT).eq('imprint','sideii').eq('is_public',true).or('product_type.is.null,product_type.neq.merch').in('status',['forthcoming','active']).order('created_at',{ascending:false});
 if(error)return []; return (data||[]).map((p,i)=>mapRelease(sb,p,i));
}
export async function getDatabaseRelease(slug){
 const sb=client(); if(!sb)return null;
 const {data,error}=await sb.from('products').select(PRODUCT_SELECT).eq('slug',slug).eq('is_public',true).maybeSingle();
 if(error||!data)return null;
 if(!['forthcoming','active'].includes(data.status)&&!(data.status==='archived'&&data.archive_visible))return null;
 return mapRelease(sb,data,0);
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
 if(error)return []; return (data||[]).map((p,i)=>mapRelease(sb,p,i)).filter(r=>r.storefrontConfig?.visibility?.homepage!==false);
}
export async function getHomepageStoreReleases(limit=3){
 const sb=client(); if(!sb)return [];
 const {data,error}=await sb.from('products').select(PRODUCT_SELECT).eq('is_public',true).or('product_type.is.null,product_type.neq.merch').eq('status','active').order('created_at',{ascending:false});
 if(error)return []; return (data||[]).map((p,i)=>mapRelease(sb,p,i)).filter(r=>r.storefrontConfig?.visibility?.homepage!==false).slice(0,limit);
}

export async function getArchiveReleases(){
 const sb=client(); if(!sb)return [];
 const {data,error}=await sb.from('products').select(PRODUCT_SELECT).eq('status','archived').eq('archive_visible',true).order('created_at',{ascending:false});
 if(error)return []; return (data||[]).map((p,i)=>mapRelease(sb,p,i));
}

export async function getProductCredits(productId){
 const sb=client(); if(!sb||!productId)return [];
 const {data,error}=await sb.rpc('get_public_product_credits',{p_product_id:productId});
 return error?[]:(Array.isArray(data)?data:[]);
}

export async function getPublicPressKit(slug){
 const sb=client(); if(!sb||!slug)return null;
 const {data,error}=await sb.rpc('get_public_press_kit',{p_slug:slug});
 if(error)return null;
 return Array.isArray(data)?(data[0]||null):(data||null);
}


export async function getRelatedProducts(productId,limit=6){
 const sb=client(); if(!sb||!productId)return [];
 const {data,error}=await sb.rpc('get_related_product_ids',{p_product_id:productId,p_limit:limit});
 if(error)return [];
 const ordered=Array.isArray(data)?data:[];
 if(!ordered.length)return [];
 const all=await getStoreReleases();
 const byId=new Map((all||[]).map(x=>[x.id,x]));
 return ordered.map(x=>byId.get(x.product_id)).filter(Boolean);
}
