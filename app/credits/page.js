import Link from 'next/link';
import T from '../components/T';
import {createClient} from '@supabase/supabase-js';
import './credits.css';
import GlobalHeader from '../components/GlobalHeader';

export const revalidate=0;
export const metadata={title:'Credits',description:'People credited across the SIDE:II catalogue.'};

function client(){const u=process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;return u&&k?createClient(u,k,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}):null}
function slugify(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}

export default async function Credits(){
 const sb=client();let rows=[];if(sb){const {data}=await sb.rpc('get_public_credit_people');rows=Array.isArray(data)?data:[]}
 return <main className="creditsPage">
  <GlobalHeader/>
  <section className="creditsHero shell"><span><T k="CATALOGUE / CREDITS"/></span><h1><T k="Who made"/><br/><i><T k="the object."/></i></h1><p>Production, mastering, artwork, photography and other credited work across SIDE:II releases.</p></section>
  <section className="creditsList shell">{rows.length===0?<div className="creditsEmpty">NO STRUCTURED CREDITS YET.</div>:rows.map((x,i)=><Link key={x.person_name} href={'/credits/'+slugify(x.person_name)}><span>{String(i+1).padStart(2,'0')}</span><h2>{x.person_name}</h2><b>{x.credit_count} CREDIT{x.credit_count===1?'':'S'} →</b></Link>)}</section>
 </main>
}
