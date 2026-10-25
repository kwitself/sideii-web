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
  const rule=(selector,value)=>{if(value)rules.push(selector+'{'+value+'}');};
  rule('body',[(d.bodyFont?'font-family:'+fontFamily(d.bodyFont):''),(d.backgroundColor?'background:'+d.backgroundColor:''),(d.textColor?'color:'+d.textColor:'')].filter(Boolean).join(';'));
  if(d.bodyFont)rule('main p,main [data-home-field],.storefrontFooter,.globalSiteHeader','font-family:'+fontFamily(d.bodyFont));
  rule('main :is(h1,h2,h3,h4),main [data-home-title]',[(d.headingFont?'font-family:'+fontFamily(d.headingFont):''),(d.headingColor?'color:'+d.headingColor:'')].filter(Boolean).join(';'));
  if(d.accentColor)rule('main :is(h1,h2,h3) :is(i,em),main a:not([class])','color:'+d.accentColor);
  rule('.pbButton,.imprintExplore,.storeEntry,.productionCta a,.productButton,.merchBuyRow button',[(d.buttonColor?'background:'+d.buttonColor:''),(d.buttonTextColor?'color:'+d.buttonTextColor:''),(d.buttonRadius!=null?'border-radius:'+d.buttonRadius+'px':''),(d.buttonPadding!=null?'padding:'+d.buttonPadding+'px '+d.buttonPadding*2+'px':'')].filter(Boolean).join(';'));
  if(d.contentWidth)rule('.shell,.pbRoot>.pbNodePosition>.pb-section','max-width:'+d.contentWidth+'px');
  if(d.sectionSpacing!=null)rule('main section[data-home-section],.pbRoot>.pbNodePosition>.pb-section','padding-top:'+d.sectionSpacing+'px;padding-bottom:'+d.sectionSpacing+'px');
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
