import Link from 'next/link';
import {notFound} from 'next/navigation';
import {getStoreProduct,getRelatedProducts} from '../../lib/catalogue';
import MerchProductClient from './MerchProductClient';
import '../store.css';
import GlobalHeader from '../../components/GlobalHeader';
import ProductDiscovery from '../../components/ProductDiscovery';
import {jsonLd,productSchema} from '../../lib/productCommerceMeta';

export const revalidate=0;

export async function generateMetadata({params}){
 const {slug}=await params;
 const product=await getStoreProduct(slug);
 if(!product||!product.isMerch)return {};
 const seo=product.seoConfig||{};
 const title=seo.title||`${product.title} — SIDE:II Store`;
 const description=seo.description||product.lead;
 const ogImage=seo.og_image||product.cover||null;
 return {title,description,alternates:{canonical:seo.canonical||('/store/'+slug)},openGraph:{title,description,url:seo.canonical||('/store/'+slug),images:ogImage?[ogImage]:[]}};
}

export default async function StoreProductPage({params}){
 const {slug}=await params;
 const product=await getStoreProduct(slug);
 if(!product||!product.isMerch)notFound();
 const schema=productSchema(product);
 const detail=product.storefrontConfig?.detail||{};
 const related=detail.related===false?[]:await getRelatedProducts(product.id,6);
 return <main className="storePage merchDetailPage">
  {schema&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(schema)}}/>}
  <GlobalHeader/>
  <MerchProductClient product={product}/>
  {detail.related!==false&&<ProductDiscovery current={product} related={related}/>} 
 </main>
}
