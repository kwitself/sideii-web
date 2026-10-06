import Link from 'next/link';
import T from '../components/T';
import {createClient} from '@supabase/supabase-js';
import './collections.css';
import GlobalHeader from '../components/GlobalHeader';

export const revalidate=0;
export const metadata={title:'Collections',description:'SIDE:II drops, core objects and artist editions.'};

function client(){const u=process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;return u&&k?createClient(u,k,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}):null}

export default async function Collections(){
 const sb=client();let rows=[];if(sb){const {data}=await sb.rpc('get_public_collections');rows=Array.isArray(data)?data:[]}
 return <main className="collectionsPage">
  <GlobalHeader/>
  <section className="collectionsHero shell"><span><T k="STORE / COLLECTIONS"/></span><h1><T k="Objects,"/><br/><i><T k="grouped by intent."/></i></h1><p>Core pieces, timed drops and artist-linked objects from across the SIDE:II catalogue.</p></section>
  <section className="collectionsList shell">
   {rows.length===0?<div className="collectionEmpty"><small>COLLECTIONS / IN PREPARATION</small><h2>No public collections yet.</h2></div>:rows.map((c,i)=><Link href={'/collections/'+c.slug} className="collectionRow" key={c.id}>
     <span>{String(i+1).padStart(2,'0')}</span><div><small>{String(c.kind).replace('_',' ').toUpperCase()}</small><h2>{c.name}</h2><p>{c.description||'SIDE:II collection.'}</p></div><b>{c.product_count} OBJECT{Number(c.product_count)===1?'':'S'} →</b>
   </Link>)}
  </section>
 </main>
}
