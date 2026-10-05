import Link from 'next/link';
import T from '../../components/T';
import {notFound} from 'next/navigation';
import {createClient} from '@supabase/supabase-js';
import './press.css';

export const revalidate=0;

function client(){
 const u=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const k=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 return u&&k?createClient(u,k,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}):null;
}
export async function generateMetadata({params}){
 const {slug}=await params;const sb=client();if(!sb)return {};
 const {data}=await sb.rpc('get_public_press_kit',{p_slug:slug});const r=Array.isArray(data)?data[0]:null;
 return r?{title:r.title+' · Press Kit',description:r.press_copy||('Press kit for '+r.title+'.')}:{};
}
export default async function PressKitPage({params}){
 const {slug}=await params;const sb=client();if(!sb)notFound();
 const {data,error}=await sb.rpc('get_public_press_kit',{p_slug:slug});const r=Array.isArray(data)?data[0]:null;
 if(error||!r)notFound();
 const assets=Array.isArray(r.assets)?r.assets:[];
 return <main className="pressPage">
  <header className="nav shell"><Link className="brand" href="/"><img src="/brand/sideii-logo-flat.png" alt="SIDE:II"/></Link><nav><Link href="/artists"><T k="Artists"/></Link><Link href="/credits"><T k="Credits"/></Link><Link href="/store"><T k="Store"/></Link></nav></header>
  <section className="pressHero shell"><span><T k="PRESS / MEDIA KIT"/></span><h1>{r.title}</h1><p>{r.artist_project||'SIDE:II'} · {r.catalogue_no}</p></section>
  <section className="pressBody shell">
   <div className="pressCopy"><span><T k="PRESS COPY"/></span><p>{r.press_copy||'Press information for this release.'}</p></div>
   <div className="pressAssets"><div className="pressAssetsHead"><span><T k="ASSETS"/></span><small>{assets.length}</small></div>
    {assets.length===0?<p className="pressEmpty"><T k="No public assets available."/></p>:assets.map((a,i)=><a key={i} href={a.url} target="_blank" rel="noreferrer"><div><small>{String(a.type||'other').toUpperCase()}</small><b>{a.label}</b></div><span><T k="OPEN ↗"/></span></a>)}
   </div>
  </section>
 </main>;
}