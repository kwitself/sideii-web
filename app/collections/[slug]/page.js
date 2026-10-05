import Link from 'next/link';
import {notFound} from 'next/navigation';
import {createClient} from '@supabase/supabase-js';
import '../collections.css';

export const revalidate=0;
function client(){const u=process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;return u&&k?createClient(u,k,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}):null}
function asset(sb,path){if(!path)return null;if(/^https?:\/\//i.test(path))return path;return sb.storage.from('release-artwork').getPublicUrl(path).data.publicUrl}

export async function generateMetadata({params}){const {slug}=await params;const sb=client();if(!sb)return {};const {data}=await sb.rpc('get_public_collection',{p_slug:slug});const r=Array.isArray(data)?data[0]:null;return r?{title:r.name,description:r.description||'SIDE:II collection.'}:{}}

export default async function CollectionDetail({params}){
 const {slug}=await params;const sb=client();if(!sb)notFound();
 const {data,error}=await sb.rpc('get_public_collection',{p_slug:slug});const rows=Array.isArray(data)?data:[];
 if(error||!rows.length)notFound();
 const head=rows[0];
 return <main className="collectionsPage">
  <header className="nav shell"><Link className="brand" href="/"><img src="/brand/sideii-logo-flat.png" alt="SIDE:II"/></Link><nav><Link href="/collections">Collections</Link><Link href="/store">Store</Link></nav></header>
  <section className="collectionDetailHero shell"><span>{String(head.kind).replace('_',' ').toUpperCase()} / COLLECTION</span><h1>{head.name}</h1><p>{head.description||'A SIDE:II collection.'}</p></section>
  <section className="collectionObjects shell">{rows.map((p,i)=>{const cover=asset(sb,p.artwork_path);const href=p.product_type==='merch'?'/store/'+p.product_slug:'/releases/'+p.product_slug;return <Link key={p.product_id} href={href} className="collectionObject"><div className="collectionObjectVisual">{cover?<img src={cover} alt={p.title}/>:<span>{p.catalogue_no}</span>}</div><div><small>{String(i+1).padStart(2,'0')} · {p.catalogue_no}</small><h2>{p.title}</h2><p>{p.product_type==='merch'?String(p.merch_category||'MERCH').toUpperCase():(p.artist_project||'SIDE:II')}</p></div></Link>})}</section>
 </main>
}
