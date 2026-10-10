import {getStoreReleases} from '../../lib/catalogue';
import {availabilityValue,brandName,conditionValue,productDescription,productImages,productUrl} from '../../lib/productCommerceMeta';

export const revalidate=900;
const csv=v=>'"'+String(v??'').replaceAll('"','""').replace(/[\r\n]+/g,' ')+'"';

function rows(){
 return getStoreReleases().then(products=>{
  const out=[];
  for(const product of products||[]){
   if(product.storefrontConfig?.visibility?.store===false)continue;
   for(const variant of product.variants||[]){
    const availability=availabilityValue(variant,product);
    if(!['in stock','preorder','out of stock'].includes(availability))continue;
    const images=productImages(product);if(!images[0]||variant?.price==null)continue;
    const id=String(variant.sku||variant.id||product.catalogue||product.id);
    const title=[product.rawTitle||product.title,variant.size,variant.color,variant.style,product.isMerch?null:variant.formatLabel].filter(Boolean).join(' · ');
    out.push({
     id,title,description:productDescription(product),availability,condition:conditionValue(product),
     price:Number(variant.price).toFixed(2)+' '+(variant.currency||'TRY'),link:productUrl(product,variant),image_link:images[0],
     brand:brandName(product),google_product_category:product.seoConfig?.google_category||'',
     product_type:product.isMerch?('SIDE:II > MERCH > '+String(product.merchCategory||'OTHER').toUpperCase()):('SIDE:II > MUSIC > '+String(variant.formatLabel||product.format))
    });
   }
  }
  return out;
 });
}

export async function GET(request){
 const platform=new URL(request.url).pathname.includes('pinterest')?'pinterest':'meta';
 const data=await rows();
 const header=['id','title','description','availability','condition','price','link','image_link','brand','product_type'];
 const body=[header.join(','),...data.map(r=>header.map(k=>csv(r[k])).join(','))].join('\n');
 return new Response(body,{headers:{'content-type':'text/csv; charset=utf-8','content-disposition':`inline; filename="sideii-${platform}-catalog.csv"`,'cache-control':'public, s-maxage=900, stale-while-revalidate=3600'}});
}
