import Link from 'next/link';
import {createClient} from '@supabase/supabase-js';
import './impact.css';

export const revalidate=0;
export const metadata={title:'Impact',description:'Verified SIDE:II impact contributions and donation batches.'};

function sb(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 return url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}):null;
}
const money=(n,c='TRY')=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:c,maximumFractionDigits:2}).format(Number(n||0));

export default async function ImpactPage(){
 const client=sb(); let rows=[];
 if(client){const {data}=await client.rpc('get_public_impact_summary');rows=Array.isArray(data)?data:[]}
 const total=rows.reduce((s,x)=>s+Number(x.donated_total||0),0);
 const orders=rows.reduce((s,x)=>s+Number(x.contributing_orders||0),0);
 return <main className="impactPublicPage">
  <header className="nav shell"><Link className="brand" href="/"><img src="/brand/sideii-logo-flat.png" alt="SIDE:II"/></Link><nav><Link href="/wear">Wear</Link><Link href="/store">Store</Link><Link href="/impact">Impact</Link></nav></header>
  <section className="impactPublicHero shell"><span>WEAR WHAT YOU SUPPORT / VERIFIED IMPACT</span><h1>Support,<br/><i>accounted for.</i></h1><p>Only verified donation batches appear here. Individual customer identities are never published.</p><div className="impactPublicStats"><div><small>VERIFIED CONTRIBUTIONS</small><b>{money(total)}</b></div><div><small>CONTRIBUTING ORDERS</small><b>{orders}</b></div><div><small>ACTIVE CAMPAIGNS</small><b>{rows.length}</b></div></div></section>
  <section className="impactPublicList shell">
   <div className="impactPublicHead"><span>CAMPAIGNS</span><p>Transparent totals from verified transfer records.</p></div>
   {rows.length===0?<div className="impactPublicEmpty"><small>NO VERIFIED BATCHES YET</small><h2>The ledger is ready. Verified contributions will appear here automatically.</h2></div>:rows.map(r=><article key={r.campaign_id}><div><small>CAMPAIGN</small><h2>{r.campaign_name}</h2><p>{r.beneficiary_name}</p>{r.beneficiary_url&&<a href={r.beneficiary_url} target="_blank" rel="noreferrer">BENEFICIARY ↗</a>}</div><div className="impactPublicAmount"><small>VERIFIED</small><b>{money(r.donated_total,r.currency)}</b><span>{r.verified_batches} BATCH · {r.contributing_orders} ORDERS</span></div></article>)}
  </section>
  <section className="impactPublicNote shell"><span>HOW IT WORKS</span><p>Paid eligible order → contribution allocation → donation batch → transfer proof → verification → customer receipt.</p><Link href="/wear">WEAR WHAT YOU SUPPORT →</Link></section>
 </main>
}
