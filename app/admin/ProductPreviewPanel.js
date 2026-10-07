'use client';
import {useEffect,useMemo,useState} from 'react';
import {supabase} from '../lib/supabase';
import MerchMockupPreview from '../components/MerchMockupPreview';

const MODES=[
 ['editorial','EDITORIAL'],
 ['classic','CLASSIC'],
 ['mobile','MOBILE'],
 ['detail','PRODUCT DETAIL'],
 ['google','GOOGLE SHOPPING'],
 ['meta','META']
];

function publicArtwork(product){
 if(!product?.artwork_path||!supabase)return null;
 return supabase.storage.from('release-artwork').getPublicUrl(product.artwork_path).data.publicUrl;
}
function firstGallery(product){
 const raw=Array.isArray(product?.gallery_images)?product.gallery_images:[];
 return raw.map(x=>typeof x==='string'?x:(x?.url||x?.preview_url||x?.previewUrl)).find(Boolean)||null;
}
function priceText(product){
 const variants=product?.product_variants||[];
 const prices=variants.map(v=>Number(v.price)).filter(Number.isFinite);
 if(!prices.length)return 'PRICE NOT SET';
 const currency=variants.find(v=>Number.isFinite(Number(v.price)))?.currency||'TRY';
 const min=Math.min(...prices),max=Math.max(...prices);
 const fmt=n=>{try{return new Intl.NumberFormat('tr-TR',{style:'currency',currency,maximumFractionDigits:2}).format(n)}catch{return n+' '+currency}};
 return min===max?fmt(min):'FROM '+fmt(min);
}
function stockText(product){
 const variants=product?.product_variants||[];
 if(variants.some(v=>v.format==='digital'))return 'DIGITAL / AVAILABLE';
 const available=variants.reduce((sum,v)=>sum+Math.max(0,Number(v.stock_qty||0)-Number(v.reserved_qty||0)),0);
 const preorder=variants.some(v=>v.preorder_enabled);
 return available>0?available+' IN STOCK':preorder?'PRE-ORDER':'SOLD OUT';
}
function productImage(product){
 return publicArtwork(product)||firstGallery(product);
}
function isMerch(product){return product?.product_type==='merch'}
function mockupProduct(p){
 const items=Array.isArray(p?.gallery_images)?p.gallery_images:[];
 const front=items.find(x=>x?.mockup?.side==='front')?.mockup||null;
 const back=items.find(x=>x?.mockup?.side==='back')?.mockup||null;
 return {...p,merchCategory:p?.merch_category,mockups:{front,back}};
}
function seoFor(product){
 const seo=product?.seo_config||{};
 const title=seo.title||[product?.title,product?.artist_project].filter(Boolean).join(' — ')||'SIDE:II';
 const description=seo.description||product?.description||'Independent physical and digital editions from SIDE:II.';
 return {title,description};
}
function CardImage({product,className='',style=null}) {
 if(isMerch(product)){
  const mp=mockupProduct(product);
  if(mp.mockups.front||mp.mockups.back)return <div className={'previewMerchMock '+className}><MerchMockupPreview product={mp} displayMode="thumb" raster/></div>;
 }
 const src=productImage(product);
 return src?<img className={className} src={src} alt="" style={style||undefined}/>:<div className={'previewMissing '+className}>NO IMAGE</div>;
}

