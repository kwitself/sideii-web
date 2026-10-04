import Link from 'next/link';
import {notFound} from 'next/navigation';
import {getStoreProduct} from '../../lib/catalogue';
import MerchProductClient from './MerchProductClient';
import '../store.css';

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
  <header className="nav shell"><Link className="brand" href="/"><img src="/brand/sideii-logo-flat.png" alt="Side II"/></Link><nav><Link href="/">Releases</Link><Link href="/store">Store</Link></nav></header>
  <MerchProductClient product={product}/>
 </main>
}
