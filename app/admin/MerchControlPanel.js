'use client';
import {useEffect,useMemo,useState} from 'react';
import {supabase} from '../lib/supabase';

const STOREFRONT_DEFAULTS={
 card:{image_fit:'contain',image_position:'center',wishlist:true,quick_add:true,density:'regular',metadata:true,price_mode:'standard',cta:'auto'},
 badge:{mode:'auto',text:'',tone:'neutral'},
 hover:{format:'none',animation:'subtle',scale:1,direction:'right',mobile:false},
 visibility:{store:true,homepage:true,wear:true,collections:true,search:true,archive:true,related:true,google:true,meta:true,pinterest:true,microsoft:true,tiktok:true},
 detail:{default_variant:'auto',default_side:'front',gallery_layout:'grid',related:true,sticky_buy:true}
};
const SEO_DEFAULTS={title:'',description:'',canonical:'',og_image:'',structured_data:true,brand:'SIDE:II',gtin:'',mpn:'',google_category:'',condition:'new'};
const COMMERCE_DEFAULTS={waitlist:true,back_in_stock:true,min_qty:1,max_qty:null,bundle_eligible:true,discount_eligible:true,free_shipping_eligible:true,store_credit_eligible:true};

const merge=(base,value={})=>Object.fromEntries(Object.entries(base).map(([k,v])=>[k,typeof v==='object'&&!Array.isArray(v)?{...v,...(value?.[k]||{})}:value?.[k]??v]));

