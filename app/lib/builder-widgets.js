import {safeUrl} from './builder-url.js';
export const EXTRA_WIDGETS={album:{label:'Albüm kartı',icon:'◉'},artist:{label:'Sanatçı kartı',icon:'♙'},audio:{label:'Ses oynatıcı',icon:'♫'},events:{label:'Etkinlik listesi',icon:'▦'},countdown:{label:'Geri sayım',icon:'◷'},gallery:{label:'Galeri',icon:'▧'},shared:{label:'Ortak bölüm',icon:'⇄'},discography:{label:'Diskografi',icon:'◎'},tracklist:{label:'İnteraktif tracklist',icon:'♫'},tabs:{label:'Sekmeli içerik',icon:'▤'},timeline:{label:'Release timeline',icon:'◷'},merch:{label:'Merchandise vitrini',icon:'▣'}};
export const validDate=v=>typeof v==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d{1,3})?)?(?:Z|[+-]\d\d:\d\d)$/.test(v)&&Number.isFinite(Date.parse(v));
export function localDateTime(v) {if(!v)return '';const date=new Date(v);return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);}
export function widgetDefaults(type) {return {album:{slug:'',label:'Öne çıkan albüm'},artist:{title:'Sanatçı adı',text:'Sanatçının hikâyesi.',image:'',href:''},audio:{title:'Bir parça dinle',src:'',cover:''},events:{title:'Yaklaşan etkinlikler',items:[]},countdown:{title:'Yeni edisyon yakında',date:'',done:'Şimdi yayında',href:'/store'},gallery:{title:'Galeri',layout:'grid',items:[]},shared:{key:''},discography:{title:'Diskografi',imprint:'all',limit:'6'},tracklist:{title:'Tracklist',items:[]},tabs:{title:'Keşfet',items:[]},timeline:{title:'Release timeline',items:[]},merch:{title:'Merchandise',limit:'6',imprint:'all'}}[type]||{};}
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
  if(type==='discography'){
    if(!['all','sideii','lethargia'].includes(props.imprint)||!/^(?:[1-9]|1[0-9]|2[0-4])$/.test(props.limit))fail();
  }
  if(type==='tracklist'){
    if(!Array.isArray(props.items)||props.items.length>30)fail();
    props.items=props.items.map(item=>{
      if(!item||typeof item!=='object')fail();
      string(item.title,200);string(item.duration,20);url(item.src);
      return {title:item.title,duration:item.duration,src:item.src};
    });
  }
  if(type==='tabs'){
    if(!Array.isArray(props.items)||props.items.length>8)fail();
    props.items=props.items.map(item=>{
      if(!item||typeof item!=='object')fail();
      string(item.label,90);string(item.text,2500);
      return {label:item.label,text:item.text};
    });
  }
  if(type==='merch'&&(!['all','sideii','lethargia'].includes(props.imprint)||!/^(?:[1-9]|1[0-9]|2[0-4])$/.test(props.limit)))fail();
  if(type==='timeline'){
    if(!Array.isArray(props.items)||props.items.length>24)fail();
    props.items=props.items.map(item=>{if(!item||typeof item!=='object')fail();string(item.title,200);string(item.year,20);string(item.text,1200);url(item.href);return {title:item.title,year:item.year,text:item.text,href:item.href};});
  }
  if(type==='events'){
    if(!Array.isArray(props.items)||props.items.length>30)fail();
    props.items=props.items.map(i=>{if(!i||typeof i!=='object')fail();string(i.title,200);string(i.location,200);url(i.href);if(i.date&&!validDate(i.date))fail();return {title:i.title,location:i.location,href:i.href,date:i.date};});
  }
  return props;
}
