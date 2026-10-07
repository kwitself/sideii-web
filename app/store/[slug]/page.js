import Link from 'next/link';
import {notFound} from 'next/navigation';
import {getStoreProduct} from '../../lib/catalogue';
import MerchProductClient from './MerchProductClient';
import '../store.css';
import GlobalHeader from '../../components/GlobalHeader';
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
 return {title,description,...(seo.canonical?{alternates:{canonical:seo.canonical}}:{}),openGraph:{title,description,images:ogImage?[ogImage]:[]}};
}

export default async function StoreProductPage({params}){
 const {slug}=await params;
 const product=await getStoreProduct(slug);
 if(!product||!product.isMerch)notFound();
 const schema=productSchema(product);
 return <main className="storePage merchDetailPage">
  {schema&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(schema)}}/>}
  <GlobalHeader/>
  <MerchProductClient product={product}/>
 </main>
}
