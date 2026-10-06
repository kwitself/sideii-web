import Link from 'next/link';
import {notFound} from 'next/navigation';
import {createClient} from '@supabase/supabase-js';
import '../credits.css';
import GlobalHeader from '../../components/GlobalHeader';

export const revalidate=0;
function client(){const u=process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;return u&&k?createClient(u,k,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}):null}
function slugify(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function asset(sb,path){if(!path)return null;if(/^https?:\/\//i.test(path))return path;return sb.storage.from('release-artwork').getPublicUrl(path).data.publicUrl}

export async function generateMetadata({params}){const {slug}=await params;const sb=client();if(!sb)return {};const {data}=await sb.rpc('get_public_credit_people');const person=(data||[]).find(x=>slugify(x.person_name)===slug);return person?{title:person.person_name+' · Credits',description:person.person_name+' — SIDE:II catalogue credits.'}:{}}

export default async function CreditDetail({params}){
 const {slug}=await params;const sb=client();if(!sb)notFound();
 const {data:people}=await sb.rpc('get_public_credit_people');const person=(people||[]).find(x=>slugify(x.person_name)===slug);if(!person)notFound();
 const {data,error}=await sb.rpc('get_credit_person_catalogue',{p_person_name:person.person_name});const rows=Array.isArray(data)?data:[];
 if(error)notFound();
 return <main className="creditsPage">
  <GlobalHeader/>
  <section className="creditDetailHero shell"><span>CREDIT / PERSON</span><h1>{person.person_name}</h1><p>{rows.length} credited catalogue appearance{rows.length===1?'':'s'}.</p></section>
  <section className="creditCatalogue shell">{rows.map((r,i)=><Link href={'/releases/'+r.slug} key={r.product_id+':'+r.role} className="creditRelease"><div>{asset(sb,r.artwork_path)?<img src={asset(sb,r.artwork_path)} alt={r.title}/>:<span>{r.catalogue_no}</span>}</div><section><small>{String(i+1).padStart(2,'0')} · {r.catalogue_no}</small><h2>{r.title}</h2><p>{r.artist_project||'SIDE:II'}</p><b>{r.role}</b></section></Link>)}</section>
 </main>
}
