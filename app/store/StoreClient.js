'use client';
import GlobalHeader from '../components/GlobalHeader';
import Link from 'next/link';
import {useEffect,useMemo,useState} from 'react';
import {supabase} from '../lib/supabase';
import {addCartItem} from '../lib/cart';
import {readWishlist,writeWishlist,wishlistItemFromProduct} from '../lib/wishlist';
import {useLocaleCurrency} from '../components/LocaleCurrencyProvider';
import MerchMockupPreview from '../components/MerchMockupPreview';

const normalizeSearch=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const searchTokens=value=>normalizeSearch(value).split(/\s+/).filter(Boolean);
const productSearchFields=r=>({
 title:normalizeSearch([r.rawTitle,r.title].filter(Boolean).join(' ')),
 artist:normalizeSearch(r.artist),
 catalogue:normalizeSearch([r.catalogue,r.originalCatalogue].filter(Boolean).join(' ')),
 taxonomy:normalizeSearch([r.imprint,r.merchCategory,r.productOrigin,...(r.collections||[]).flatMap(x=>[x.slug,x.name])].filter(Boolean).join(' ')),
 variants:normalizeSearch((r.variants||[]).flatMap(v=>[v.sku,v.format,v.formatLabel,v.formatDetail,v.size,v.color,v.style,v.vinylColor]).filter(Boolean).join(' '))
});
const relevanceScore=(r,query)=>{
 const tokens=searchTokens(query);if(!tokens.length)return 0;
 const f=productSearchFields(r);
 let score=0;
 for(const token of tokens){
  if(f.title===token)score+=100;else if(f.title.startsWith(token))score+=70;else if(f.title.includes(token))score+=50;
  if(f.catalogue===token)score+=90;else if(f.catalogue.includes(token))score+=55;
  if(f.artist.includes(token))score+=38;
  if(f.variants.includes(token))score+=32;
  if(f.taxonomy.includes(token))score+=20;
 }
 return score;
};
const matchesSearch=(r,query)=>{
 const tokens=searchTokens(query);if(!tokens.length)return true;
 const f=productSearchFields(r),all=[f.title,f.artist,f.catalogue,f.taxonomy,f.variants].join(' ');
 return tokens.every(token=>all.includes(token));
};