export default function MerchControlPanel({product,onSaved}){
 const [tab,setTab]=useState('storefront');
 const [storefront,setStorefront]=useState(()=>merge(STOREFRONT_DEFAULTS,product.storefront_config||{}));
 const [seo,setSeo]=useState(()=>({...SEO_DEFAULTS,...(product.seo_config||{})}));
 const [commerce,setCommerce]=useState(()=>({...COMMERCE_DEFAULTS,...(product.commerce_config||{})}));
 const [variants,setVariants]=useState(()=>Array.isArray(product.product_variants)?product.product_variants.map(v=>({...v})):[]);
 const [busy,setBusy]=useState(false),[msg,setMsg]=useState(''),[dirty,setDirty]=useState(false);
 const setStore=(section,key,value)=>{setDirty(true);setStorefront(p=>({...p,[section]:{...p[section],[key]:value}}))};
 const setSeoValue=(key,value)=>{setDirty(true);setSeo(p=>({...p,[key]:value}))};
 const setCommerceValue=(key,value)=>{setDirty(true);setCommerce(p=>({...p,[key]:value}))};
 const updateVariant=(id,key,value)=>{setDirty(true);setVariants(p=>p.map(v=>v.id===id?{...v,[key]:value}:v))};
 const primary=useMemo(()=>variants[0]||null,[variants]);
 const hasImage=Boolean(product.artwork_path||(Array.isArray(product.gallery_images)&&product.gallery_images.length));
 const feedBlockers=[
  storefront.visibility.google===false?'GOOGLE CHANNEL IS OFF':null,
  storefront.visibility.store===false?'STORE VISIBILITY IS OFF':null,
  !String(product.title||'').trim()?'TITLE IS MISSING':null,
  !hasImage?'PRODUCT / MOCKUP IMAGE IS MISSING':null,
  !variants.some(v=>v.price!=null&&Number(v.price)>=0)?'NO PRICED VARIANT':null,
  product.status!=='active'&&!variants.some(v=>v.preorder_enabled)?'PRODUCT IS NOT ACTIVE OR PRE-ORDERABLE':null
 ].filter(Boolean);
 const feedWarnings=[
  !(seo.gtin||seo.mpn)?'NO GTIN / MPN — IDENTIFIER_EXISTS=NO':null,
  !seo.google_category?'GOOGLE PRODUCT CATEGORY NOT SET':null
 ].filter(Boolean);
 useEffect(()=>{const before=e=>{if(!dirty)return;e.preventDefault();e.returnValue=''};window.addEventListener('beforeunload',before);return()=>window.removeEventListener('beforeunload',before)},[dirty]);

 async function save(){
  setBusy(true);setMsg('');
  try{
   const {error:pErr}=await supabase.from('products').update({
    storefront_config:storefront,
    seo_config:seo,
    commerce_config:commerce,
    hover_media_format:storefront.hover?.format||'none'
   }).eq('id',product.id);
   if(pErr)throw pErr;
   for(const v of variants){
    const payload={
     shipping_class:v.shipping_class||null,
     weight_g:v.weight_g===''||v.weight_g==null?null:Math.max(0,parseInt(v.weight_g,10)||0),
     low_stock_threshold:Math.max(0,parseInt(v.low_stock_threshold||0,10)||0),
     preorder_enabled:!!v.preorder_enabled,
     preorder_limit:v.preorder_limit===''||v.preorder_limit==null?null:Math.max(1,parseInt(v.preorder_limit,10)||1),
     preorder_target:v.preorder_target===''||v.preorder_target==null?null:Math.max(1,parseInt(v.preorder_target,10)||1),
     preorder_deadline:v.preorder_deadline||null,
     edition_numbering_enabled:!!v.edition_numbering_enabled,
     edition_total:v.edition_total===''||v.edition_total==null?null:Math.max(1,parseInt(v.edition_total,10)||1)
    };
    const {error}=await supabase.from('product_variants').update(payload).eq('id',v.id);
    if(error)throw error;
   }
   setDirty(false);setMsg('Control Room settings saved.');
   if(onSaved)await onSaved();
  }catch(e){setMsg(e?.message||'Save failed.')}finally{setBusy(false)}
 }

 return <section className="merchControlPanel">
  <div className="mockupHead"><div><span>CONTROL ROOM / MERCH</span><p>Storefront, commerce and feed behaviour for this product.</p></div><b>{primary?.sku||product.catalogue_no}</b></div>
  <nav className="editTabs merchControlTabs">{[['storefront','STOREFRONT'],['commerce','COMMERCE'],['seo','SEO / FEEDS']].map(([v,l])=><button type="button" key={v} className={tab===v?'active':''} onClick={()=>setTab(v)}>{l}</button>)}</nav>

  {tab==='storefront'&&<div className="storefrontEditor">
   <section className="storefrontBlock"><header><span>CARD / PRESENTATION</span><p>Control store card density, artwork and primary interactions.</p></header><div className="storefrontGrid">
    <label>IMAGE FIT<select value={storefront.card.image_fit} onChange={e=>setStore('card','image_fit',e.target.value)}><option value="contain">CONTAIN</option><option value="cover">COVER</option></select></label>
    <label>IMAGE POSITION<select value={storefront.card.image_position} onChange={e=>setStore('card','image_position',e.target.value)}><option value="center">CENTER</option><option value="top">TOP</option><option value="bottom">BOTTOM</option></select></label>
    <label>CARD DENSITY<select value={storefront.card.density} onChange={e=>setStore('card','density',e.target.value)}><option value="regular">REGULAR</option><option value="compact">COMPACT</option></select></label>
    <label>CTA<select value={storefront.card.cta} onChange={e=>setStore('card','cta',e.target.value)}><option value="auto">AUTO</option><option value="add">ADD TO BAG</option><option value="options">SELECT OPTIONS</option><option value="view">VIEW PRODUCT</option></select></label>
    <label>DEFAULT SIDE<select value={storefront.detail.default_side} onChange={e=>setStore('detail','default_side',e.target.value)}><option value="front">FRONT</option><option value="back">BACK</option></select></label>
    <label className="storefrontToggle"><input type="checkbox" checked={storefront.card.wishlist!==false} onChange={e=>setStore('card','wishlist',e.target.checked)}/><span>SHOW WISHLIST</span></label>
    <label className="storefrontToggle"><input type="checkbox" checked={storefront.card.quick_add!==false} onChange={e=>setStore('card','quick_add',e.target.checked)}/><span>ALLOW QUICK ADD</span></label>
    <label className="storefrontToggle"><input type="checkbox" checked={storefront.card.metadata!==false} onChange={e=>setStore('card','metadata',e.target.checked)}/><span>SHOW METADATA</span></label>
   </div></section>

   <section className="storefrontBlock"><header><span>BADGE / VISIBILITY</span><p>Choose manual badges and where the merch object may appear.</p></header><div className="storefrontGrid">
    <label>BADGE MODE<select value={storefront.badge.mode} onChange={e=>setStore('badge','mode',e.target.value)}><option value="auto">AUTO</option><option value="manual">MANUAL</option><option value="none">NONE</option></select></label>
    <label>BADGE TONE<select value={storefront.badge.tone} onChange={e=>setStore('badge','tone',e.target.value)}><option value="neutral">NEUTRAL</option><option value="warm">WARM</option><option value="alert">ALERT</option><option value="muted">MUTED</option></select></label>
    <label className="storefrontWide">MANUAL BADGE<input maxLength="28" value={storefront.badge.text||''} onChange={e=>setStore('badge','text',e.target.value)} placeholder="DROP / EXCLUSIVE / RESTOCKED"/></label>
   </div><div className="storefrontToggleGrid">
    {Object.entries({store:'STORE',homepage:'HOMEPAGE',wear:'WEAR',collections:'COLLECTIONS',search:'SEARCH',archive:'ARCHIVE',related:'RELATED'}).map(([k,l])=><label className="storefrontToggle" key={k}><input type="checkbox" checked={storefront.visibility[k]!==false} onChange={e=>setStore('visibility',k,e.target.checked)}/><span>{l}</span></label>)}
   </div></section>
  </div>}

  {tab==='commerce'&&<div className="storefrontEditor commerceEditor">
   <section className="storefrontBlock"><header><span>PRODUCT COMMERCE</span><p>Quantity, promotion and restock rules shared across all merch variants.</p></header><div className="storefrontGrid">
    <label>MIN QTY<input type="number" min="1" value={commerce.min_qty??1} onChange={e=>setCommerceValue('min_qty',Math.max(1,parseInt(e.target.value||'1',10)||1))}/></label>
    <label>MAX QTY<input type="number" min="1" value={commerce.max_qty??''} onChange={e=>setCommerceValue('max_qty',e.target.value===''?null:Math.max(1,parseInt(e.target.value,10)||1))} placeholder="NO LIMIT"/></label>
    <label className="storefrontToggle"><input type="checkbox" checked={commerce.waitlist!==false} onChange={e=>setCommerceValue('waitlist',e.target.checked)}/><span>WAITLIST</span></label>
    <label className="storefrontToggle"><input type="checkbox" checked={commerce.back_in_stock!==false} onChange={e=>setCommerceValue('back_in_stock',e.target.checked)}/><span>BACK-IN-STOCK EMAIL</span></label>
    <label className="storefrontToggle"><input type="checkbox" checked={commerce.bundle_eligible!==false} onChange={e=>setCommerceValue('bundle_eligible',e.target.checked)}/><span>BUNDLE ELIGIBLE</span></label>
    <label className="storefrontToggle"><input type="checkbox" checked={commerce.discount_eligible!==false} onChange={e=>setCommerceValue('discount_eligible',e.target.checked)}/><span>DISCOUNT ELIGIBLE</span></label>
    <label className="storefrontToggle"><input type="checkbox" checked={commerce.free_shipping_eligible!==false} onChange={e=>setCommerceValue('free_shipping_eligible',e.target.checked)}/><span>FREE SHIPPING ELIGIBLE</span></label>
    <label className="storefrontToggle"><input type="checkbox" checked={commerce.store_credit_eligible!==false} onChange={e=>setCommerceValue('store_credit_eligible',e.target.checked)}/><span>STORE CREDIT ELIGIBLE</span></label>
   </div></section>
   <section className="storefrontBlock"><header><span>VARIANT COMMERCE</span><p>Pre-order and edition rules remain attached to each sellable size / colour variant.</p></header><div className="commerceVariantList">
    {variants.map(v=><article className="commerceVariantCard" key={v.id}><header><b>{[v.option_size,v.option_color].filter(Boolean).join(' · ')||v.sku}</b><small>{v.sku}</small></header><div className="storefrontGrid">
     <label>SHIPPING CLASS<input value={v.shipping_class||''} onChange={e=>updateVariant(v.id,'shipping_class',e.target.value)} placeholder="standard"/></label>
     <label>WEIGHT / G<input type="number" min="0" value={v.weight_g??''} onChange={e=>updateVariant(v.id,'weight_g',e.target.value)}/></label>
     <label>LOW STOCK AT<input type="number" min="0" value={v.low_stock_threshold??0} onChange={e=>updateVariant(v.id,'low_stock_threshold',e.target.value)}/></label>
     <label className="storefrontToggle"><input type="checkbox" checked={!!v.preorder_enabled} onChange={e=>updateVariant(v.id,'preorder_enabled',e.target.checked)}/><span>PRE-ORDER</span></label>
     <label>PRE-ORDER LIMIT<input type="number" min="1" value={v.preorder_limit??''} onChange={e=>updateVariant(v.id,'preorder_limit',e.target.value)} placeholder="NO LIMIT"/></label>
     <label>PRODUCTION TARGET<input type="number" min="1" value={v.preorder_target??''} onChange={e=>updateVariant(v.id,'preorder_target',e.target.value)} placeholder="OPTIONAL"/></label>
     <label>DEADLINE<input type="date" value={v.preorder_deadline||''} onChange={e=>updateVariant(v.id,'preorder_deadline',e.target.value)}/></label>
     <label className="storefrontToggle"><input type="checkbox" checked={!!v.edition_numbering_enabled} onChange={e=>updateVariant(v.id,'edition_numbering_enabled',e.target.checked)}/><span>NUMBERED EDITION</span></label>
     <label>EDITION TOTAL<input type="number" min="1" value={v.edition_total??''} onChange={e=>updateVariant(v.id,'edition_total',e.target.value)} placeholder="OPTIONAL"/></label>
    </div></article>)}
   </div></section>
  </div>}

  {tab==='seo'&&<div className="storefrontEditor seoEditor">
   <section className="storefrontBlock feedReadiness"><header><span>GOOGLE FEED READINESS</span><p>Live eligibility check against the generated Merchant Center feed.</p></header><div className="feedReadinessBody"><div className={"feedReadinessState "+(feedBlockers.length?'blocked':'ready')}><b>{feedBlockers.length?'NOT READY':'READY FOR FEED'}</b><span>{feedBlockers.length?feedBlockers.length+' blocking issue(s)':'Variant data can be exported.'}</span></div>{feedBlockers.map(x=><p className="feedIssue blocker" key={x}>{x}</p>)}{feedWarnings.map(x=><p className="feedIssue warning" key={x}>{x}</p>)}<a href="/feeds/google.xml" target="_blank" rel="noreferrer">OPEN GOOGLE XML FEED ↗</a></div></section>
   <section className="storefrontBlock"><header><span>SEO / SEARCH</span><p>Metadata and shopping identifiers for this merch product.</p></header><div className="storefrontGrid">
    <label className="storefrontWide">SEO TITLE<input maxLength="70" value={seo.title||''} onChange={e=>setSeoValue('title',e.target.value)} placeholder={product.title}/></label>
    <label className="storefrontWide">META DESCRIPTION<textarea rows="3" value={seo.description||''} onChange={e=>setSeoValue('description',e.target.value)} placeholder={product.description||''}/></label>
    <label className="storefrontWide">CANONICAL URL<input value={seo.canonical||''} onChange={e=>setSeoValue('canonical',e.target.value)}/></label>
    <label className="storefrontWide">OG IMAGE URL<input value={seo.og_image||''} onChange={e=>setSeoValue('og_image',e.target.value)}/></label>
    <label>BRAND<input value={seo.brand||''} onChange={e=>setSeoValue('brand',e.target.value)}/></label>
    <label>GTIN / EAN<input value={seo.gtin||''} onChange={e=>setSeoValue('gtin',e.target.value)}/></label>
    <label>MPN<input value={seo.mpn||''} onChange={e=>setSeoValue('mpn',e.target.value)}/></label>
    <label>CONDITION<select value={seo.condition||'new'} onChange={e=>setSeoValue('condition',e.target.value)}><option value="new">NEW</option><option value="used">USED</option><option value="refurbished">REFURBISHED</option></select></label>
    <label className="storefrontWide">GOOGLE PRODUCT CATEGORY<input value={seo.google_category||''} onChange={e=>setSeoValue('google_category',e.target.value)}/></label>
    <label className="storefrontToggle"><input type="checkbox" checked={seo.structured_data!==false} onChange={e=>setSeoValue('structured_data',e.target.checked)}/><span>PRODUCT SCHEMA</span></label>
   </div><div className="storefrontToggleGrid">
    {Object.entries({google:'GOOGLE SHOPPING',meta:'META',pinterest:'PINTEREST',microsoft:'MICROSOFT',tiktok:'TIKTOK'}).map(([k,l])=><label className="storefrontToggle" key={k}><input type="checkbox" checked={storefront.visibility[k]!==false} onChange={e=>setStore('visibility',k,e.target.checked)}/><span>{l}</span></label>)}
   </div></section>
  </div>}

  {dirty&&<p className="unsavedFlag merchUnsavedFlag">UNSAVED CHANGES</p>}{msg&&<p className="workspaceMessage">{msg}</p>}
  <div className="formActions merchControlActions"><button type="button" className="saveButton" disabled={busy} onClick={save}>{busy?'SAVING…':'SAVE CONTROL SETTINGS →'}</button></div>
 </section>;
}
