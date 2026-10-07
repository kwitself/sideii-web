const SITE_FALLBACK='https://sideii-web.vercel.app';

export function siteBase(){
 return String(process.env.NEXT_PUBLIC_SITE_URL||SITE_FALLBACK).replace(/\/$/,'');
}

export function productPath(product){
 return product.isMerch?'/store/'+product.slug:'/releases/'+product.slug;
}

export function productUrl(product,variant=null){
 const base=siteBase()+productPath(product);
 if(!variant)return base;
 const token=variant.sku||variant.id;
 return token?base+'?variant='+encodeURIComponent(token):base;
}

export function conditionValue(product){
 const raw=String(product.seoConfig?.condition||'new').toLowerCase();
 return ['new','used','refurbished'].includes(raw)?raw:'new';
}

export function schemaCondition(product){
 return conditionValue(product)==='used'?'https://schema.org/UsedCondition':conditionValue(product)==='refurbished'?'https://schema.org/RefurbishedCondition':'https://schema.org/NewCondition';
}

export function availabilityValue(variant,product=null){
 if(variant?.preorderEnabled)return 'preorder';
 if(product&&product.status!=='AVAILABLE')return 'out_of_stock';
 if(variant?.format==='digital'||variant?.media==='digital'||variant?.stock==null)return 'in_stock';
 return Number(variant?.stock||0)>0?'in_stock':'out_of_stock';
}

export function schemaAvailability(variant,product=null){
 const value=availabilityValue(variant,product);
 return value==='preorder'?'https://schema.org/PreOrder':value==='in_stock'?'https://schema.org/InStock':'https://schema.org/OutOfStock';
}

export function brandName(product){
 return String(product.seoConfig?.brand||product.originalLabel||(product.imprint==='lethargia'?'Lethargia Records':'SIDE:II')).trim();
}

export function productDescription(product){
 return String(product.seoConfig?.description||product.lead||product.note||product.title||'').replace(/\s+/g,' ').trim();
}

export function productImages(product){
 const seen=new Set();
 const values=[product.seoConfig?.og_image,product.cover,...(product.gallery||[]),...(product.galleryImages||[]).map(x=>x?.url)].filter(Boolean);
 return values.filter(x=>{const v=String(x);if(seen.has(v))return false;seen.add(v);return true});
}

export function productSchema(product){
 if(product.seoConfig?.structured_data===false)return null;
 const variants=(product.variants||[]).filter(v=>v&&v.price!=null);
 if(!variants.length)return null;
 const images=productImages(product);
 const brand={ '@type':'Brand',name:brandName(product)};
 const common={
  name:product.rawTitle||product.title,
  description:productDescription(product),
  ...(images.length?{image:images}:{}),
  brand
 };
 const makeVariant=v=>({
  '@type':'Product',
  name:[product.rawTitle||product.title,v.size,v.color,v.style,v.formatLabel].filter(Boolean).join(' · '),
  sku:v.sku||undefined,
  ...((product.seoConfig?.gtin||product.barcode)?{gtin:product.seoConfig?.gtin||product.barcode}:{}),
  ...(product.seoConfig?.mpn?{mpn:product.seoConfig.mpn}:{}),
  ...(v.size?{size:v.size}:{}),
  ...(v.color?{color:v.color}:{}),
  ...(images.length?{image:images}:{}),
  offers:{
   '@type':'Offer',
   url:productUrl(product,v),
   price:Number(v.price),
   priceCurrency:v.currency||'TRY',
   availability:schemaAvailability(v,product),
   itemCondition:schemaCondition(product)
  }
 });
 if(variants.length===1){
  const variant=makeVariant(variants[0]);
  return {'@context':'https://schema.org',...common,...variant};
 }
 const varies=[];
 if(variants.some(v=>v.size))varies.push('https://schema.org/size');
 if(variants.some(v=>v.color))varies.push('https://schema.org/color');
 return {
  '@context':'https://schema.org',
  '@type':'ProductGroup',
  ...common,
  productGroupID:product.catalogue||product.id,
  ...(varies.length?{variesBy:varies}:{}),
  hasVariant:variants.map(v=>makeVariant(v))
 };
}

export function jsonLd(value){
 return JSON.stringify(value).replace(/</g,'\\u003c');
}
