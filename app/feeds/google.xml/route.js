import {getStoreReleases} from '../../lib/catalogue';
import {availabilityValue,brandName,conditionValue,productDescription,productImages,productUrl} from '../../lib/productCommerceMeta';

export const revalidate=900;

const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]));

function tag(name,value){
 if(value===undefined||value===null||value==='')return '';
 return `<g:${name}>${esc(value)}</g:${name}>`;
}

function feedItem(product,variant){
 const availability=availabilityValue(variant);
 const active=product.status==='AVAILABLE';
 const preorder=availability==='preorder';
 if(!active&&!preorder)return '';
 if(product.storefrontConfig?.visibility?.store===false)return '';
 if(product.storefrontConfig?.visibility?.google===false)return '';
 if(variant?.price==null)return '';
 const images=productImages(product);
 if(!images[0])return '';
 const id=String(variant.sku||variant.id||product.catalogue||product.id);
 const itemGroup=(product.variants||[]).length>1?String(product.catalogue||product.id):null;
 const brand=brandName(product);
 const gtin=product.seoConfig?.gtin||product.barcode||'';
 const mpn=product.seoConfig?.mpn||(!gtin?variant.sku||product.catalogue:'');
 const identifierExists=Boolean(gtin||(brand&&mpn));
 const title=[product.title,variant.size,variant.color,variant.style,product.isMerch?null:variant.formatLabel].filter(Boolean).join(' · ');
 const extraImages=images.slice(1,11).map(x=>tag('additional_image_link',x)).join('');
 return `<item>
${tag('id',id)}
${tag('title',title)}
${tag('description',productDescription(product))}
${tag('link',productUrl(product,variant))}
${tag('image_link',images[0])}
${extraImages}
${tag('availability',availability)}
${tag('price',Number(variant.price).toFixed(2)+' '+(variant.currency||'TRY'))}
${tag('condition',conditionValue(product))}
${tag('brand',brand)}
${tag('gtin',gtin)}
${tag('mpn',mpn)}
${!identifierExists?tag('identifier_exists','no'):''}
${tag('item_group_id',itemGroup)}
${tag('size',variant.size)}
${tag('color',variant.color)}
${tag('product_type',product.isMerch?('SIDE:II > MERCH > '+String(product.merchCategory||'OTHER').toUpperCase()):('SIDE:II > MUSIC > '+String(variant.formatLabel||product.format)))}
${tag('google_product_category',product.seoConfig?.google_category||'')}
</item>`;
}

export async function GET(){
 const products=await getStoreReleases();
 const items=[];
 for(const product of products||[]){
  for(const variant of product.variants||[]){
   const xml=feedItem(product,variant);
   if(xml)items.push(xml);
  }
 }
 const body=`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>SIDE:II Product Feed</title>
<link>${esc(process.env.NEXT_PUBLIC_SITE_URL||'https://sideii-web.vercel.app')}</link>
<description>SIDE:II store catalogue for Google Merchant Center</description>
${items.join('\n')}
</channel>
</rss>`;
 return new Response(body,{headers:{'content-type':'application/xml; charset=utf-8','cache-control':'public, s-maxage=900, stale-while-revalidate=3600'}});
}
