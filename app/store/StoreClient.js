'use client';
import GlobalHeader from '../components/GlobalHeader';
import Link from 'next/link';
import {useEffect,useMemo,useState} from 'react';
import {supabase} from '../lib/supabase';
import {addCartItem} from '../lib/cart';
import {readWishlist,writeWishlist,wishlistItemFromProduct} from '../lib/wishlist';
import {useLocaleCurrency} from '../components/LocaleCurrencyProvider';
import MerchMockupPreview from '../components/MerchMockupPreview';

export default function StoreClient({releases}){
 const {money:fmt,t}=useLocaleCurrency();
 const [filter,setFilter]=useState('all'),[formatFilter,setFormatFilter]=useState('all');
 const [search,setSearch]=useState(''),[availability,setAvailability]=useState('all'),[collectionFilter,setCollectionFilter]=useState('all'),[sortMode,setSortMode]=useState('newest');
 const [limitedOnly,setLimitedOnly]=useState(false),[preorderOnly,setPreorderOnly]=useState(false),[minPrice,setMinPrice]=useState(''),[maxPrice,setMaxPrice]=useState('');
 const [filtersReady,setFiltersReady]=useState(false);
 const [viewMode,setViewMode]=useState('editorial');
 const [wishlist,setWishlist]=useState([]),[wishlistUser,setWishlistUser]=useState(null);
 const [waitlistVariant,setWaitlistVariant]=useState(null),[waitlistEmail,setWaitlistEmail]=useState(''),[waitlistMessage,setWaitlistMessage]=useState(''),[waitlistBusy,setWaitlistBusy]=useState(false);

 useEffect(()=>{
  const savedView=window.localStorage.getItem('sideii-store-view');
  if(savedView==='classic'||savedView==='editorial')setViewMode(savedView);
  const q=new URLSearchParams(window.location.search);
  const imprint=q.get('imprint');
  if(['sideii','lethargia','selected'].includes(imprint))setFilter(imprint);
  const media=q.get('media');
  if(['merch','vinyl','cd','cassette','digital'].includes(media))setFormatFilter(media);
  setSearch(q.get('q')||'');
  if(['in-stock','preorder','sold-out'].includes(q.get('availability')))setAvailability(q.get('availability'));
  setCollectionFilter(q.get('collection')||'all');
  setLimitedOnly(q.get('limited')==='1');setPreorderOnly(q.get('preorder')==='1');
  setMinPrice(q.get('min')||'');setMaxPrice(q.get('max')||'');
  if(['newest','price-asc','price-desc','title'].includes(q.get('sort')))setSortMode(q.get('sort'));
  if(q.get('checkout')==='1'){
   window.dispatchEvent(new Event('sideii-open-bag'));
   q.delete('checkout');window.history.replaceState({},'',window.location.pathname+(q.toString()?'?'+q.toString():''));
  }
  setFiltersReady(true);
 },[]);

 useEffect(()=>{
  if(typeof window!=='undefined')window.localStorage.setItem('sideii-store-view',viewMode);
 },[viewMode]);

 useEffect(()=>{
  if(!filtersReady)return;
  const q=new URLSearchParams(window.location.search);
  const setOrDelete=(k,v,empty='all')=>{if(v&&v!==empty)q.set(k,String(v));else q.delete(k)};
  setOrDelete('imprint',filter);setOrDelete('media',formatFilter);setOrDelete('q',search,'');
  setOrDelete('availability',availability);setOrDelete('collection',collectionFilter);
  limitedOnly?q.set('limited','1'):q.delete('limited');preorderOnly?q.set('preorder','1'):q.delete('preorder');
  setOrDelete('min',minPrice,'');setOrDelete('max',maxPrice,'');setOrDelete('sort',sortMode,'newest');
  const next=window.location.pathname+(q.toString()?'?'+q.toString():'');
  window.history.replaceState({},'',next);
 },[filtersReady,filter,formatFilter,search,availability,collectionFilter,limitedOnly,preorderOnly,minPrice,maxPrice,sortMode]);

 useEffect(()=>{
  let live=true;
  const load=async()=>{
   const local=readWishlist();
   setWishlist(local);
   if(!supabase)return;
   const {data:s}=await supabase.auth.getSession();
   if(!live)return;
   const user=s.session?.user||null;setWishlistUser(user);
   if(!user)return;
   const {data:remote}=await supabase.from('customer_wishlist').select('product_slug,title,catalogue,cover,is_merch').eq('user_id',user.id);
   if(!live)return;
   const merged=[...(remote||[])];
   for(const item of local)if(!merged.some(x=>x.product_slug===item.product_slug))merged.push(item);
   setWishlist(merged);writeWishlist(merged);
   if(local.length)await supabase.from('customer_wishlist').upsert(local.map(x=>({...x,user_id:user.id})),{onConflict:'user_id,product_slug'});
  };
  load();
  const {data:sub}=supabase?.auth.onAuthStateChange((_e,s)=>{const u=s?.user||null;setWishlistUser(u);if(u)load()})||{data:{subscription:{unsubscribe(){}}}};
  const sync=e=>setWishlist(e.detail||readWishlist());
  window.addEventListener('sideii-wishlist',sync);
  return()=>{live=false;sub.subscription.unsubscribe();window.removeEventListener('sideii-wishlist',sync)};
 },[]);

 async function toggleWishlist(product){
  const item=wishlistItemFromProduct(product);
  const exists=wishlist.some(x=>x.product_slug===item.product_slug);
  const next=exists?wishlist.filter(x=>x.product_slug!==item.product_slug):[...wishlist,item];
  setWishlist(next);writeWishlist(next);
  if(supabase&&wishlistUser){
   if(exists)await supabase.from('customer_wishlist').delete().eq('user_id',wishlistUser.id).eq('product_slug',item.product_slug);
   else await supabase.from('customer_wishlist').upsert({...item,user_id:wishlistUser.id},{onConflict:'user_id,product_slug'});
  }
 }

 async function joinWaitlist(v){
  const email=waitlistEmail.trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){setWaitlistMessage('Enter a valid email.');return}
  setWaitlistBusy(true);setWaitlistMessage('');
  const {error}=await supabase.rpc('join_stock_waitlist',{p_variant_id:v.id,p_email:email});
  setWaitlistBusy(false);
  if(error){setWaitlistMessage(error.message);return}
  setWaitlistMessage('You are on the restock list.');
 }

 const uniqueReleases=useMemo(()=>Array.from(new Map((releases||[]).map(r=>[r.slug||r.id||r.catalogue,r])).values()),[releases]);
 const collectionOptions=useMemo(()=>{
  const map=new Map();
  for(const r of uniqueReleases)for(const x of r.collections||[])if(x?.slug)map.set(x.slug,x.name||x.slug);
  return [...map.entries()].map(([slug,name])=>({slug,name})).sort((a,b)=>String(a.name).localeCompare(String(b.name)));
 },[uniqueReleases]);
 const filtered=useMemo(()=>uniqueReleases.filter(r=>{
  if(r.storefrontConfig?.visibility?.store===false)return false;
  if(filter!=='all'&&(filter==='selected'?r.productOrigin!=='distributed':r.imprint!==filter))return false;
  if(formatFilter!=='all'&&(formatFilter==='merch'?!r.isMerch:!r.variants.some(v=>v.format===formatFilter)))return false;
  const q=search.trim().toLowerCase();
  if(q){
   const hay=[r.rawTitle,r.title,r.artist,r.catalogue,r.originalCatalogue,r.imprint,r.merchCategory,...(r.variants||[]).flatMap(v=>[v.sku,v.format,v.formatLabel,v.size,v.color,v.style])].filter(Boolean).join(' ').toLowerCase();
   if(r.storefrontConfig?.visibility?.search===false)return false;
   if(!hay.includes(q))return false;
  }
  const variants=r.variants||[];
  const hasPreorder=r.status==='AVAILABLE'&&variants.some(v=>!!v.preorderEnabled);
  const hasAvailable=r.status==='AVAILABLE'&&variants.some(v=>v.format==='digital'||v.stock==null||Number(v.stock)>0);
  const soldOut=!hasAvailable&&!hasPreorder;
  if(availability==='in-stock'&&!hasAvailable)return false;
  if(availability==='preorder'&&!hasPreorder)return false;
  if(availability==='sold-out'&&!soldOut)return false;
  if(preorderOnly&&!hasPreorder)return false;
  if(limitedOnly&&!variants.some(v=>v.editionNumberingEnabled&&Number(v.editionTotal)>0))return false;
  if(collectionFilter!=='all'&&!(r.collections||[]).some(x=>x.slug===collectionFilter))return false;
  const min=minPrice===''?null:Number(minPrice),max=maxPrice===''?null:Number(maxPrice);
  if(min!==null||max!==null){
   const priceMatch=variants.some(v=>v.price!=null&&(min===null||Number(v.price)>=min)&&(max===null||Number(v.price)<=max));
   if(!priceMatch)return false;
  }
  return true;
 }),[uniqueReleases,filter,formatFilter,search,availability,collectionFilter,limitedOnly,preorderOnly,minPrice,maxPrice]);
 const sortedFiltered=useMemo(()=>{
  const rows=[...filtered];
  const firstPrice=r=>Math.min(...(r.variants||[]).map(v=>Number(v.price)).filter(Number.isFinite),Number.POSITIVE_INFINITY);
  if(sortMode==='price-asc')rows.sort((a,b)=>firstPrice(a)-firstPrice(b));
  else if(sortMode==='price-desc')rows.sort((a,b)=>firstPrice(b)-firstPrice(a));
  else if(sortMode==='title')rows.sort((a,b)=>String(a.rawTitle||a.title).localeCompare(String(b.rawTitle||b.title)));
  return rows;
 },[filtered,sortMode]);
 const resetDiscovery=()=>{setFilter('all');setFormatFilter('all');setSearch('');setAvailability('all');setCollectionFilter('all');setLimitedOnly(false);setPreorderOnly(false);setMinPrice('');setMaxPrice('');setSortMode('newest')};
 const add=(r,v)=>{addCartItem(r,v);window.dispatchEvent(new Event('sideii-open-bag'))};
 const productHref=r=>r.isMerch?('/store/'+r.slug):('/releases/'+r.slug);

 return <main className={"storePage "+(filter==="lethargia"?"storePageLethargia":"")}>
  <GlobalHeader/>
  <section className="storeHero shell"><span>STORE / CATALOGUE</span><h1>Available<br/><i>editions.</i></h1><p>Physical objects and digital masters from SIDE:II and its imprints.</p><div className="storeEditorialLinks"><Link className="storeWearEntry" href="/wear">{t('WEAR WHAT YOU SUPPORT')} →</Link><Link className="storeWearEntry" href="/collections">{t('COLLECTIONS')} →</Link><Link className="storeWearEntry" href="/bundles">{t('BUNDLES')} →</Link><Link className="storeWearEntry" href="/archive">{t('ARCHIVE')} →</Link></div></section>
  <section className="storeFilters shell"><div>{[['all','ALL'],['sideii','SIDE:II'],['lethargia','LETHARGIA'],['selected','SELECTED']].map(([v,l])=><button key={v} className={filter===v?'active':''} onClick={()=>setFilter(v)}>{l}</button>)}</div><div>{[['all','ALL MEDIA'],['merch','MERCH'],['vinyl','VINYL'],['cd','CD'],['cassette','CASSETTE'],['digital','DIGITAL']].map(([v,l])=><button key={v} className={formatFilter===v?'active':''} onClick={()=>setFormatFilter(v)}>{l}</button>)}</div><div className="storeViewToggle" role="group" aria-label="Store view"><span>VIEW</span><button type="button" className={viewMode==='editorial'?'active':''} aria-pressed={viewMode==='editorial'} onClick={()=>setViewMode('editorial')}>EDITORIAL</button><button type="button" className={viewMode==='classic'?'active':''} aria-pressed={viewMode==='classic'} onClick={()=>setViewMode('classic')}>CLASSIC</button></div></section>
  <section className="storeDiscoveryTools shell">
   <div className="storeSearchField"><span>SEARCH CATALOGUE</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Title, artist, catalogue, SKU…"/></div>
   <div className="storeDiscoveryControls">
    <label><span>AVAILABILITY</span><select value={availability} onChange={e=>setAvailability(e.target.value)}><option value="all">ALL</option><option value="in-stock">IN STOCK</option><option value="preorder">PRE-ORDER</option><option value="sold-out">SOLD OUT</option></select></label>
    <label><span>COLLECTION</span><select value={collectionFilter} onChange={e=>setCollectionFilter(e.target.value)}><option value="all">ALL COLLECTIONS</option>{collectionOptions.map(x=><option value={x.slug} key={x.slug}>{String(x.name).toUpperCase()}</option>)}</select></label>
    <label><span>MIN PRICE</span><input type="number" min="0" step="1" value={minPrice} onChange={e=>setMinPrice(e.target.value)} placeholder="0"/></label>
    <label><span>MAX PRICE</span><input type="number" min="0" step="1" value={maxPrice} onChange={e=>setMaxPrice(e.target.value)} placeholder="ANY"/></label>
    <label><span>SORT</span><select value={sortMode} onChange={e=>setSortMode(e.target.value)}><option value="newest">NEWEST</option><option value="price-asc">PRICE LOW → HIGH</option><option value="price-desc">PRICE HIGH → LOW</option><option value="title">TITLE A → Z</option></select></label>
    <label className={"storeDiscoveryToggle "+(preorderOnly?'active':'')}><input type="checkbox" checked={preorderOnly} onChange={e=>setPreorderOnly(e.target.checked)}/><span>PRE-ORDER ONLY</span></label>
    <label className={"storeDiscoveryToggle "+(limitedOnly?'active':'')}><input type="checkbox" checked={limitedOnly} onChange={e=>setLimitedOnly(e.target.checked)}/><span>LIMITED ONLY</span></label>
   </div>
   <div className="storeDiscoveryMeta"><span>{filtered.length} / {uniqueReleases.filter(r=>r.storefrontConfig?.visibility?.store!==false).length} OBJECTS</span><button type="button" onClick={resetDiscovery}>RESET DISCOVERY</button></div>
  </section>
  {filter==='lethargia'&&<section className="storeImprintContext shell"><div><small>A SIDE:II IMPRINT</small><img src="/brand/lethargia/lethargia-logo.png" alt="Lethargia Records"/></div><p>Independent editions developed under their own visual and physical logic.</p><Link href="/imprints/lethargia">OPEN IMPRINT ↗</Link></section>}
  <section className={"storeCatalogue shell "+(viewMode==='classic'?'classicMode':'editorialMode')}>
   {viewMode==='classic'?<div className="storeClassicGrid">{sortedFiltered.map((r,i)=>{const cfg=r.storefrontConfig||{},card=cfg.card||{},badgeCfg=cfg.badge||{};const variants=r.variants||[];const primary=variants.find(v=>v.format==='digital'||v.stock>0||v.preorderEnabled)||variants[0]||{};const soldOut=primary.format!=='digital'&&Number(primary.stock||0)<=0;const canPreorder=soldOut&&primary.preorderEnabled;const multi=variants.length>1;const unavailable=r.status!=='AVAILABLE'||(soldOut&&!canPreorder);const autoBadge=r.status!=='AVAILABLE'?'COMING SOON':canPreorder?'PRE-ORDER':soldOut?'SOLD OUT':primary.editionNumberingEnabled&&primary.editionTotal?'LIMITED':i<2?'NEW':null;const badge=badgeCfg.mode==='none'?null:badgeCfg.mode==='manual'?(badgeCfg.text||null):autoBadge;return <article className={"storeClassicCard "+(card.density==='compact'?"compact ":"")+(r.isMerch?"merch ":"")+(r.imprint==="lethargia"?"lethargia ":"")} key={r.slug}>
  <div className="storeClassicMedia">
   {badge&&<span className={"storeClassicBadge "+(badgeCfg.tone||'neutral')+" "+String(badge).toLowerCase().replaceAll(' ','-')}>{badge}</span>}
   {card.wishlist!==false&&<button type="button" className={"storeClassicWish "+(wishlist.some(x=>x.product_slug===r.slug)?"active":"")} aria-label="Toggle wishlist" onClick={()=>toggleWishlist(r)}>{wishlist.some(x=>x.product_slug===r.slug)?'♥':'♡'}</button>}
   <Link href={productHref(r)}>{r.isMerch&&(r.mockups?.front||r.mockups?.back)?<MerchMockupPreview product={r} raster displayMode="thumb"/>:r.cover?<img src={r.cover} alt={r.title} style={{objectFit:card.image_fit||'contain',objectPosition:card.image_position||'center'}}/>:<div className="storeClassicPlaceholder">{r.catalogue}</div>}</Link>
  </div>
  <div className="storeClassicMeta">
   {card.metadata!==false&&<small>{r.isMerch?String(r.merchCategory||'MERCH').toUpperCase():(r.imprint==='lethargia'?'LETHARGIA':'SIDE:II')} · {r.originalCatalogue||r.catalogue}</small>}
   <Link href={productHref(r)}><h3>{r.title}</h3></Link>
   <div className="storeClassicPrice"><strong>{primary.price!=null?fmt(primary.price):'—'}</strong>{primary.editionNumberingEnabled&&primary.editionTotal&&<span>{primary.editionTotal} EDITION</span>}</div>
   <div className="storeClassicAction">{card.cta==='view'||card.quick_add===false?<Link href={productHref(r)}>VIEW PRODUCT</Link>:card.cta==='options'||multi?<Link href={productHref(r)}>SELECT OPTIONS</Link>:r.status==='AVAILABLE'&&soldOut&&!canPreorder?<Link href={productHref(r)}>{r.commerceConfig?.waitlist===false?'VIEW PRODUCT':'WAITLIST / VIEW'}</Link>:<button type="button" disabled={unavailable} onClick={()=>add(r,primary)}>{r.status!=='AVAILABLE'?'COMING SOON':canPreorder?'PRE-ORDER':'ADD TO BAG'}</button>}</div>
  </div>
 </article>})}</div>:<div className="storeEditorialList">{sortedFiltered.map(r=>{const card=r.storefrontConfig?.card||{};return <article className={"storeProduct "+(r.isMerch?"merchProduct ":"")+(r.productOrigin==="distributed"?"selectedProduct ":"")+(r.imprint==="lethargia"?"lethargiaProduct":"")} key={r.slug}>
    {card.wishlist!==false&&<button type="button" className={"storeWishlistButton "+(wishlist.some(x=>x.product_slug===r.slug)?"active":"")} aria-label="Toggle wishlist" onClick={()=>toggleWishlist(r)}>{wishlist.some(x=>x.product_slug===r.slug)?'♥':'♡'}</button>}
    <Link href={r.isMerch?('/store/'+r.slug):('/releases/'+r.slug)} className="storeCover">{r.isMerch&&(r.mockups?.front||r.mockups?.back)?<MerchMockupPreview product={r} raster/>:r.cover?<img src={r.cover} alt={r.title}/>:<span>{r.catalogue}</span>}</Link>
    <div className="storeProductMeta">
     {r.productOrigin==='distributed'&&<span className="selectedBadge">SELECTED / DISTRIBUTION</span>}
     {r.isMerch&&<span className="merchBadge">SIDE:II / MERCH</span>}
     {r.imprint==='lethargia'&&r.productOrigin!=='distributed'&&<Link className="lethargiaBadge" href="/imprints/lethargia">LETHARGIA RECORDS / IMPRINT ↗</Link>}
     <small>{r.isMerch?String(r.merchCategory||'MERCH').toUpperCase():(r.productOrigin==='distributed'?(r.originalLabel||'SELECTED / DISTRIBUTION'):(r.imprint==='lethargia'?'LETHARGIA RECORDS':'SIDE:II'))} · {r.originalCatalogue||r.catalogue}</small>
     <h2>{r.title}</h2>
     {r.productOrigin==='distributed'&&<p className="selectedAttribution">Independent release by <b>{r.originalLabel||'external label'}</b>. Distributed / selected by SIDE:II.</p>}
     <div className="storeVariants">{r.variants.map(v=>{const soldOut=v.format!=='digital'&&v.stock<=0;const canPreorder=soldOut&&v.preorderEnabled;const unavailable=r.status!=='AVAILABLE'||(soldOut&&!canPreorder);return <div className="storeVariant" key={v.id||v.sku}>
      <div><b>{v.formatLabel}</b><span>{r.isMerch?[v.style,soldOut?(canPreorder?'PRE-ORDER':'SOLD OUT'):v.stock+' IN STOCK'].filter(Boolean).join(' · '):v.format==='digital'?'DIGITAL DOWNLOAD':v.format==='vinyl'?[v.vinylSize,v.vinylSpeed,v.vinylWeight&&v.vinylWeight+'G',v.vinylColor,soldOut&&canPreorder?'PRE-ORDER':null].filter(Boolean).join(' · '):soldOut?(canPreorder?'PRE-ORDER':'SOLD OUT'):v.stock+' IN STOCK'}{v.editionNumberingEnabled&&v.editionTotal?' · LIMITED '+v.editionTotal:''}</span></div>
      <strong>{fmt(v.price)}</strong>
      {r.status==='AVAILABLE'&&soldOut&&!canPreorder&&r.commerceConfig?.waitlist!==false?<button className="waitlistButton" type="button" onClick={()=>{setWaitlistVariant(waitlistVariant===v.id?null:v.id);setWaitlistMessage('')}}>WAITLIST</button>:<button disabled={unavailable} onClick={()=>add(r,v)}>{r.status!=='AVAILABLE'?'COMING SOON':canPreorder?'PRE-ORDER':'ADD'}</button>}
      {r.status==='AVAILABLE'&&waitlistVariant===v.id&&<div className="storeWaitlist"><input type="email" placeholder="EMAIL FOR RESTOCK ALERT" value={waitlistEmail} onChange={e=>setWaitlistEmail(e.target.value)}/><button type="button" disabled={waitlistBusy} onClick={()=>joinWaitlist(v)}>{waitlistBusy?'SAVING…':'NOTIFY ME'}</button>{waitlistMessage&&<small>{waitlistMessage}</small>}</div>}
     </div>})}</div>
    </div>
   </article>})}
   </div>}
   {filtered.length===0&&(filter==='lethargia'?<div className="storeNoResults storeNoResultsLethargia"><small>LETHARGIA / CATALOGUE IN PREPARATION</small><h3>No public editions yet.</h3><p>The first Lethargia releases will appear here automatically when they are made public in Control Room.</p><Link href="/imprints/lethargia">OPEN LETHARGIA RECORDS ↗</Link></div>:<div className="storeNoResults">NO PRODUCTS IN THIS SELECTION.</div>)}
  </section>
 </main>;
}
