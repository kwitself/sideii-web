export function evaluateProductQa(product={}){
 const variants=Array.isArray(product.product_variants)?product.product_variants:[];
 const storefront=product.storefront_config||{};
 const visibility=storefront.visibility||{};
 const seo=product.seo_config||{};
 const commerce=product.commerce_config||{};
 const isMerch=product.product_type==='merch';
 const issues=[];
 const add=(severity,code,label,tab,detail='')=>issues.push({severity,code,label,tab,detail});

 if(!String(product.title||'').trim())add('blocker','title','TITLE MISSING','release');
 const gallery=Array.isArray(product.gallery_images)?product.gallery_images:[];
 const hasGalleryImage=gallery.some(x=>typeof x==='string'?!!x:!!(x?.url||x?.preview_url||x?.previewUrl||x?.mockup?.designUrl));
 if(!product.artwork_path&&!product.cover_url&&!hasGalleryImage)add('blocker','image','PRIMARY IMAGE MISSING','release');
 if(!variants.length)add('blocker','variants','NO SELLABLE VARIANT','media');
 if(variants.some(v=>!String(v.sku||'').trim()))add('blocker','sku','SKU MISSING','media');
 if(variants.some(v=>!Number.isFinite(Number(v.price))||Number(v.price)<0))add('blocker','price','INVALID / MISSING PRICE','media');
 if(variants.some(v=>v.active===false))add('warning','inactive-variant','INACTIVE VARIANT EXISTS','media');
 if(variants.some(v=>v.format!=='digital'&&!String(v.shipping_class||'').trim()))add('warning','shipping-class','SHIPPING CLASS MISSING','commerce');
 if(variants.some(v=>v.format!=='digital'&&(v.weight_g==null||v.weight_g==='')))add('warning','weight','WEIGHT MISSING','commerce');
 const available=variants.some(v=>v.format==='digital'||Number(v.stock_qty||0)-Number(v.reserved_qty||0)>0||v.preorder_enabled);
 if(product.status==='active'&&!available)add('blocker','availability','ACTIVE PRODUCT HAS NO STOCK / PRE-ORDER','commerce');
 if(visibility.store===false)add('warning','store-hidden','STORE VISIBILITY OFF','storefront');
 if(visibility.search===false)add('warning','search-hidden','SEARCH VISIBILITY OFF','storefront');
 if(visibility.google!==false){
  if(!(seo.gtin||product.barcode||seo.mpn))add('warning','identifier','GTIN / BARCODE / MPN MISSING','seo');
  if(!seo.google_category)add('warning','google-category','GOOGLE CATEGORY MISSING','seo');
 }
 if((seo.title||'').length>70)add('warning','seo-title','SEO TITLE OVER 70 CHARACTERS','seo');
 if((seo.description||'').length>160)add('warning','seo-description','META DESCRIPTION OVER 160 CHARACTERS','seo');
 if(!String(product.description||'').trim())add('warning','description','PRODUCT DESCRIPTION MISSING','release');
 if(!isMerch&&!String(product.artist_project||'').trim())add('warning','artist','ARTIST / PROJECT MISSING','release');
 if(commerce.min_qty!=null&&commerce.max_qty!=null&&Number(commerce.max_qty)<Number(commerce.min_qty))add('blocker','quantity-range','MAX QTY BELOW MIN QTY','commerce');

 const blockers=issues.filter(x=>x.severity==='blocker');
 const warnings=issues.filter(x=>x.severity==='warning');
 const deductions=blockers.length*25+warnings.length*6;
 const score=Math.max(0,100-deductions);
 const state=blockers.length?'BLOCKED':warnings.length?'WARNING':'READY';
 return {state,score,blockers,warnings,issues,ready:blockers.length===0};
}
