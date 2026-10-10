import {createClient} from '@supabase/supabase-js';
import {getStoreReleases} from '../lib/catalogue';
import BundleClient from './BundleClient';
import './bundles.css';

export const revalidate=0;
export const metadata={title:'Bundles',description:'SIDE:II collector bundles and complete edition sets.'};

function client(){const u=process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;return u&&k?createClient(u,k,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}):null}

export default async function BundlesPage(){
 const sb=client();let bundles=[],flexRules=[];if(sb){const [{data:b},{data:f}]=await Promise.all([sb.rpc('get_public_bundles'),sb.from('flexible_bundle_rules').select('id,name,min_items,max_items,discount_type,discount_value,eligible_product_ids').eq('active',true)]);bundles=Array.isArray(b)?b:[];flexRules=Array.isArray(f)?f:[]}
 const products=await getStoreReleases();
 return <BundleClient bundles={bundles} products={products} flexRules={flexRules}/>;
}