export default function ProductPreviewPanel({products=[],preferredProductId=null}){
 const [selectedId,setSelectedId]=useState(preferredProductId||products[0]?.id||'');
 const [mode,setMode]=useState('editorial');
 const [zoom,setZoom]=useState('fit');

 useEffect(()=>{
  if(preferredProductId&&products.some(p=>p.id===preferredProductId))setSelectedId(preferredProductId);
  else if(!products.some(p=>p.id===selectedId)&&products[0])setSelectedId(products[0].id);
 },[preferredProductId,products,selectedId]);

 const product=useMemo(()=>products.find(p=>p.id===selectedId)||products[0]||null,[products,selectedId]);
 if(!product)return <section className="adminSection adminViewSection"><div className="sectionLabel"><span>03 / PRODUCT PREVIEW</span><p>Create a product first to use preview.</p></div><div className="adminPanel emptyNote">No products available.</div></section>;

 const cfg=product.storefront_config||{},card=cfg.card||{},visibility=cfg.visibility||{},seo=seoFor(product);
 const variants=product.product_variants||[];
 const primary=variants.find(v=>v.format==='digital'||Number(v.stock_qty||0)>0||v.preorder_enabled)||variants[0]||{};
 const cta=(mode==='classic'?(card.classic_cta&&card.classic_cta!=='inherit'?card.classic_cta:card.cta):(card.editorial_cta&&card.editorial_cta!=='inherit'?card.editorial_cta:card.cta))||'VIEW';
 const imageFit=card.image_fit||'contain';
 const imagePosition=card.image_position==='custom'?((card.crop_x??50)+'% '+(card.crop_y??50)+'%'):(card.image_position||'center');
 const imageStyle={objectFit:imageFit,objectPosition:imagePosition};
 const previewPrice=card.price_mode==='hidden'?'':card.price_mode==='from'&&!priceText(product).startsWith('FROM ')?'FROM '+priceText(product):priceText(product);
 const rawStock=stockText(product);
 const previewStock=card.stock===false||card.stock_mode==='hidden'?'':card.stock_mode==='status'?(rawStock.includes('PRE-ORDER')?'PRE-ORDER':rawStock.includes('SOLD OUT')?'SOLD OUT':rawStock.includes('DIGITAL')?'DIGITAL':'IN STOCK'):rawStock;
 const feedBlockers=[
  visibility.google===false?'GOOGLE CHANNEL OFF':null,
  visibility.store===false?'STORE VISIBILITY OFF':null,
  !String(product.title||'').trim()?'TITLE MISSING':null,
  !productImage(product)&&!(isMerch(product)&&Object.values(mockupProduct(product).mockups||{}).some(Boolean))?'PRIMARY IMAGE MISSING':null,
  !variants.some(v=>Number.isFinite(Number(v.price)))?'PRICE MISSING':null,
  product.status!=='active'&&!variants.some(v=>v.preorder_enabled)?'NOT ACTIVE / PRE-ORDERABLE':null
 ].filter(Boolean);
 const feedWarnings=[!(product.seo_config?.gtin||product.barcode||product.seo_config?.mpn)?'IDENTIFIER MISSING':null,!product.seo_config?.google_category?'GOOGLE CATEGORY MISSING':null].filter(Boolean);

 return <section className="adminSection adminViewSection previewSystem">
  <div className="sectionLabel"><span>03 / PRODUCT PREVIEW SYSTEM</span><p>Inspect storefront and feed output before publishing.</p></div>
  <div className="previewToolbar adminPanel">
   <label><span>PRODUCT</span><select value={product.id} onChange={e=>setSelectedId(e.target.value)}>{products.map(p=><option key={p.id} value={p.id}>{p.catalogue_no||'NO CAT'} · {p.title}</option>)}</select></label>
   <div className="previewModeTabs">{MODES.map(([id,label])=><button key={id} type="button" className={mode===id?'active':''} onClick={()=>setMode(id)}>{label}</button>)}</div>
   <div className="previewZoom"><button className={zoom==='fit'?'active':''} onClick={()=>setZoom('fit')}>FIT</button><button className={zoom==='100'?'active':''} onClick={()=>setZoom('100')}>100%</button></div>
  </div>

  <div className="previewLayout">
   <aside className="previewInspector adminPanel">
    <div><span>STATUS</span><b>{String(product.status||'draft').toUpperCase()}</b></div>
    <div><span>STORE</span><b>{visibility.store===false?'HIDDEN':'VISIBLE'}</b></div>
    <div><span>SEARCH</span><b>{visibility.search===false?'HIDDEN':'VISIBLE'}</b></div>
    <div><span>GOOGLE</span><b>{visibility.google===false?'OFF':feedBlockers.length?'BLOCKED':'READY'}</b></div><div><span>META</span><b>{visibility.meta===false?'OFF':'ON'}</b></div>
    <div><span>PRICE</span><b>{previewPrice||'PRICE HIDDEN'}</b></div>
    <div><span>STOCK</span><b>{previewStock||'STOCK HIDDEN'}</b></div>
    <div><span>IMAGE FIT</span><b>{String(imageFit).toUpperCase()}</b></div>
    <div><span>CTA</span><b>{String(cta).toUpperCase()}</b></div>
    <div className="previewSeoReadout"><span>SEO TITLE</span><b>{seo.title}</b><small>{seo.description}</small></div><div className="previewSeoReadout"><span>FEED CHECK</span><b>{feedBlockers.length?feedBlockers.join(' · '):'READY'}</b>{feedWarnings.length>0&&<small>{feedWarnings.join(' · ')}</small>}</div>
   </aside>

   <div className={'previewStage adminPanel preview-'+mode+' zoom-'+zoom}>
    <div className="previewStageTop"><span>LIVE COMPONENT PREVIEW</span><b>{MODES.find(x=>x[0]===mode)?.[1]}</b></div>

    {mode==='editorial'&&<div className="previewEditorialCard">
      <div className="previewEditorialMedia"><CardImage product={product} className="previewObjectImage" style={imageStyle}/><span>{product.catalogue_no||'SIDE:II'}</span></div>
      <div className="previewEditorialCopy"><small>{product.imprint==='lethargia'?'LETHARGIA':'SIDE:II'} / {product.merch_category||primary.format||'EDITION'}</small><h2>{product.title}</h2><p>{product.artist_project||product.description||'Independent edition.'}</p><div><b>{previewPrice||'PRICE HIDDEN'}</b><span>{previewStock||'STOCK HIDDEN'}</span></div><button>{String(cta).replaceAll('_',' ').toUpperCase()}</button></div>
    </div>}

    {mode==='classic'&&<div className="previewClassicWrap"><article className={'previewClassicCard title-'+(card.title_scale||'regular')}>
      <div className="previewClassicMedia"><CardImage product={product} className="previewObjectImage" style={imageStyle}/>{cfg.badge?.mode!=='none'&&<span className="previewBadge">{cfg.badge?.mode==='manual'?(cfg.badge.text||'BADGE'):(product.status==='forthcoming'?'COMING SOON':Number(primary.stock_qty||0)<=0?(primary.preorder_enabled?'PRE-ORDER':'SOLD OUT'):'NEW')}</span>}</div>
      <div className="previewClassicText"><small>{product.catalogue_no||product.original_catalogue_no||'SIDE:II'}</small><h3>{product.title}</h3><p>{product.artist_project||product.merch_category||product.imprint}</p><div><b>{previewPrice||'PRICE HIDDEN'}</b><span>{previewStock||'STOCK HIDDEN'}</span></div><button>{String(cta).replaceAll('_',' ').toUpperCase()}</button></div>
    </article></div>}

    {mode==='mobile'&&<div className="previewPhone"><div className="previewPhoneBar"><b>SIDE:II</b><span>BAG · 0</span></div><CardImage product={product} className="previewPhoneImage" style={imageStyle}/><div className="previewPhoneCopy"><small>{product.catalogue_no||'SIDE:II'} / {product.imprint||'SIDE:II'}</small><h2>{product.title}</h2><p>{product.artist_project||product.description||'Independent edition.'}</p><b>{previewPrice||'PRICE HIDDEN'}</b><span>{previewStock||'STOCK HIDDEN'}</span><button>{String(cta).replaceAll('_',' ').toUpperCase()}</button></div></div>}

    {mode==='detail'&&<div className="previewDetail">
      <div className="previewDetailMedia"><CardImage product={product} className="previewObjectImage" style={imageStyle}/></div>
      <div className="previewDetailCopy"><small>{product.catalogue_no||'SIDE:II'} / {product.imprint||'SIDE:II'}</small><h1>{product.title}</h1><h3>{product.artist_project||product.merch_category||'SIDE:II'}</h3><p>{product.description||'No product description yet.'}</p><div className="previewVariantList">{variants.length?variants.map(v=><div key={v.id||v.sku}><span>{v.edition_name||v.format||v.sku}</span><b>{Number(v.price||0)} {v.currency||'TRY'}</b></div>):<span>NO VARIANTS</span>}</div><button>{product.status==='forthcoming'?'COMING SOON':Number(primary.stock_qty||0)<=0?(primary.preorder_enabled?'PRE-ORDER':'SOLD OUT'):'ADD TO BAG'}</button></div>
    </div>}

    {mode==='google'&&<div className="previewFeedCard google"><div className="previewFeedImage"><CardImage product={product} className="previewObjectImage" style={imageStyle}/></div><div><small>Sponsored · SIDE:II</small><h3>{seo.title}</h3><b>{previewPrice||'PRICE HIDDEN'}</b><p>{previewStock||'STOCK HIDDEN'} · {primary.sku||product.catalogue_no||'SKU PENDING'}</p><span>{feedBlockers.length?'BLOCKED · '+feedBlockers.join(' · '):feedWarnings.length?'READY WITH WARNINGS · '+feedWarnings.join(' · '):'READY FOR GOOGLE FEED'}</span></div></div>}

    {mode==='meta'&&<div className="previewMetaPost"><div className="previewMetaHead"><b>SIDE:II</b><span>Sponsored</span></div><CardImage product={product} className="previewMetaImage" style={imageStyle}/><div className="previewMetaCopy"><small>{visibility.meta===false?'META CHANNEL OFF':'SIDEII.COM'}</small><h3>{seo.title}</h3><p>{seo.description}</p><div><b>{previewPrice||'PRICE HIDDEN'}</b><button>SHOP NOW</button></div></div></div>}
   </div>
  </div>
  <div className="previewFootnote">Preview uses current draft product data. Nothing is published or made public from this screen.</div>
 </section>;
}
