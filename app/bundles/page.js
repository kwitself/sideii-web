import {createClient} from '@supabase/supabase-js';
import {getStoreReleases} from '../lib/catalogue';
import BundleClient from './BundleClient';
import './bundles.css';

export const revalidate=0;
export const metadata={title:'Bundles',description:'SIDE:II collector bundles and complete edition sets.'};

function client(){const u=process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;return u&&k?createClient(u,k,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}):null}

export default async function BundlesPage(){
 const sb=client();let bundles=[];if(sb){const {data}=await sb.rpc('get_public_bundles');bundles=Array.isArray(data)?data:[]}
 const products=await getStoreReleases();
 return <BundleClient bundles={bundles} products={products}/>;
}