export default function StoreClient({releases}){
 const {money:fmt,t}=useLocaleCurrency();
 const [filter,setFilter]=useState('all'),[formatFilter,setFormatFilter]=useState('all');
 const [search,setSearch]=useState(''),[availability,setAvailability]=useState('all'),[collectionFilter,setCollectionFilter]=useState('all'),[sortMode,setSortMode]=useState('newest');
 const [limitedOnly,setLimitedOnly]=useState(false),[preorderOnly,setPreorderOnly]=useState(false),[minPrice,setMinPrice]=useState(''),[maxPrice,setMaxPrice]=useState('');
 const [categoryFilter,setCategoryFilter]=useState('all'),[sizeFilter,setSizeFilter]=useState('all'),[colorFilter,setColorFilter]=useState('all');
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
  setCategoryFilter(q.get('category')||'all');setSizeFilter(q.get('size')||'all');setColorFilter(q.get('color')||'all');
  setLimitedOnly(q.get('limited')==='1');setPreorderOnly(q.get('preorder')==='1');
  setMinPrice(q.get('min')||'');setMaxPrice(q.get('max')||'');
  if(['newest','relevance','price-asc','price-desc','title'].includes(q.get('sort')))setSortMode(q.get('sort'));
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
  setOrDelete('availability',availability);setOrDelete('collection',collectionFilter);setOrDelete('category',categoryFilter);setOrDelete('size',sizeFilter);setOrDelete('color',colorFilter);
  limitedOnly?q.set('limited','1'):q.delete('limited');preorderOnly?q.set('preorder','1'):q.delete('preorder');
  setOrDelete('min',minPrice,'');setOrDelete('max',maxPrice,'');setOrDelete('sort',sortMode,'newest');
  const next=window.location.pathname+(q.toString()?'?'+q.toString():'');
  window.history.replaceState({},'',next);
 },[filtersReady,filter,formatFilter,search,availability,collectionFilter,categoryFilter,sizeFilter,colorFilter,limitedOnly,preorderOnly,minPrice,maxPrice,sortMode]);

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
  const {data:sub}=supabase?.auth.onAuthStateChange((event,s)=>{const u=s?.user||null;setWishlistUser(u);if(u)load();else if(event==='SIGNED_OUT'){setWishlist([]);writeWishlist([])}})||{data:{subscription:{unsubscribe(){}}}};
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
 const facetOptions=useMemo(()=>{
  const categories=new Set(),sizes=new Set(),colors=new Set();
  for(const r of uniqueReleases){
   if(r.merchCategory)categories.add(r.merchCategory);
   for(const v of r.variants||[]){if(v.size)sizes.add(v.size);if(v.color)colors.add(v.color);if(v.vinylColor)colors.add(v.vinylColor)}
  }
  const sort=[...categories].sort((a,b)=>String(a).localeCompare(String(b)));
  const alpha=set=>[...set].sort((a,b)=>String(a).localeCompare(String(b)));
  return {categories:sort,sizes:alpha(sizes),colors:alpha(colors)};
 },[uniqueReleases]);
 const searchSuggestions=useMemo(()=>{
  const seen=new Set(),out=[];
  const push=value=>{const v=String(value||'').trim();const key=normalizeSearch(v);if(!v||!key||seen.has(key))return;seen.add(key);out.push(v)};
  for(const r of uniqueReleases){push(r.rawTitle||r.title);push(r.artist);push(r.catalogue);push(r.originalCatalogue);for(const v of r.variants||[])push(v.sku)}
  return out.slice(0,80);
 },[uniqueReleases]);
 const filtered=useMemo(()=>uniqueReleases.filter(r=>{
  if(r.storefrontConfig?.visibility?.store===false)return false;
  if(filter!=='all'&&(filter==='selected'?r.productOrigin!=='distributed':r.imprint!==filter))return false;
  if(formatFilter!=='all'&&(formatFilter==='merch'?!r.isMerch:!r.variants.some(v=>v.format===formatFilter)))return false;
  if(search.trim()){
   if(r.storefrontConfig?.visibility?.search===false)return false;
   if(!matchesSearch(r,search))return false;
  }
  if(categoryFilter!=='all'&&String(r.merchCategory||'')!==categoryFilter)return false;
  if(sizeFilter!=='all'&&!(r.variants||[]).some(v=>String(v.size||'')===sizeFilter))return false;
  if(colorFilter!=='all'&&!(r.variants||[]).some(v=>String(v.color||v.vinylColor||'')===colorFilter))return false;
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
 }),[uniqueReleases,filter,formatFilter,search,availability,collectionFilter,categoryFilter,sizeFilter,colorFilter,limitedOnly,preorderOnly,minPrice,maxPrice]);
 const sortedFiltered=useMemo(()=>{
  const rows=[...filtered];
  const firstPrice=r=>Math.min(...(r.variants||[]).map(v=>Number(v.price)).filter(Number.isFinite),Number.POSITIVE_INFINITY);
  if(sortMode==='relevance'&&search.trim())rows.sort((a,b)=>relevanceScore(b,search)-relevanceScore(a,search));
  else if(sortMode==='price-asc')rows.sort((a,b)=>firstPrice(a)-firstPrice(b));
  else if(sortMode==='price-desc')rows.sort((a,b)=>firstPrice(b)-firstPrice(a));
  else if(sortMode==='title')rows.sort((a,b)=>String(a.rawTitle||a.title).localeCompare(String(b.rawTitle||b.title)));
  return rows;
 },[filtered,sortMode,search]);
 const resetDiscovery=()=>{setFilter('all');setFormatFilter('all');setSearch('');setAvailability('all');setCollectionFilter('all');setCategoryFilter('all');setSizeFilter('all');setColorFilter('all');setLimitedOnly(false);setPreorderOnly(false);setMinPrice('');setMaxPrice('');setSortMode('newest')};
 const activeFilterCount=[filter!=='all',formatFilter!=='all',availability!=='all',collectionFilter!=='all',categoryFilter!=='all',sizeFilter!=='all',colorFilter!=='all',limitedOnly,preorderOnly,minPrice!=='',maxPrice!==''].filter(Boolean).length;
 const activeChips=[
  filter!=='all'&&{key:'imprint',label:filter==='selected'?'SELECTED':filter.toUpperCase(),clear:()=>setFilter('all')},
  formatFilter!=='all'&&{key:'media',label:formatFilter.toUpperCase(),clear:()=>setFormatFilter('all')},
  availability!=='all'&&{key:'availability',label:availability.toUpperCase(),clear:()=>setAvailability('all')},
  collectionFilter!=='all'&&{key:'collection',label:'COLLECTION · '+collectionFilter.toUpperCase(),clear:()=>setCollectionFilter('all')},
  categoryFilter!=='all'&&{key:'category',label:'CATEGORY · '+String(categoryFilter).toUpperCase(),clear:()=>setCategoryFilter('all')},
  sizeFilter!=='all'&&{key:'size',label:'SIZE · '+String(sizeFilter).toUpperCase(),clear:()=>setSizeFilter('all')},
  colorFilter!=='all'&&{key:'color',label:'COLOUR · '+String(colorFilter).toUpperCase(),clear:()=>setColorFilter('all')},
  limitedOnly&&{key:'limited',label:'LIMITED',clear:()=>setLimitedOnly(false)},
  preorderOnly&&{key:'preorder',label:'PRE-ORDER',clear:()=>setPreorderOnly(false)},
  minPrice!==''&&{key:'min',label:'MIN · '+minPrice,clear:()=>setMinPrice('')},
  maxPrice!==''&&{key:'max',label:'MAX · '+maxPrice,clear:()=>setMaxPrice('')}
 ].filter(Boolean);
 const add=(r,v)=>{addCartItem(r,v);window.dispatchEvent(new Event('sideii-open-bag'))};
 const productHref=r=>r.isMerch?('/store/'+r.slug):('/releases/'+r.slug);
 const cardPosition=card=>card?.image_position==='custom'?((card.crop_x??50)+'% '+(card.crop_y??50)+'%'):(card?.image_position||'center');
 const secondaryImageFor=r=>{
  if(r.isMerch)return r.mockups?.back?.previewCleanUrl||r.galleryImages?.find(x=>x?.mockup?.side==='back')?.url||r.galleryImages?.find(x=>!x?.mockup)?.url||null;
  return r.gallery?.[0]||null;
 };
 const stockText=(r,v,mode='quantity')=>{
  if(mode==='hidden')return '';
  const digital=v.format==='digital';
  const preorder=!digital&&Number(v.stock||0)<=0&&v.preorderEnabled;
  const soldOut=!digital&&Number(v.stock||0)<=0&&!v.preorderEnabled;
  if(mode==='status')return digital?'DIGITAL':preorder?'PRE-ORDER':soldOut?'SOLD OUT':'IN STOCK';
  return digital?'DIGITAL DOWNLOAD':preorder?'PRE-ORDER':soldOut?'SOLD OUT':(v.stock??0)+' IN STOCK';
 };

 return <main className={"storePage "+(filter==="lethargia"?"storePageLethargia":"")}>
  <GlobalHeader/>
  <section className="storeHero shell"><span>STORE / CATALOGUE</span><h1>Available<br/><i>editions.</i></h1><p>Physical objects and digital masters from SIDE:II and its imprints.</p><div className="storeEditorialLinks"><Link className="storeWearEntry" href="/wear">{t('WEAR WHAT YOU SUPPORT')} →</Link><Link className="storeWearEntry" href="/collections">{t('COLLECTIONS')} →</Link><Link className="storeWearEntry" href="/bundles">{t('BUNDLES')} →</Link><Link className="storeWearEntry" href="/archive">{t('ARCHIVE')} →</Link></div></section>
  <section className="storeFilters shell"><div>{[['all','ALL'],['sideii','SIDE:II'],['lethargia','LETHARGIA'],['selected','SELECTED']].map(([v,l])=><button key={v} className={filter===v?'active':''} onClick={()=>setFilter(v)}>{l}</button>)}</div><div>{[['all','ALL MEDIA'],['merch','MERCH'],['vinyl','VINYL'],['cd','CD'],['cassette','CASSETTE'],['digital','DIGITAL']].map(([v,l])=><button key={v} className={formatFilter===v?'active':''} onClick={()=>setFormatFilter(v)}>{l}</button>)}</div><div className="storeViewToggle" role="group" aria-label="Store view"><span>VIEW</span><button type="button" className={viewMode==='editorial'?'active':''} aria-pressed={viewMode==='editorial'} onClick={()=>setViewMode('editorial')}>EDITORIAL</button><button type="button" className={viewMode==='classic'?'active':''} aria-pressed={viewMode==='classic'} onClick={()=>setViewMode('classic')}>CLASSIC</button></div></section>
  <section className="storeDiscoveryTools shell">
   <div className="storeSearchField"><label htmlFor="sideii-store-search">SEARCH CATALOGUE</label><input id="sideii-store-search" type="search" list="store-search-suggestions" value={search} onChange={e=>{setSearch(e.target.value);if(e.target.value.trim()&&sortMode==='newest')setSortMode('relevance')}} placeholder="Title, artist, catalogue, SKU, colour, collection…"/><datalist id="store-search-suggestions">{searchSuggestions.map(x=><option value={x} key={x}/>)}</datalist>{search&&<button type="button" className="storeSearchClear" aria-label="Clear catalogue search" onClick={()=>{setSearch('');if(sortMode==='relevance')setSortMode('newest')}}>CLEAR ×</button>}</div>
   <div className="storeDiscoveryControls">
    <label><span>AVAILABILITY</span><select value={availability} onChange={e=>setAvailability(e.target.value)}><option value="all">ALL</option><option value="in-stock">IN STOCK</option><option value="preorder">PRE-ORDER</option><option value="sold-out">SOLD OUT</option></select></label>
    <label><span>COLLECTION</span><select value={collectionFilter} onChange={e=>setCollectionFilter(e.target.value)}><option value="all">ALL COLLECTIONS</option>{collectionOptions.map(x=><option value={x.slug} key={x.slug}>{String(x.name).toUpperCase()}</option>)}</select></label>
    <label><span>CATEGORY</span><select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}><option value="all">ALL CATEGORIES</option>{facetOptions.categories.map(x=><option value={x} key={x}>{String(x).toUpperCase()}</option>)}</select></label>
    <label><span>SIZE</span><select value={sizeFilter} onChange={e=>setSizeFilter(e.target.value)}><option value="all">ALL SIZES</option>{facetOptions.sizes.map(x=><option value={x} key={x}>{String(x).toUpperCase()}</option>)}</select></label>
    <label><span>COLOUR</span><select value={colorFilter} onChange={e=>setColorFilter(e.target.value)}><option value="all">ALL COLOURS</option>{facetOptions.colors.map(x=><option value={x} key={x}>{String(x).toUpperCase()}</option>)}</select></label>
    <label><span>MIN PRICE</span><input type="number" min="0" step="1" value={minPrice} onChange={e=>setMinPrice(e.target.value)} placeholder="0"/></label>
    <label><span>MAX PRICE</span><input type="number" min="0" step="1" value={maxPrice} onChange={e=>setMaxPrice(e.target.value)} placeholder="ANY"/></label>
    <label><span>SORT</span><select value={sortMode} onChange={e=>setSortMode(e.target.value)}><option value="newest">NEWEST</option><option value="relevance">RELEVANCE</option><option value="price-asc">PRICE LOW → HIGH</option><option value="price-desc">PRICE HIGH → LOW</option><option value="title">TITLE A → Z</option></select></label>
    <label className={"storeDiscoveryToggle "+(preorderOnly?'active':'')}><input type="checkbox" checked={preorderOnly} onChange={e=>setPreorderOnly(e.target.checked)}/><span>PRE-ORDER ONLY</span></label>
    <label className={"storeDiscoveryToggle "+(limitedOnly?'active':'')}><input type="checkbox" checked={limitedOnly} onChange={e=>setLimitedOnly(e.target.checked)}/><span>LIMITED ONLY</span></label>
   </div>
   {activeChips.length>0&&<div className="storeActiveFilters">{activeChips.map(chip=><button type="button" key={chip.key} onClick={chip.clear}><span>{chip.label}</span><b>×</b></button>)}</div>}
   <div className="storeDiscoveryMeta"><span>{filtered.length} / {uniqueReleases.filter(r=>r.storefrontConfig?.visibility?.store!==false).length} OBJECTS{activeFilterCount?' · '+activeFilterCount+' ACTIVE FILTER'+(activeFilterCount===1?'':'S'):''}{search.trim()?' · SEARCH RANKED':''}</span><button type="button" onClick={resetDiscovery}>RESET DISCOVERY</button></div>
  </section>
  {filter==='lethargia'&&<section className="storeImprintContext shell"><div><small>A SIDE:II IMPRINT</small><img src="/brand/lethargia/lethargia-logo.png" alt="Lethargia Records"/></div><p>Independent editions developed under their own visual and physical logic.</p><Link href="/imprints/lethargia">OPEN IMPRINT ↗</Link></section>}
  <section className={"storeCatalogue shell "+(viewMode==='classic'?'classicMode':'editorialMode')}>
   {viewMode==='classic'?<div className="storeClassicGrid">{sortedFiltered.map((r,i)=>{const cfg=r.storefrontConfig||{},card=cfg.card||{},badgeCfg=cfg.badge||{};const variants=r.variants||[];const classicCta=card.classic_cta&&card.classic_cta!=='inherit'?card.classic_cta:card.cta;const secondaryImage=card.secondary_hover===false?null:secondaryImageFor(r);const prices=variants.map(v=>Number(v.price)).filter(Number.isFinite);const minVariantPrice=prices.length?Math.min(...prices):null;const primary=variants.find(v=>v.format==='digital'||v.stock>0||v.preorderEnabled)||variants[0]||{};const soldOut=primary.format!=='digital'&&Number(primary.stock||0)<=0;const canPreorder=soldOut&&primary.preorderEnabled;const multi=variants.length>1;const unavailable=r.status!=='AVAILABLE'||(soldOut&&!canPreorder);const autoBadge=r.status!=='AVAILABLE'?'COMING SOON':canPreorder?'PRE-ORDER':soldOut?'SOLD OUT':primary.editionNumberingEnabled&&primary.editionTotal?'LIMITED':i<2?'NEW':null;const badge=badgeCfg.mode==='none'?null:badgeCfg.mode==='manual'?(badgeCfg.text||null):autoBadge;return <article className={"storeClassicCard title-"+(card.title_scale||'regular')+" "+(card.secondary_mobile?'secondaryMobile ':'')+(card.density==='compact'?"compact ":"")+(r.isMerch?"merch ":"")+(r.imprint==="lethargia"?"lethargia ":"")} key={r.slug}>
  <div className="storeClassicMedia">
   {badge&&<span className={"storeClassicBadge "+(badgeCfg.tone||'neutral')+" "+String(badge).toLowerCase().replaceAll(' ','-')}>{badge}</span>}
   {card.wishlist!==false&&<button type="button" className={"storeClassicWish "+(wishlist.some(x=>x.product_slug===r.slug)?"active":"")} aria-label="Toggle wishlist" onClick={()=>toggleWishlist(r)}>{wishlist.some(x=>x.product_slug===r.slug)?'♥':'♡'}</button>}
   <Link href={productHref(r)} className={"storeCardMediaLink "+(secondaryImage?'hasSecondary':'')}>{r.isMerch&&(r.mockups?.front||r.mockups?.back)?<MerchMockupPreview product={r} raster displayMode="thumb"/>:r.cover?<img className="storePrimaryImage" src={r.cover} alt={r.title} style={{objectFit:card.image_fit||'contain',objectPosition:cardPosition(card)}}/>:<div className="storeClassicPlaceholder">{r.catalogue}</div>}{secondaryImage&&<img className="storeSecondaryImage" src={secondaryImage} alt="" style={{objectFit:card.image_fit||'contain',objectPosition:cardPosition(card)}}/>}</Link>
  </div>
  <div className="storeClassicMeta">
   {card.metadata!==false&&<small>{r.isMerch?String(r.merchCategory||'MERCH').toUpperCase():(r.imprint==='lethargia'?'LETHARGIA':'SIDE:II')} · {r.originalCatalogue||r.catalogue}</small>}
   <Link href={productHref(r)}><h3>{r.title}</h3></Link>
   <div className="storeClassicPrice">{card.price_mode!=='hidden'&&<strong>{card.price_mode==='from'&&minVariantPrice!=null?'FROM '+fmt(minVariantPrice):(primary.price!=null?fmt(primary.price):'—')}</strong>}{card.stock_mode!=='hidden'&&<span className="storeClassicStock">{stockText(r,primary,card.stock_mode||'quantity')}</span>}{primary.editionNumberingEnabled&&primary.editionTotal&&<span>{primary.editionTotal} EDITION</span>}</div>
   <div className="storeClassicAction">{classicCta==='view'||card.quick_add===false?<Link href={productHref(r)}>VIEW PRODUCT</Link>:classicCta==='options'||multi?<Link href={productHref(r)}>SELECT OPTIONS</Link>:r.status==='AVAILABLE'&&soldOut&&!canPreorder?<Link href={productHref(r)}>{r.commerceConfig?.waitlist===false?'VIEW PRODUCT':'WAITLIST / VIEW'}</Link>:<button type="button" disabled={unavailable} onClick={()=>add(r,primary)}>{r.status!=='AVAILABLE'?'COMING SOON':canPreorder?'PRE-ORDER':'ADD TO BAG'}</button>}</div>
  </div>
 </article>})}</div>:<div className="storeEditorialList">{sortedFiltered.map(r=>{const card=r.storefrontConfig?.card||{};const editorialCta=card.editorial_cta&&card.editorial_cta!=='inherit'?card.editorial_cta:(card.cta==='view'?'view':'quick');const secondaryImage=card.secondary_hover===false?null:secondaryImageFor(r);return <article className={"storeProduct title-"+(card.title_scale||'regular')+" "+(card.secondary_mobile?'secondaryMobile ':'')+(r.isMerch?"merchProduct ":"")+(r.productOrigin==="distributed"?"selectedProduct ":"")+(r.imprint==="lethargia"?"lethargiaProduct":"")} key={r.slug}>
    {card.wishlist!==false&&<button type="button" className={"storeWishlistButton "+(wishlist.some(x=>x.product_slug===r.slug)?"active":"")} aria-label="Toggle wishlist" onClick={()=>toggleWishlist(r)}>{wishlist.some(x=>x.product_slug===r.slug)?'♥':'♡'}</button>}
    <Link href={r.isMerch?('/store/'+r.slug):('/releases/'+r.slug)} className={"storeCover "+(secondaryImage?'hasSecondary':'')}>{r.isMerch&&(r.mockups?.front||r.mockups?.back)?<MerchMockupPreview product={r} raster/>:r.cover?<img className="storePrimaryImage" src={r.cover} alt={r.title} style={{objectFit:card.image_fit||'cover',objectPosition:cardPosition(card)}}/>:<span>{r.catalogue}</span>}{secondaryImage&&<img className="storeSecondaryImage" src={secondaryImage} alt="" style={{objectFit:card.image_fit||'cover',objectPosition:cardPosition(card)}}/>}</Link>
    <div className="storeProductMeta">
     {r.productOrigin==='distributed'&&<span className="selectedBadge">SELECTED / DISTRIBUTION</span>}
     {r.isMerch&&<span className="merchBadge">SIDE:II / MERCH</span>}
     {r.imprint==='lethargia'&&r.productOrigin!=='distributed'&&<Link className="lethargiaBadge" href="/imprints/lethargia">LETHARGIA RECORDS / IMPRINT ↗</Link>}
     <small>{r.isMerch?String(r.merchCategory||'MERCH').toUpperCase():(r.productOrigin==='distributed'?(r.originalLabel||'SELECTED / DISTRIBUTION'):(r.imprint==='lethargia'?'LETHARGIA RECORDS':'SIDE:II'))} · {r.originalCatalogue||r.catalogue}</small>
     <h2>{r.title}</h2>
     {r.productOrigin==='distributed'&&<p className="selectedAttribution">Independent release by <b>{r.originalLabel||'external label'}</b>. Distributed / selected by SIDE:II.</p>}
     <div className="storeVariants">{r.variants.map(v=>{const soldOut=v.format!=='digital'&&v.stock<=0;const canPreorder=soldOut&&v.preorderEnabled;const unavailable=r.status!=='AVAILABLE'||(soldOut&&!canPreorder);return <div className="storeVariant" key={v.id||v.sku}>
      <div><b>{v.formatLabel}</b><span>{[r.isMerch?v.style:(v.format==='vinyl'?[v.vinylSize,v.vinylSpeed,v.vinylWeight&&v.vinylWeight+'G',v.vinylColor].filter(Boolean).join(' · '):v.format==='digital'?'DIGITAL':null),stockText(r,v,card.stock_mode||'quantity')].filter(Boolean).join(' · ')}{v.editionNumberingEnabled&&v.editionTotal?' · LIMITED '+v.editionTotal:''}</span></div>
      {card.price_mode!=='hidden'&&<strong>{fmt(v.price)}</strong>}
      {editorialCta==='view'?<Link className="storeVariantView" href={productHref(r)}>VIEW PRODUCT</Link>:r.status==='AVAILABLE'&&soldOut&&!canPreorder&&r.commerceConfig?.waitlist!==false?<button className="waitlistButton" type="button" onClick={()=>{setWaitlistVariant(waitlistVariant===v.id?null:v.id);setWaitlistMessage('')}}>WAITLIST</button>:<button disabled={unavailable} onClick={()=>add(r,v)}>{r.status!=='AVAILABLE'?'COMING SOON':canPreorder?'PRE-ORDER':'ADD'}</button>}
      {r.status==='AVAILABLE'&&waitlistVariant===v.id&&<div className="storeWaitlist"><input type="email" placeholder="EMAIL FOR RESTOCK ALERT" value={waitlistEmail} onChange={e=>setWaitlistEmail(e.target.value)}/><button type="button" disabled={waitlistBusy} onClick={()=>joinWaitlist(v)}>{waitlistBusy?'SAVING…':'NOTIFY ME'}</button>{waitlistMessage&&<small>{waitlistMessage}</small>}</div>}
     </div>})}</div>
    </div>
   </article>})}
   </div>}
   {filtered.length===0&&(filter==='lethargia'?<div className="storeNoResults storeNoResultsLethargia"><small>LETHARGIA / CATALOGUE IN PREPARATION</small><h3>No public editions yet.</h3><p>The first Lethargia releases will appear here automatically when they are made public in Control Room.</p><Link href="/imprints/lethargia">OPEN LETHARGIA RECORDS ↗</Link></div>:<div className="storeNoResults discoveryEmpty"><small>NO MATCHES</small><h3>Nothing fits this search yet.</h3><p>Try removing a filter or broadening the search terms.</p><button type="button" onClick={resetDiscovery}>RESET DISCOVERY</button></div>)}
  </section>
 </main>;
}
