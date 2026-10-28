import {FONT_VALUES} from './builder-fonts.js';
import {safeUrl} from './builder-url.js';

export const validFontId = id => Object.hasOwn(FONT_VALUES, id) || /^custom-[a-f0-9]{32}$/.test(id);
export const fontFamily = id => FONT_VALUES[id] || (/^custom-[a-f0-9]{32}$/.test(id) ? '"'+id+'",sans-serif' : 'inherit');
const fail = () => {throw new Error('Geçersiz site ayarı.');};
const object = v => v && typeof v === 'object' && !Array.isArray(v);
const text = (v, max=2048) => {if(typeof v !== 'string' || v.length > max) fail();return v;};
const url = v => {text(v);if(v && !safeUrl(v)) fail();return v;};
export const DESIGN_NUMBERS = {buttonRadius:[0,100],buttonPadding:[4,48],sectionSpacing:[0,200],contentWidth:[600,2000]};
export const DESIGN_COLORS = ['backgroundColor','textColor','headingColor','accentColor','buttonColor','buttonTextColor'];
// Match the existing SIDE:II storefront; these are fallbacks, never saved overrides.
export const SITE_THEME_DEFAULTS = {bodyFont:'sans',headingFont:'serif',backgroundColor:'#09090a',textColor:'#e3e0d9',headingColor:'#e3e0d9',accentColor:'#742633',buttonColor:'#09090a',buttonTextColor:'#e3e0d9',buttonRadius:0,buttonPadding:14,sectionSpacing:112,contentWidth:1440};
export function themeFontId(node,site) {
  const heading=['heading','siteSection','quote','accordion','products','album','artist','audio','events','countdown','gallery'].includes(node?.type);
  const key=heading?'headingFont':'bodyFont';
  return site?.design?.[key]||SITE_THEME_DEFAULTS[key];
}
export function defaultSiteSettings() {
  return {design:{},fonts:[],header:{custom:false,logo:'/brand/sideii-logo-flat.png',announcement:'',announcementHref:'',mobileLabel:'MENU',sticky:false,links:[['Releases','/#releases'],['Imprints','/#imprints'],['Store','/store'],['Wear','/wear'],['Apply','/apply']].map(([label,href])=>({label,href,placement:'primary'}))},footer:{custom:false,logo:'/brand/sideii-logo-flat.png',description:'Music, in another form.',copyright:'© SIDE:II',links:[{label:'Store',href:'/store'},{label:'Policies',href:'/policies'}],social:[]}};
}
export function validateSiteSettings(input=defaultSiteSettings()) {
  if(!object(input)||!object(input.design)||!Array.isArray(input.fonts)||input.fonts.length>12) fail();
  const design={};
  for(const [k,v] of Object.entries(input.design)) {
    if(['bodyFont','headingFont'].includes(k)){if(!validFontId(v))fail();}
    else if(DESIGN_COLORS.includes(k)){if(!/^#[a-fA-F0-9]{6}$/.test(v))fail();}
    else if(Object.hasOwn(DESIGN_NUMBERS,k)){const [min,max]=DESIGN_NUMBERS[k];if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)fail();}
    else fail();
    design[k]=v;
  }
  const ids=new Set();
  const fonts=input.fonts.map(f=>{
    if(!object(f)||!/^custom-[a-f0-9]{32}$/.test(f.id)||ids.has(f.id))fail();
    ids.add(f.id);text(f.name,80);url(f.url);
    if(!/\/storage\/v1\/object\/public\/site-builder-fonts\/[a-f0-9-]{36}\.woff2$/.test(f.url))fail();
    return {id:f.id,name:f.name,url:f.url};
  });
  const links=(items,header=false)=>{
    if(!Array.isArray(items)||items.length>24)fail();
    return items.map(item=>{if(!object(item))fail();const result={label:text(item.label,80),href:url(item.href)};if(header){if(!['primary','more','mobile'].includes(item.placement))fail();result.placement=item.placement;}return result;});
  };
  const h=input.header,f=input.footer;
  if(!object(h)||!object(f)||typeof h.custom!=='boolean'||typeof h.sticky!=='boolean'||typeof f.custom!=='boolean')fail();
  const header={custom:h.custom,sticky:h.sticky,logo:url(h.logo),announcement:text(h.announcement,300),announcementHref:url(h.announcementHref),mobileLabel:text(h.mobileLabel,24),links:links(h.links,true)};
  if(header.links.filter(l=>l.placement==='primary').length>6)throw new Error('Üst menüde en fazla 6 ana bağlantı olabilir.');
  const footer={custom:f.custom,logo:url(f.logo),description:text(f.description,1000),copyright:text(f.copyright,200),links:links(f.links),social:links(f.social)};
  return {design,fonts,header,footer};
}
export function customFontCss(site) {return (site?.fonts||[]).map(f=>'@font-face{font-family:"'+f.id+'";src:url("'+f.url+'");font-display:swap;font-style:normal;font-weight:100 900}').join('');}
export function siteDesignCss(site) {
  const d=site?.design||{}, rules=[];
  // Native headings contain editable spans; body styles must not override
  // their inherited heading font or colour.
  const bodyText='main p:not(:where([data-home-title],[data-home-title] *)),main [data-home-section] [data-home-field]:not(:where(h1,h2,h3,h4,[data-home-title],[data-home-title] *))';
  const rule=(selector,value)=>{if(value)rules.push(selector+'{'+value+'}');};
  const tokens={bodyFont:'body-font',headingFont:'heading-font',textColor:'text',headingColor:'heading',accentColor:'accent',buttonColor:'button-background',buttonTextColor:'button-text',buttonRadius:'button-radius',buttonPadding:'button-padding',sectionSpacing:'section-spacing',contentWidth:'content-width'};
  rule(':root',Object.entries(tokens).filter(([key])=>d[key]!=null).map(([key,name])=>'--pb-site-'+name+':'+(key.endsWith('Font')?fontFamily(d[key]):d[key]+(typeof d[key]==='number'?'px':''))).join(';'));
  rule('body,.pbRoot',[(d.bodyFont?'font-family:'+fontFamily(d.bodyFont):''),(d.backgroundColor?'background:'+d.backgroundColor:''),(d.textColor?'color:'+d.textColor:'')].filter(Boolean).join(';'));
  if(d.bodyFont)rule(bodyText+',.storefrontFooter,.globalSiteHeader','font-family:var(--pb-override-font,'+fontFamily(d.bodyFont)+')');
  rule('main :is(h1,h2,h3,h4),main [data-home-title],.pbRoot .pb-heading',[(d.headingFont?'font-family:var(--pb-override-font,'+fontFamily(d.headingFont)+')':''),(d.headingColor?'color:var(--pb-override-color,'+d.headingColor+')':'')].filter(Boolean).join(';'));
  if(d.textColor)rule(bodyText,'color:var(--pb-override-color,'+d.textColor+')');
  if(d.accentColor)rule('main :is(h1,h2,h3) :is(i,em),main a:not([class])','color:'+d.accentColor);
  rule('.pbButton,.imprintExplore,.storeEntry,.productionCta a,.productButton,.merchBuyRow button',[(d.buttonColor?'background:'+d.buttonColor:''),(d.buttonTextColor?'color:'+d.buttonTextColor:''),(d.buttonRadius!=null?'border-radius:'+d.buttonRadius+'px':''),(d.buttonPadding!=null?'padding:'+d.buttonPadding+'px '+d.buttonPadding*2+'px':'')].filter(Boolean).join(';'));
  if(d.contentWidth)rule('.shell','max-width:'+d.contentWidth+'px');
  if(d.sectionSpacing!=null)rule('main section[data-home-section]','padding-top:'+d.sectionSpacing+'px;padding-bottom:'+d.sectionSpacing+'px');
  return rules.join('');
}
export function validateSeo(seo) {
  if(!object(seo))fail();
  if(Object.keys(seo).some(k=>!['title','description','image','noindex'].includes(k)))fail();
  if(seo.noindex!==undefined&&typeof seo.noindex!=='boolean')fail();
  return {title:text(seo.title||'',120),description:text(seo.description||'',320),image:url(seo.image||''),noindex:seo.noindex===true};
}
export function builderMetadata(doc,fallback={},product={}) {
  const seo=doc?.seo;if(!seo)return fallback;
  const replace=s=>s.replaceAll('{title}',product.title||'').replaceAll('{artist}',product.artist||'');
  const title=seo.title?replace(seo.title):undefined,description=seo.description?replace(seo.description):undefined;
  return {...fallback,...(title?{title}:{}),...(description?{description}:{}),...(seo.noindex?{robots:{index:false,follow:false}}:{}),...((title||description||seo.image)?{openGraph:{...fallback.openGraph,...(title?{title}:{}),...(description?{description}:{}),...(seo.image?{images:[seo.image]}:{})},twitter:{...fallback.twitter,...(title?{title}:{}),...(description?{description}:{}),...(seo.image?{images:[seo.image]}:{})}}:{})};
}
