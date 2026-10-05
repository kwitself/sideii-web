import Link from 'next/link';
import T from '../components/T';
import {createClient} from '@supabase/supabase-js';
import './artists.css';

export const revalidate=0;
export const metadata={title:'Artists',description:'Artists and projects across the SIDE:II catalogue.'};

function client(){const u=process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;return u&&k?createClient(u,k,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}):null}
function slugify(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}

export default async function Artists(){
 const sb=client();let rows=[];if(sb){const {data}=await sb.rpc('get_public_artist_names');rows=Array.isArray(data)?data:[]}
 return <main className="artistsPage">
  <header className="nav shell"><Link className="brand" href="/"><img src="/brand/sideii-logo-flat.png" alt="SIDE:II"/></Link><nav><Link href="/#releases"><T k="Releases"/></Link><Link href="/artists"><T k="Artists"/></Link><Link href="/store"><T k="Store"/></Link></nav></header>
  <section className="artistsHero shell"><span><T k="CATALOGUE / ARTISTS"/></span><h1><T k="People behind"/><br/><i><T k="the objects."/></i></h1><p>Artists and projects represented across the SIDE:II catalogue and imprints.</p></section>
  <section className="artistsList shell">{rows.length===0?<div className="artistsEmpty">NO PUBLIC ARTISTS YET.</div>:rows.map((a,i)=><Link href={'/artists/'+slugify(a.artist_project)} key={a.artist_project}><span>{String(i+1).padStart(2,'0')}</span><h2>{a.artist_project}</h2><b>{a.release_count} RELEASE{Number(a.release_count)===1?'':'S'} →</b></Link>)}</section>
 </main>
}
