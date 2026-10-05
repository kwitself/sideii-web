'use client';
import {useEffect,useState} from 'react';
import {supabase} from '../lib/supabase';

export default function ValueOpsPanel(){
 const [brief,setBrief]=useState([]),[giftCards,setGiftCards]=useState([]),[prices,setPrices]=useState([]),[variants,setVariants]=useState([]),[message,setMessage]=useState('');
 async function load(){
  const [b,g,w,v]=await Promise.all([
   supabase.rpc('admin_daily_brief'),
   supabase.rpc('admin_list_gift_cards'),
   supabase.rpc('admin_list_wholesale_prices'),
   supabase.from('product_variants').select('id,sku,format,preorder_enabled,preorder_target,preorder_deadline,products(id,catalogue_no,title)').eq('active',true)
  ]);
  if(b.error)return setMessage(b.error.message);
  setBrief(b.data||[]);setGiftCards(g.data||[]);setPrices(w.data||[]);setVariants(v.data||[]);
 }
 useEffect(()=>{load()},[]);
 return <section id="value-ops" className="adminSection valueOps">
  <div className="sectionLabel"><span>12 / VALUE OPS</span><p>Daily brief, preorder targets, store credit, gift cards and wholesale pricing.</p></div>
  {message&&<p className="dbNotice">{message}</p>}
  <div className="metricGrid">{brief.map(x=><article key={x.metric}><span>{x.metric}</span><strong>{x.value}</strong><small>PRIORITY {x.priority}</small></article>)}</div>
  <div className="valueOpsGrid">
   <article className="adminPanel valueOpsCard"><header><span>GIFT CARDS</span><small>{giftCards.length} issued</small></header>{giftCards.length===0?<p className="emptyNote">No gift cards yet.</p>:giftCards.slice(0,8).map(x=><p key={x.id}>{x.code}<b>{x.remaining_value} TRY</b></p>)}</article>
   <article className="adminPanel valueOpsCard"><header><span>WHOLESALE PRICES</span><small>{prices.length} rule(s)</small></header>{prices.length===0?<p className="emptyNote">No wholesale prices yet.</p>:prices.slice(0,8).map(x=><p key={x.id}>MOQ {x.min_quantity}<b>{x.unit_price} TRY</b></p>)}</article>
  </div>
  <article className="adminPanel valueOpsCard"><header><span>PREORDER TARGETS</span><small>{variants.filter(v=>v.preorder_enabled).length} active</small></header>{variants.filter(v=>v.preorder_enabled).map(v=><p key={v.id}>{v.products?.catalogue_no||'—'} · {v.sku}<b>{v.preorder_target||'NO TARGET'}</b></p>)}</article>
 </section>;
}