import {safeUrl} from './builder-url.js';
export const EXTRA_WIDGETS={album:{label:'Albüm kartı',icon:'◉'},artist:{label:'Sanatçı kartı',icon:'♙'},audio:{label:'Ses oynatıcı',icon:'♫'},events:{label:'Etkinlik listesi',icon:'▦'},countdown:{label:'Geri sayım',icon:'◷'},gallery:{label:'Galeri',icon:'▧'},shared:{label:'Ortak bölüm',icon:'⇄'}};
export const validDate=v=>typeof v==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d{1,3})?)?(?:Z|[+-]\d\d:\d\d)$/.test(v)&&Number.isFinite(Date.parse(v));
export function localDateTime(v) {if(!v)return '';const date=new Date(v);return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);}
export function widgetDefaults(type) {return {album:{slug:'',label:'Öne çıkan albüm'},artist:{title:'Sanatçı adı',text:'Sanatçının hikâyesi.',image:'',href:''},audio:{title:'Bir parça dinle',src:'',cover:''},events:{title:'Yaklaşan etkinlikler',items:[]},countdown:{title:'Yeni edisyon yakında',date:'',done:'Şimdi yayında',href:'/store'},gallery:{title:'Galeri',layout:'grid',items:[]},shared:{key:''}}[type]||{};}
export function validateWidgetProps(type,input,pageKey) {
  const defaults=widgetDefaults(type);if(Object.keys(input).some(k=>!Object.hasOwn(defaults,k)))throw new Error('Geçersiz bileşen ayarı.');
  const props={...defaults,...input},fail=()=>{throw new Error('Geçersiz '+EXTRA_WIDGETS[type].label+' ayarı.');};
  const string=(v,n=2048)=>{if(typeof v!=='string'||v.length>n)fail();};
  const url=v=>{string(v);if(v&&!safeUrl(v))fail();};
  for(const [k,v]of Object.entries(props)){if(k==='items')continue;string(v,k==='text'?12000:2048);if(['src','cover','image','href'].includes(k))url(v);}
  if(type==='album'&&props.slug&&!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(props.slug))fail();
  if(type==='shared'&&(pageKey==='site'||pageKey.startsWith('block:')||props.key&&!/^block:[a-z0-9]+(?:-[a-z0-9]+)*$/.test(props.key)))fail();
  if(type==='countdown'&&props.date&&!validDate(props.date))fail();
  if(type==='gallery'){
    if(!['grid','masonry','rail'].includes(props.layout)||!Array.isArray(props.items)||props.items.length>24)fail();
    props.items=props.items.map(i=>{if(!i||typeof i!=='object')fail();url(i.src);string(i.alt,300);return {src:i.src,alt:i.alt};});
  }
  if(type==='events'){
    if(!Array.isArray(props.items)||props.items.length>30)fail();
    props.items=props.items.map(i=>{if(!i||typeof i!=='object')fail();string(i.title,200);string(i.location,200);url(i.href);if(i.date&&!validDate(i.date))fail();return {title:i.title,location:i.location,href:i.href,date:i.date};});
  }
  return props;
}
