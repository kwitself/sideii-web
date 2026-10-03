'use client';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {supabase} from '../../../lib/supabase';
import MerchEditor from '../../MerchEditor';

export default function MerchEditorPage({id}){
 const router=useRouter();
 const [product,setProduct]=useState(null);
 const [error,setError]=useState('');
 async function load(){
  const result=await supabase.from('products').select('id,catalogue_no,title,description,status,product_type,merch_category,cover_url,product_variants(id,sku,price,currency,stock_qty,option_size,option_color,option_style,weight_g)').eq('id',id).single();
  if(result.error){setError(result.error.message);return}
  setProduct(result.data);
 }
 useEffect(()=>{load()},[id]);
 if(error)return <section className="adminContent"><p className="workspaceMessage">{error}</p></section>;
 if(!product)return <section className="adminContent"><p className="workspaceMessage">Loading merch...</p></section>;
 return <section className="adminContent merchPage"><MerchEditor product={product} embedded={true} onClose={()=>router.push('/admin#products')} onSaved={load}/></section>;
}
