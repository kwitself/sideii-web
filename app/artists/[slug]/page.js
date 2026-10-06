import Link from 'next/link';
import {notFound} from 'next/navigation';
import {createClient} from '@supabase/supabase-js';
import '../artists.css';
import GlobalHeader from '../../components/GlobalHeader';

export const revalidate=0;
function client(){const u=process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;return u&&k?createClient(u,k,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}):null}
function slugify(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function asset(sb,path){if(!path)return null;if(/^https?:\/\//i.test(path))return path;return sb.storage.from('release-artwork').getPublicUrl(path).data.publicUrl}

export async function generateMetadata({params}){const {slug}=await params;const sb=client();if(!sb)return {};const {data}=await sb.rpc('get_public_artist_names');const artist=(data||[]).find(x=>slugify(x.artist_project)===slug);return artist?{title:artist.artist_project,description:artist.artist_project+' — SIDE:II catalogue.'}:{}}

export default async function ArtistDetail({params}){
 const {slug}=await params;const sb=client();if(!sb)notFound();
 const {data:names}=await sb.rpc('get_public_artist_names');const artist=(names||[]).find(x=>slugify(x.artist_project)===slug);if(!artist)notFound();
 const {data,error}=await sb.rpc('get_artist_catalogue',{p_artist:artist.artist_project});const rows=Array.isArray(data)?data:[];
 if(error)notFound();
 return <main className="artistsPage">
  <GlobalHeader/>
  <section className="artistDetailHero shell"><span>ARTIST / PROJECT</span><h1>{artist.artist_project}</h1><p>{rows.length} catalogue release{rows.length===1?'':'s'}.</p></section>
  <section className="artistCatalogue shell">{rows.map((r,i)=><Link href={'/releases/'+r.slug} key={r.product_id} className="artistRelease"><div>{asset(sb,r.artwork_path)?<img src={asset(sb,r.artwork_path)} alt={r.title}/>:<span>{r.catalogue_no}</span>}</div><section><small>{String(i+1).padStart(2,'0')} · {r.catalogue_no} · {String(r.imprint||'sideii').toUpperCase()}</small><h2>{r.title}</h2><p>{r.release_date?new Date(r.release_date+'T00:00:00Z').toLocaleDateString('en-GB'):'DATE TBA'}</p></section></Link>)}</section>
 </main>
}
