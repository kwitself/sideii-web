import Link from 'next/link';
import {notFound} from 'next/navigation';
import {getStoreProduct} from '../../lib/catalogue';
import MerchProductClient from './MerchProductClient';
import '../store.css';
import GlobalHeader from '../../components/GlobalHeader';

export const revalidate=0;

export async function generateMetadata({params}){
 const {slug}=await params;
 const product=await getStoreProduct(slug);
 if(!product||!product.isMerch)return {};
 return {title:`${product.title} — SIDE:II Store`,description:product.lead};
}

export default async function StoreProductPage({params}){
 const {slug}=await params;
 const product=await getStoreProduct(slug);
 if(!product||!product.isMerch)notFound();
 return <main className="storePage merchDetailPage">
  <GlobalHeader/>
  <MerchProductClient product={product}/>
 </main>
}
