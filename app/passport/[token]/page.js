import Link from 'next/link';
import {notFound} from 'next/navigation';
import {createClient} from '@supabase/supabase-js';
import './passport.css';

export const revalidate=0;

function serverClient(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 return url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}):null;
}

export async function generateMetadata({params}){
 const {token}=await params;
 const sb=serverClient(); if(!sb)return {};
 const {data}=await sb.rpc('get_public_edition_passport',{p_token:token});
 const p=Array.isArray(data)?data[0]:data;
 if(!p)return {};
 return {title:'Edition Passport · '+p.catalogue_no,description:p.product_title+' · '+String(p.format||'edition').toUpperCase()+' · authenticated SIDE:II edition record.'};
}

export default async function PassportPage({params}){
 const {token}=await params;
 const sb=serverClient(); if(!sb)notFound();
 const {data,error}=await sb.rpc('get_public_edition_passport',{p_token:token});
 const p=Array.isArray(data)?data[0]:data;
 if(error||!p)notFound();
 const active=p.status==='active';
 return <main className="passportPage">
  <header className="nav shell"><Link className="brand" href="/"><img src="/brand/sideii-logo-flat.png" alt="SIDE:II"/></Link><nav><Link href="/store">Store</Link><Link href="/#releases">Releases</Link></nav></header>
  <section className="passportHero shell">
   <span>EDITION PASSPORT / VERIFIED RECORD</span>
   <h1>{p.catalogue_no}<br/><i>{p.product_title}</i></h1>
   <p>This page verifies an edition record issued by SIDE:II after a paid order. It is a product provenance record, not a financial or legal ownership certificate.</p>
  </section>
  <section className="passportCard shell">
   <div className="passportSeal"><span>II</span><small>{active?'ACTIVE':'REVOKED'}</small></div>
   <div className="passportFacts">
    <div><span>CATALOGUE</span><b>{p.catalogue_no}</b></div>
    <div><span>FORMAT</span><b>{String(p.format||'').toUpperCase()}</b></div>
    <div><span>EDITION</span><b>{p.edition_number!=null?'#'+String(p.edition_number).padStart(3,'0'):'—'}{p.edition_total?' / '+p.edition_total:''}</b></div>
    <div><span>ARTIST / PROJECT</span><b>{p.artist_project||'SIDE:II'}</b></div>
    <div><span>IMPRINT</span><b>{String(p.imprint||'sideii').toUpperCase()}</b></div>
    <div><span>ISSUED</span><b>{new Date(p.issued_at).toLocaleDateString('en-GB')}</b></div>
    <div><span>ORDER REFERENCE</span><b>#SII-{String(p.order_no).padStart(4,'0')}</b></div>
    <div><span>SKU</span><b>{p.sku||'—'}</b></div>
   </div>
   <div className={'passportStatus '+(active?'active':'revoked')}><span>{active?'VERIFIED EDITION RECORD':'REVOKED RECORD'}</span><p>{active?'This passport currently matches an active paid edition record in the SIDE:II catalogue system.':'This passport was revoked after the related transaction changed state.'}</p></div>
  </section>
  <section className="passportFoot shell"><span>PHYSICAL OBJECT / DIGITAL RECORD</span><p>Keep this URL with the physical edition. Future owner-only content and QR access can use the same passport identity.</p><Link href="/store">OPEN STORE →</Link></section>
 </main>;
}
