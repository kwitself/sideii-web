import Link from 'next/link';
import {notFound} from 'next/navigation';
import {createClient} from '@supabase/supabase-js';
import './receipt.css';

export const revalidate=0;
function sb(){const u=process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;return u&&k?createClient(u,k,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}):null}
const money=(n,c='TRY')=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:c,maximumFractionDigits:2}).format(Number(n||0));

export async function generateMetadata({params}){const {token}=await params;const c=sb();if(!c)return {};const {data}=await c.rpc('get_public_impact_receipt',{p_token:token});const r=Array.isArray(data)?data[0]:data;return r?{title:'Impact Receipt · '+r.campaign_name,description:'Verified SIDE:II impact contribution receipt.'}:{}}

export default async function ReceiptPage({params}){
 const {token}=await params;const c=sb();if(!c)notFound();
 const {data,error}=await c.rpc('get_public_impact_receipt',{p_token:token});const r=Array.isArray(data)?data[0]:data;
 if(error||!r)notFound();
 return <main className="impactReceiptPage">
  <header className="nav shell"><Link className="brand" href="/"><img src="/brand/sideii-logo-flat.png" alt="SIDE:II"/></Link><nav><Link href="/impact">Impact</Link><Link href="/store">Store</Link></nav></header>
  <section className="impactReceiptHero shell"><span>IMPACT RECEIPT / VERIFIED</span><h1>{r.campaign_name}</h1><p>{r.customer_message||'This purchase contributed to a verified SIDE:II donation batch.'}</p></section>
  <section className="impactReceiptCard shell"><div className="impactReceiptSeal">✓</div><div className="impactReceiptFacts">
   <div><span>CONTRIBUTION</span><b>{money(r.amount,r.currency)}</b></div><div><span>PRODUCT</span><b>{r.product_title}</b></div>
   <div><span>BENEFICIARY</span><b>{r.beneficiary_name}</b></div><div><span>ORDER REF</span><b>#SII-{String(r.order_no).padStart(4,'0')}</b></div>
   <div><span>TRANSFER REF</span><b>{r.transfer_reference||'—'}</b></div><div><span>VERIFIED</span><b>{r.verified_at?new Date(r.verified_at).toLocaleDateString('en-GB'):'—'}</b></div>
  </div></section>
  <section className="impactReceiptProof shell"><span>PROOF</span><p>This record is linked to a verified batch. The contribution is recorded as a SIDE:II donation allocation, not as a tax-deductible donation made personally by the customer.</p>{r.proof_url&&<a href={r.proof_url} target="_blank" rel="noreferrer">OPEN TRANSFER PROOF ↗</a>}{r.beneficiary_url&&<a href={r.beneficiary_url} target="_blank" rel="noreferrer">BENEFICIARY ↗</a>}</section>
 </main>
}
