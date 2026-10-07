'use client';
import {useMemo,useState} from 'react';
import {supabase} from '../lib/supabase';

export default function WearOpsPanel({products=[],onChanged}){
 const merch=useMemo(()=>products.filter(p=>p.product_type==='merch'),[products]);
 const [draft,setDraft]=useState({}),[busy,setBusy]=useState(''),[message,setMessage]=useState('');
 const getWear=p=>({...((p.storefront_config||{}).wear||{}),...(draft[p.id]||{})});
 const patch=(id,key,value)=>setDraft(x=>({...x,[id]:{...(x[id]||{}),[key]:value}}));
 async function save(p){
  setBusy(p.id);setMessage('');
  const cfg=p.storefront_config||{},wear=getWear(p);
  const {error}=await supabase.from('products').update({storefront_config:{...cfg,wear}}).eq('id',p.id);
  setBusy(''); if(error)return setMessage(error.message);
  setMessage(p.title+' WWYS settings saved.');setDraft(x=>{const n={...x};delete n[p.id];return n});await onChanged?.();
 }
 return <section className="adminSection wearOps">
  <div className="sectionLabel"><span>04B / WEAR WHAT YOU SUPPORT</span><p>Curate the WWYS storefront, support story and product hierarchy.</p></div>
  {message&&<p className="dbNotice">{message}</p>}
  <div className="adminPanel wearOpsIntro"><div><span>WWYS SYSTEM</span><h2>Object as support,<br/><em>not filler merch.</em></h2></div><p>Choose what appears on the WWYS page, what leads the page and how each object explains who or what the purchase supports.</p></div>
  <div className="wearOpsList">
   {merch.map(p=>{const w=getWear(p),visible=(p.storefront_config?.visibility?.wear!==false);return <article className="adminPanel wearOpsRow" key={p.id}>
    <header><div><small>{p.catalogue_no||'MERCH'} · {String(p.merch_category||'OBJECT').toUpperCase()}</small><h3>{p.title}</h3></div><span>{visible?'WWYS LIVE':'WWYS HIDDEN'}</span></header>
    <div className="wearOpsGrid">
     <label className="storefrontToggle"><input type="checkbox" checked={visible} onChange={async e=>{const cfg=p.storefront_config||{},visibility={...(cfg.visibility||{}),wear:e.target.checked};await supabase.from('products').update({storefront_config:{...cfg,visibility}}).eq('id',p.id);await onChanged?.()}}/><span>SHOW ON WWYS</span></label>
     <label className="storefrontToggle"><input type="checkbox" checked={!!w.featured} onChange={e=>patch(p.id,'featured',e.target.checked)}/><span>FEATURED OBJECT</span></label>
     <label><span>SORT ORDER</span><input type="number" value={w.sort_order??0} onChange={e=>patch(p.id,'sort_order',Number(e.target.value)||0)}/></label>
     <label><span>EDITION NOTE</span><input value={w.edition_note||''} onChange={e=>patch(p.id,'edition_note',e.target.value)} placeholder="LIMITED RUN · 50 PIECES"/></label>
     <label className="wearOpsWide"><span>SUPPORT LINE</span><input value={w.support_line||''} onChange={e=>patch(p.id,'support_line',e.target.value)} placeholder="Supports the artist and the next physical release."/></label>
     <label className="wearOpsWide"><span>OBJECT STORY</span><textarea rows="3" value={w.story||''} onChange={e=>patch(p.id,'story',e.target.value)} placeholder="Why this object exists, where the visual comes from, and what it supports."/></label>
     <label><span>SUPPORT LABEL</span><input value={w.support_label||''} onChange={e=>patch(p.id,'support_label',e.target.value)} placeholder="ARTIST SUPPORT"/></label>
     <label className="storefrontToggle"><input type="checkbox" checked={w.show_support!==false} onChange={e=>patch(p.id,'show_support',e.target.checked)}/><span>SHOW SUPPORT MESSAGE</span></label>
    </div>
    <footer><button className="saveButton" disabled={busy===p.id} onClick={()=>save(p)}>{busy===p.id?'SAVING…':'SAVE WWYS'}</button></footer>
   </article>})}
   {!merch.length&&<div className="adminPanel emptyNote">Create merch products to curate WWYS.</div>}
  </div>
 </section>
}