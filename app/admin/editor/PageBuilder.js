'use client';
import {useEffect, useReducer, useRef, useState} from 'react';
import {supabase} from '../../lib/supabase';
import {CONTAINERS, WIDGETS, NATIVE_SLOTS, SLOT_LABELS, createNode, cloneNodeTree, findNode, findLocation, insertNode, moveNode, removeNode, duplicateNode, updateNode, validateDocument, pagePath, flattenNodes} from '../../lib/page-builder';
import {starterDocument, sectionTemplate, homeSectionNode} from '../../lib/page-builder-templates';
import {HOME_SECTIONS} from '../../lib/home-sections';
import {api} from './builder-api';
import SiteSettings from './SiteSettings';
import PublicationPanel from './PublicationPanel';
import MediaLibrary from './MediaLibrary';
import SiteDesignProvider from '../../components/builder/SiteDesignProvider';
import {defaultSiteSettings} from '../../lib/builder-design';
import {publicationDiff} from '../../lib/builder-publication';
import CanvasFrame from './CanvasFrame';
import PageCanvas from '../../components/builder/PageCanvas';
import Inspector, {BufferedField} from './Inspector';
import useAdminDialog from '../useAdminDialog';
import './editor.css';

const DEFAULT_PAGES = [{page_key:'site',title:'Ortak tasarım ve menüler'},{page_key:'home',title:'Ana sayfa'},{page_key:'store',title:'Mağaza'},{page_key:'product',title:'Ürün şablonu'}];
const MIME = 'application/x-sideii-builder';
const messages = {schedule:'Yayın planlandı.',cancel_schedule:'Yayın planı iptal edildi.',save: 'Taslak kaydedildi.', publish: 'Sayfa yayımlandı.', unpublish: 'Yayın kaldırıldı. Mevcut site şablonu devrede.', restore: 'Önceki sürüm taslak olarak geri yüklendi.'};
function historyReducer(state, action) {
  if (action.type === 'reset') return {past: [], present: action.document, future: []};
  if (action.type === 'undo' && state.past.length) return {past: state.past.slice(0,-1), present: state.past.at(-1), future: [state.present, ...state.future]};
  if (action.type === 'redo' && state.future.length) return {past: [...state.past, state.present], present: state.future[0], future: state.future.slice(1)};
  if (action.type === 'change') return {past: [...state.past, state.present].slice(-60), present: action.document, future: []};
  return state;
}
function Modal({title, children, onClose, wide = false}) {
  const ref = useAdminDialog(true, onClose);
  return <div className="beModalBackdrop" onMouseDown={event => {if(event.target === event.currentTarget) onClose();}}><section ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className={'beModal' + (wide ? ' beModalWide' : '')}><header><h2>{title}</h2><button onClick={onClose} aria-label="Pencereyi kapat">×</button></header>{children}</section></div>;
}
export default function PageBuilder({products = [], slots = {}, homeData = {}}) {
  const [history, dispatch] = useReducer(historyReducer, null, () => ({past: [], present: starterDocument('home'), future: []}));
  const document = history.present;
  const [key, setKey] = useState('home'), [title, setTitle] = useState('Ana sayfa'), [pages, setPages] = useState(DEFAULT_PAGES);
  const [version, setVersion] = useState(0), [publishedVersion, setPublishedVersion] = useState(null), [saved, setSaved] = useState('');
  const [selectedId, setSelected] = useState(null), [device, setDevice] = useState('desktop'), [panel, setPanel] = useState('blocks'), [leftOpen,setLeftOpen] = useState(true), [rightOpen,setRightOpen] = useState(true);
  const [preview, setPreview] = useState(false), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [failed, setFailed] = useState(false);
  const [notice, setNotice] = useState(''), [error, setError] = useState(''), [confirm, setConfirm] = useState(null), [revisions,setRevisions] = useState([]);
  const [asset,setAsset]=useState(null),[assetLoading,setAssetLoading]=useState(false);
  const [blocks,setBlocks]=useState([]),[blockSave,setBlockSave]=useState(false),[blockName,setBlockName]=useState('');
  const [publishedDocument,setPublishedDocument]=useState(null),[publishedTitle,setPublishedTitle]=useState(null),[pendingSchedule,setPendingSchedule]=useState(null),[sharedDocuments,setSharedDocuments]=useState({}),[liveSite,setLiveSite]=useState(defaultSiteSettings()),[rightMode,setRightMode]=useState('settings'),[dragging,setDragging]=useState(false);
  const sitePreview=key==='site'?document.site:liveSite;
  const [focusField, setFocusField] = useState(null);
  const [styleClipboard, setStyleClipboard] = useState(null);
  const [blockQuery,setBlockQuery] = useState('');
  const blockSearchRef = useRef(null);
  const availableBlocks = Object.entries(WIDGETS).filter(([type,meta]) =>
    !['native','siteSection',...(key.startsWith('block:')?['shared']:[])].includes(type) &&
    (meta.label+' '+type).toLocaleLowerCase('tr').includes(blockQuery.trim().toLocaleLowerCase('tr'))
  );
  const [stageWidth,setStageWidth]=useState(900),[fit,setFit]=useState(true);
  const [newPage,setNewPage] = useState(false), [newSlug,setNewSlug] = useState(''), [newTitle,setNewTitle] = useState('');
  const [recovery,setRecovery] = useState(null), [userId,setUserId] = useState(''), [insertAt,setInsertAt] = useState(null);
  const importRef = useRef(null), canvasRef = useRef(null), liveRef = useRef(null), operationRef = useRef(false), loadSequence = useRef(0), dragRef = useRef(null);
  const signature = JSON.stringify({title, document}), dirty = saved !== '' && signature !== saved;
  const selected = findNode(document, selectedId);
  liveRef.current = {key,title,document,version,dirty,userId};
  const localKey = (pageKey, id = userId) => 'sideii:builder:v1:' + id + ':' + pageKey;
  const persistRecovery = () => {const value=liveRef.current;if(!value.dirty||!value.userId)return;try{localStorage.setItem(localKey(value.key,value.userId),JSON.stringify({...value,signature:JSON.stringify({title:value.title,document:value.document}),time:Date.now()}));}catch{}};
  const clearRecovery = (pageKey, id = userId) => {try {localStorage.removeItem(localKey(pageKey,id));} catch {}};
  const accept = (data, pageKey) => {
    const doc = validateDocument(data.page.draft_document, pageKey);
    setPublishedDocument(data.publishedDocument||null);setPublishedTitle(data.publishedTitle||null);setPendingSchedule(data.pendingSchedule||null);setSharedDocuments(data.sharedDocuments||{});if(pageKey==='site')setLiveSite(data.publishedDocument?.site||defaultSiteSettings());
    dispatch({type:'reset',document:doc}); setKey(pageKey); setTitle(data.page.title); setVersion(Number(data.page.version)); setPublishedVersion(data.publishedVersion); setSelected(null); setInsertAt(null);
    setSaved(JSON.stringify({title:data.page.title,document:doc})); if (data.userId) setUserId(data.userId);
  };
  const load = async pageKey => {
    if (operationRef.current) return;
    persistRecovery();
    operationRef.current = true; const request = ++loadSequence.current;
    setLoading(true); setError(''); setNotice(''); setFailed(false); setRecovery(null);
    try {
      const [data,list,site]=await Promise.all([api('?key='+encodeURIComponent(pageKey)),api(),pageKey==='site'?Promise.resolve(null):api('?key=site')]);
      if(site)setLiveSite(site.publishedDocument?.site||defaultSiteSettings());
      if (request !== loadSequence.current) return;
      accept(data,pageKey);
      setPages([...DEFAULT_PAGES.map(p => list.pages.find(row => row.page_key === p.page_key) || p), ...list.pages.filter(p => /^(page|block):/.test(p.page_key))]);
      historyReplace(pageKey);
      api('/blocks').then(result=>setBlocks(result.blocks)).catch(()=>{});
      try {const recovered = JSON.parse(localStorage.getItem(localKey(pageKey,data.userId)) || 'null'); if (recovered && recovered.signature !== JSON.stringify({title:data.page.title,document:data.page.draft_document})) setRecovery(recovered);} catch {}
    } catch (failure) {setFailed(true); setError(failure.message);}
    finally {if(request === loadSequence.current) {setLoading(false);operationRef.current=false;}}
  };
  function historyReplace(pageKey) {window.history.replaceState(null,'','/admin/editor?page=' + encodeURIComponent(pageKey));}
  useEffect(() => {const initial = new URLSearchParams(window.location.search).get('page'); load(initial || 'home'); documentBody(true); return () => {documentBody(false);};}, []);
  useEffect(() => {const narrow = window.matchMedia('(max-width: 1000px)'); const update = () => {setLeftOpen(!narrow.matches);setRightOpen(!narrow.matches);};update();narrow.addEventListener('change',update);return()=>narrow.removeEventListener('change',update);}, []);
  useEffect(()=>{if(!canvasRef.current)return;const observer=new ResizeObserver(entries=>setStageWidth(entries[0].contentRect.width));observer.observe(canvasRef.current);return()=>observer.disconnect();},[]);
  function documentBody(active) {window.document.body.classList.toggle('sideii-builder-page',active);}
  useEffect(() => {
    if (!dirty || !userId || loading || recovery) return;
    const timer = setTimeout(() => {try {localStorage.setItem(localKey(key),JSON.stringify({title,document,version,signature,time:Date.now()}));} catch {setNotice('Tarayıcı yedeği yazılamadı. Taslağı kaydet veya JSON olarak dışa aktar.');}},500);
    return () => clearTimeout(timer);
  },[signature,dirty,key,userId,loading,recovery]);
  useEffect(() => {
    const beforeUnload = event => {if(liveRef.current.dirty) {persistRecovery();event.preventDefault();event.returnValue='';}};
    window.addEventListener('beforeunload',beforeUnload);return()=>window.removeEventListener('beforeunload',beforeUnload);
  },[]);
  const change = next => {
    if (operationRef.current || loading || failed) return;
    try {dispatch({type:'change',document:validateDocument(next,key)});setError('');setNotice('');} catch(failure) {setError(failure.message);}
  };
  const save = async (action = 'save', extra = {}) => {
    if (operationRef.current || loading || failed) return;
    operationRef.current = true; setBusy(true); setError(''); setNotice('');
    const snapshot = liveRef.current;
    try {
      if(action !== 'restore') validateDocument(snapshot.document,snapshot.key,{publishing:['publish','schedule'].includes(action)});
      const result = await api('',{key:snapshot.key,title:snapshot.title,document:snapshot.document,expectedVersion:snapshot.version,action,...extra});
      accept(result,snapshot.key); clearRecovery(snapshot.key); setRecovery(null); setNotice(action==='unpublish'&&snapshot.key.startsWith('page:')?'Yayın kaldırıldı. Sayfa ziyaretçilere kapatıldı.':messages[action]);
      setPages(current => {const entry={page_key:snapshot.key,title:result.page.title};return current.some(p=>p.page_key===snapshot.key)?current.map(p=>p.page_key===snapshot.key?entry:p):[...current,entry];});
      if(panel==='history') api('?key='+encodeURIComponent(snapshot.key)+'&history=1').then(list=>setRevisions(list.revisions)).catch(()=>setNotice(messages[action]+' Geçmişi yenilemek için tekrar aç.'));
    } catch(failure) {setError(failure.message); if(failure.status===409) setNotice('Yerel değişikliklerin korunuyor. JSON dışa aktar seçeneğini kullanabilirsin.');}
    finally {operationRef.current=false;setBusy(false);}
  };
  const onKey = event => {
    if(loading || busy || failed || confirm || asset || newPage || blockSave) return;
    const typing = /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable;
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s') {event.preventDefault();event.target.blur?.();setTimeout(()=>save(),0);}
    if(!typing&&(event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z') {event.preventDefault();dispatch({type:event.shiftKey?'redo':'undo'});}
    if(!typing&&(event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='y') {event.preventDefault();dispatch({type:'redo'});}
    if(!typing&&(event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k' && key!=='site') {
      event.preventDefault();setPreview(false);setLeftOpen(true);setPanel('blocks');
      requestAnimationFrame(()=>blockSearchRef.current?.focus());return;
    }
    if(event.key==='Escape') {
      if(event.target===blockSearchRef.current && blockQuery){setBlockQuery('');return;}
      setSelected(null);setPreview(false);
    }
  };
  const showSelectedLayer = () => {
    if(!selectedId)return;
    setPreview(false);setLeftOpen(true);setPanel('layers');
    if(window.innerWidth<=1000)setRightOpen(false);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const el=document.querySelector('.beLayer.selected');
      el?.scrollIntoView({block:'nearest',behavior:'smooth'});
      el?.querySelector('button')?.focus({preventScroll:true});
    }));
  };
  const showSelectedSettings = () => {
    if(!selectedId)return;
    setPreview(false);setRightMode('settings');setRightOpen(true);
    if(window.innerWidth<=1000)setLeftOpen(false);
  };
  const select = (id, field) => {setSelected(id);setRightMode('settings');setFocusField(field ? {key:field} : null);setRightOpen(true);if(window.innerWidth<=1000)setLeftOpen(false);setInsertAt(null);};
  const add = node => {
    try {
      let parentId = null,index=null;
      if(insertAt) ({parentId,index}=insertAt);
      else if(selected && CONTAINERS.has(selected.type)) parentId=selected.id;
      else if(selected) {const location=findLocation(document,selected.id);parentId=location.parentId;index=location.index+1;}
      change(insertNode(document,node,parentId,index));select(node.id);
    } catch(failure) {setError(failure.message);}
  };
  const beginDrag = (event,payload) => {setDragging(true);dragRef.current=payload;event.dataTransfer.setData(MIME,JSON.stringify(payload));event.dataTransfer.effectAllowed=payload.id?'move':'copy';};
  const onDrop = (event,parentId,index) => {
    try {
      const raw=event.dataTransfer.getData(MIME); if(!raw) return;
      const payload=JSON.parse(raw);
      if(payload.id) change(moveNode(document,payload.id,parentId,index));
      else {const node=payload.homeSection?cloneNodeTree(homeSectionNode(payload.homeSection)):payload.template?sectionTemplate(payload.template):createNode(payload.type,payload.slot?{props:{slot:payload.slot}}:{});change(insertNode(document,node,parentId,index));setSelected(node.id);}
    } catch(failure) {setError(failure.message);}
    dragRef.current=null;setDragging(false);
  };
  const moveSelection = direction => {try {const location=findLocation(document,selectedId);if(location) change(moveNode(document,selectedId,location.parentId,Math.max(0,location.index+(direction>0?2:-1))));}catch(failure){setError(failure.message);}};
  const copyStyle = () => {
    if (!selected) return;
    setStyleClipboard({name:selected.name,style:{...selected.style},tablet:{...selected.tablet},mobile:{...selected.mobile}});
    setNotice('Stil kopyalandı. Başka bir bileşende Stili yapıştır kullanabilirsin.');
  };
  const pasteStyle = () => {
    if (!selected || !styleClipboard || busy || loading || failed) return;
    change(updateNode(document,selectedId,{style:{...styleClipboard.style},tablet:{...styleClipboard.tablet},mobile:{...styleClipboard.mobile}}));
    setNotice('Stil üç cihaz ayarıyla uygulandı. Geri al ile önceki stile dönebilirsin.');
  };
  const switchPage = target => {if(target===key)return;dirty?setConfirm({title:'Kaydedilmemiş değişiklikler',text:'Bu sayfanın değişiklikleri tarayıcı yedeğinde kalacak. Diğer sayfaya geçilsin mi?',button:'Sayfaya geç',run:()=>load(target)}):load(target);};
  const exportJson = () => {
    const blob = new Blob([JSON.stringify({pageKey:key,title,document},null,2)],{type:'application/json'}), url=URL.createObjectURL(blob), link=window.document.createElement('a');
    link.href=url;link.download='sideii-'+key.replace(':','-')+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const importJson = async event => {const file=event.target.files?.[0];event.target.value='';if(!file)return;try {if(file.size>450000)throw new Error('Dosya çok büyük.');const data=JSON.parse(await file.text());const doc=validateDocument(data.document||data,key);setConfirm({title:'Sayfayı içe aktar',text:'Mevcut taslağın yerini bu dosya alacak. Geri al ile önceki haline dönebilirsin.',button:'İçe aktar',run:()=>change(doc)});}catch(failure){setError(failure.message);}};
  const openHistory = async () => {setPanel('history');setError('');try{const result=await api('?key='+encodeURIComponent(key)+'&history=1');setRevisions(result.revisions);}catch(failure){setError(failure.message);}};
  const openAssets = prop => setAsset({nodeId:selectedId,prop});
  const useAsset = url => {
    const current=liveRef.current.document;
    if(asset.prop==='seo.image')change({...current,seo:{...current.seo,image:url}});
    else if(asset.prop.startsWith('site.')){const [,section,field]=asset.prop.split('.');change({...current,site:{...current.site,[section]:{...current.site[section],[field]:url}}});}
    else {const target=findNode(current,asset.nodeId);if(target){const props={...target.props};if(asset.prop.startsWith('gallery:'))props.items=props.items.map((x,i)=>i===Number(asset.prop.split(':')[1])?{...x,src:url}:x);else props[asset.prop]=url;change(updateNode(current,target.id,{props}));}}
    setAsset(null);
  };
  const updateSelected=update=>{
    change(updateNode(document,selectedId,update));
    if(selected?.type==='shared'&&update.props?.key)api('?key='+encodeURIComponent(update.props.key)).then(data=>{if(data.publishedDocument)setSharedDocuments(old=>({...old,[update.props.key]:data.publishedDocument}));else setError('Ortak bölümü önce yayımla.');}).catch(e=>setError(e.message));
  };
  const createShared=async()=>{
    if(!selected||operationRef.current)return;
    const blockKey='block:'+crypto.randomUUID();let doc;
    try{doc=validateDocument({schemaVersion:1,theme:{},children:[cloneNodeTree(selected)]},blockKey);}catch(e){setError(e.message);return;}
    persistRecovery();operationRef.current=true;setBusy(true);setError('');
    try{const result=await api('',{key:blockKey,title:selected.name,document:doc,expectedVersion:0,action:'save'});accept(result,blockKey);setPages(old=>[...old,{page_key:blockKey,title:result.page.title}]);historyReplace(blockKey);setNotice('Ortak bölüm taslağı oluşturuldu. Yayımladıktan sonra diğer sayfalara Ortak bölüm bileşeniyle ekleyebilirsin.');}
    catch(e){setError(e.message);}finally{operationRef.current=false;setBusy(false);}
  };
  const publishConfirm=()=>setConfirm({title:'Sayfayı yayımla',text:title+' ziyaretçilere gösterilecek.',diff:publicationDiff(publishedDocument,document),button:'Yayımla',run:()=>save('publish')});
  const createPage = () => {
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(newSlug)||newSlug.length>80||!newTitle.trim()) {setError('Sayfa adı ve küçük harf/rakam/tire içeren bir adres gir.');return;}
    const pageKey='page:'+newSlug;
    if(pages.some(p=>p.page_key===pageKey)){setError('Bu adres zaten var.');return;}
    const proceed=()=>{persistRecovery();setNewPage(false);setPages(current=>[...current,{page_key:pageKey,title:newTitle.trim()}]);accept({page:{title:newTitle.trim(),version:0,draft_document:starterDocument(pageKey)},publishedVersion:null},pageKey);setSaved('new');historyReplace(pageKey);setNewSlug('');setNewTitle('');};
    dirty?setConfirm({title:'Yeni sayfaya geç',text:'Kaydedilmemiş mevcut sayfa değişiklikleri tarayıcı yedeğinde kalacak.',button:'Yeni sayfayı aç',run:proceed}):proceed();
  };
  const saveBlock=async()=>{if(!selected)return;setBusy(true);setError('');try{const result=await api('/blocks',{name:blockName,node:selected});setBlocks(current=>[result.block,...current]);setBlockSave(false);setNotice('Bölüm şablonu arşive kaydedildi.');}catch(failure){setError(failure.message);}finally{setBusy(false);}};
  const frameWidth=device==='desktop'?1200:device==='tablet'?820:390;
  const frameHeight=device==='mobile'?844:device==='tablet'?1024:900;
  const frameZoom=fit?Math.min(1,Math.max(.2,stageWidth/frameWidth)):1;
  const layerTree=(children,depth=0)=>children.map((node,index)=><div key={node.id} className="beLayerGroup"><div className={'beLayer'+(selectedId===node.id?' selected':'')} style={{paddingLeft:10+depth*12}} draggable onDragStart={event=>beginDrag(event,{id:node.id})} onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();event.stopPropagation();const location=findLocation(document,node.id);onDrop(event,location.parentId,index);}}><button aria-label={node.name} onClick={()=>select(node.id)} title={node.name}><span>{WIDGETS[node.type].icon}</span>{node.name}</button>{CONTAINERS.has(node.type)&&<button aria-label={node.name+' içine taşı'} title="Sürüklenen bileşeni içine bırak" className="beLayerInto" onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();event.stopPropagation();onDrop(event,node.id,node.children.length);}} onClick={()=>{setSelected(node.id);setInsertAt({parentId:node.id,index:node.children.length});setPanel('blocks');}}>＋</button>}</div>{layerTree(node.children,depth+1)}</div>);
  return <SiteDesignProvider settings={sitePreview}><main className={'beApp'+(busy?' beBusy':'')} lang="tr" onKeyDown={onKey} onDragEnd={()=>setDragging(false)}>
    <header className="beTopbar"><a className="beBrand" href="/admin" onClick={event=>{if(dirty){event.preventDefault();setConfirm({title:'Editörden çık',text:'Kaydedilmemiş değişiklikler tarayıcı yedeğinde kalacak.',button:'Admin paneline dön',run:()=>{persistRecovery();window.location.href='/admin';}});}}}>SIDE:II <span>STUDIO</span></a><div className="bePageSelect"><select aria-label="Düzenlenen sayfa" disabled={busy||loading} value={key} onChange={event=>switchPage(event.target.value)}>{pages.map(page=><option key={page.page_key} value={page.page_key}>{page.title}</option>)}</select><button title="Yeni sayfa" disabled={busy||loading||failed} onClick={()=>setNewPage(true)}>＋</button></div><div className="beViewports" aria-label="Önizleme boyutu">{[['desktop','Masaüstü'],['tablet','Tablet'],['mobile','Mobil']].map(([id,label])=><button key={id} aria-pressed={device===id} onClick={()=>setDevice(id)}>{label}</button>)}</div><div className="beTopActions"><button onClick={()=>{setRightMode(v=>v==='publication'?'settings':'publication');setRightOpen(true);setPreview(false);}}>Yayın ve SEO</button><button aria-label="Geri al" disabled={!history.past.length||busy||loading} onClick={()=>dispatch({type:'undo'})}>↶</button><button aria-label="İleri al" disabled={!history.future.length||busy||loading} onClick={()=>dispatch({type:'redo'})}>↷</button><button aria-pressed={preview} onClick={()=>setPreview(value=>!value)}>{preview?'Düzenle':'Önizle'}</button><button disabled={busy||loading||failed} onClick={()=>save()}>Taslağı kaydet</button><button className="bePublish" disabled={busy||loading||failed} onClick={publishConfirm}>{busy?'İşleniyor…':'Yayımla ↗'}</button></div></header>
{!preview&&selected&&key!=='site'&&<div className="beSelectionBar" role="region" aria-label="Seçili bileşen hızlı işlemleri"><span title={selected.name}><b>{WIDGETS[selected.type]?.icon||'▣'}</b> {selected.name}</span><div><button type="button" onClick={showSelectedLayer}>Katmanda göster</button><button type="button" onClick={showSelectedSettings}>Ayarları aç</button><button type="button" aria-label="Seçimi kaldır" onClick={()=>setSelected(null)}>×</button></div></div>}
    <div className="beStatusbar"><div><span className={'beStatusDot '+(dirty?'dirty':'')}/>{loading?'Yükleniyor…':dirty?'Kaydedilmemiş değişiklikler':version?'Taslak v'+version:'Başlangıç şablonu'}<span>·</span>{publishedVersion?'Yayında v'+publishedVersion:'Özel taslak'}</div><div><button onClick={()=>{setLeftOpen(value=>!value);if(window.innerWidth<=1000)setRightOpen(false);if(preview)setPreview(false);}}>Bileşenler</button><button onClick={()=>{setRightOpen(value=>!value);if(window.innerWidth<=1000)setLeftOpen(false);if(preview)setPreview(false);}}>Ayarlar</button>{key.startsWith('page:') && !publishedVersion
      ? <button type="button" aria-pressed={preview} disabled={loading||failed} title="Bu sayfa yalnızca taslak olarak kayıtlı. Herkese açık adresi yayınlanana kadar açılmaz." onClick={()=>setPreview(value=>!value)}>{preview?'Düzenlemeye dön':'Taslağı önizle ↗'}</button>
      : <a href={key==='site'?'/':pagePath(key)} target="_blank" rel="noreferrer">Siteyi aç ↗</a>}</div></div>
    {(error||notice)&&<div className={'beMessage '+(error?'isError':'')} role={error?'alert':'status'}>{error||notice}{error&&<button onClick={()=>{setError('');setNotice('');}} aria-label="Bildirimi kapat">×</button>}</div>}
    {recovery&&<div className="beRecovery" role="status"><span>Bu tarayıcıda kaydedilmemiş bir çalışma var{recovery.version!==version?' · sunucu sürümü de değişmiş':''}.</span><button onClick={()=>{try{change(validateDocument(recovery.document,key));setTitle(recovery.title);setRecovery(null);}catch(failure){setError(failure.message);}}}>Çalışmayı kurtar</button><button onClick={()=>{clearRecovery(key);setRecovery(null);}}>Sunucu sürümünü kullan</button></div>}
    <div className={'beWorkspace '+(preview?'isPreview ':'')+(!leftOpen?'leftClosed ':'')+(!rightOpen?'rightClosed':'')}>
      {!preview&&leftOpen&&<aside className="beLibrary" aria-label="Bileşen kütüphanesi"><div className="beTabs"><button aria-pressed={panel==='blocks'} onClick={()=>setPanel('blocks')}>Ekle</button><button aria-pressed={panel==='layers'} onClick={()=>setPanel('layers')}>Katmanlar</button><button aria-pressed={panel==='history'} onClick={openHistory}>Geçmiş</button></div>
        {panel==='blocks'&&key!=='site'&&<div className="beLibraryBody"><span className="beEyebrow">YERLEŞTİR VE ŞEKİLLENDİR</span><h1>Senin alanın.</h1><p>{insertAt?'Seçtiğin aralığa eklenecek.':'Bir bileşeni sürükle veya eklemek için tıkla.'}</p><label className="beBlockSearch"><span>BİLEŞEN ARA <kbd>Ctrl K</kbd></span><input ref={blockSearchRef} type="search" aria-label="Bileşen ara" placeholder="Albüm, galeri, buton…" value={blockQuery} onChange={event=>setBlockQuery(event.target.value)} autoComplete="off"/></label><div className="beBlockSearchCount" role="status">{availableBlocks.length} bileşen{blockQuery?' bulundu':''}</div><div className="beBlocks">{availableBlocks.map(([type,meta])=><button key={type} aria-label={meta.label} draggable disabled={loading||failed||busy} onDragStart={event=>beginDrag(event,{type})} onClick={()=>add(createNode(type))}><b>{meta.icon}</b><span>{meta.label}</span></button>)}</div>{availableBlocks.length===0&&<p className="beBlockSearchEmpty">Eşleşen bileşen bulunamadı. Başka bir kelime dene.</p>}{!blockQuery&&(NATIVE_SLOTS[key]||[]).length>0&&<><h3>Mağaza bileşenleri</h3><div className="beNativeBlocks">{NATIVE_SLOTS[key].map(slot=><button key={slot} disabled={flattenNodes(document).some(n=>n.type==='native'&&n.props.slot===slot)} draggable onDragStart={event=>beginDrag(event,{type:'native',slot})} onClick={()=>add(createNode('native',{props:{slot},name:SLOT_LABELS[slot]}))}>{SLOT_LABELS[slot]} ＋</button>)}</div></>}{!blockQuery&&blocks.length>0&&<><h3>Bölüm şablonların</h3>{blocks.map(block=><button className="beTemplate" key={block.id} onClick={()=>{try{const data=validateDocument(block.document,'page:snippet');add(cloneNodeTree(data.children[0]));}catch(failure){setError(failure.message);}}}>{block.name} ＋</button>)}</>}{!blockQuery&&<><h3>Sitenin özgün bölümleri</h3>{Object.entries(HOME_SECTIONS).map(([section,meta])=><button className="beTemplate" key={section} draggable onDragStart={event=>beginDrag(event,{homeSection:section})} onClick={()=>add(cloneNodeTree(homeSectionNode(section)))}><span>{meta.label}</span>＋</button>)}<h3>Hazır bölümler</h3>{[['hero','Karşılama'],['split','Görsel + metin'],['cta','Çağrı alanı'],['faq','Sık sorulanlar'],['products','Ürün vitrini']].map(([id,label])=><button className="beTemplate" key={id} draggable onDragStart={event=>beginDrag(event,{template:id})} onClick={()=>add(sectionTemplate(id))}><span>{label}</span>↗</button>)}</>}</div>}
        {key==='site'&&<div className="beLibraryBody"><h1>Ortak tasarım.</h1><p>Fontları, renkleri, üst menüyü ve alt alanı sağ panelden düzenle. Değişiklikleri tuvalde inceleyip yayımla.</p></div>}{panel==='layers'&&key!=='site'&&<div className="beLayers"><button className="beRootLayer" onClick={()=>{setSelected(null);setInsertAt({parentId:null,index:document.children.length});}}>SAYFA · {flattenNodes(document).length} BİLEŞEN</button>{layerTree(document.children)}<div className="beHint">Katman üstüne bırakarak önüne taşı; ＋ alanına bırakarak içine taşı. Seçili katmanı oklarla da taşıyabilirsin.</div></div>}
        {panel==='history'&&<div className="beLibraryBody"><h2>Sürüm geçmişi</h2><p>Son 50 kayıt. Geri yükleme taslağı değiştirir; yayına almak için ayrıca Yayımla kullanılır.</p>{revisions.length===0?<p>Henüz kayıt yok.</p>:revisions.map(revision=><button className="beRevision" key={revision.id} onClick={()=>setConfirm({title:'Sürümü geri yükle',text:'v'+revision.version+' taslak olarak geri yüklenecek. Mevcut çalışma önce dışa aktarılabilir.',button:'Taslağa geri yükle',run:()=>save('restore',{revisionId:Number(revision.id)})})}><b>v{revision.version} · {revision.action}</b><span>{new Date(revision.created_at).toLocaleString('tr-TR')}</span></button>)}</div>}
        <div className="beLibraryFoot"><button onClick={exportJson}>JSON dışa aktar</button><button disabled={busy||loading||failed} onClick={()=>importRef.current?.click()}>İçe aktar</button><input hidden ref={importRef} type="file" accept="application/json,.json" onChange={importJson}/></div>
      </aside>}
      <section className="beStage" ref={canvasRef} aria-label="Sayfa tuvali"><div className="beStageLabel"><span>{preview?'ÖNİZLEME':'CANLI TUVAL'} / {device==='desktop'?'1200':device==='tablet'?'820':'390'} PX</span><div><button onClick={()=>setFit(value=>!value)}>{fit?'Sığdır · %'+Math.round(frameZoom*100):'%100'}</button> <button onClick={()=>{setSelected(null);setRightOpen(true);if(window.innerWidth<=1000)setLeftOpen(false);}}>Sayfa teması</button></div></div>{loading?<div className="beLoading">Sayfa yükleniyor…</div>:failed?<div className="beLoading"><h2>Sayfa yüklenemedi.</h2><p>Bağlantı kurulmadan kayıt yapılamaz.</p><button onClick={()=>load(key)}>Tekrar dene</button></div>:<div className="beCanvasViewport" style={{width:frameWidth*frameZoom,height:frameHeight*frameZoom}}><div className={'beCanvasFrame '+device} style={{width:frameWidth,maxWidth:'none',transform:'scale('+frameZoom+')'}} onClick={()=>setSelected(null)}><CanvasFrame height={frameHeight}><SiteDesignProvider settings={sitePreview} preview><PageCanvas pageKey={key==='site'?'home':key} homeData={homeData} document={key==='site'?starterDocument('home'):document} sharedDocuments={sharedDocuments} device={device} dragging={dragging} onInlineCommit={(id,field,value,runs)=>{const doc=liveRef.current.document,node=findNode(doc,id);if(node)change(updateNode(doc,id,{props:{...node.props,[field]:value},richText:{...node.richText,[field]:runs}}));}} onResize={(id,patch)=>{const doc=liveRef.current.document,node=findNode(doc,id),styleKey=device==='desktop'?'style':device;if(node)change(updateNode(doc,id,{[styleKey]:{...node[styleKey],...patch}}));}} products={products} slots={slots} editing={!preview&&key!=='site'} previewOnly selectedId={selectedId} onSelect={select} onDropNode={onDrop} onDragNode={(event,id)=>beginDrag(event,{id})} onInsertAt={(parentId,index)=>{setInsertAt({parentId,index});setLeftOpen(true);setPanel('blocks');}}/></SiteDesignProvider></CanvasFrame></div></div>}</section>
      {!preview&&rightOpen&&<aside className="beInspector" aria-label="Bileşen ayarları"><div className="bePageName"><BufferedField label="Sayfa adı" value={title} maxLength={120} onCommit={value=>{if(!busy)setTitle(value);}}/></div>{rightMode==='publication'?<PublicationPanel document={document} title={title} publishedDocument={publishedDocument} publishedTitle={publishedTitle} pending={pendingSchedule} busy={busy} onChange={change} onAsset={openAssets} onSave={save} onPublish={publishConfirm}/>:key==='site'?<SiteSettings site={document.site} onChange={site=>change({...document,site})} onAsset={openAssets} onError={setError}/>:<>{selected&&<div className="beNodeActions"><button aria-label="Bileşeni yukarı taşı" onClick={()=>moveSelection(-1)}>↑</button><button aria-label="Bileşeni aşağı taşı" onClick={()=>moveSelection(1)}>↓</button><button onClick={()=>{try{change(duplicateNode(document,selectedId));}catch(failure){setError(failure.message);}}}>Çoğalt</button><button onClick={()=>setConfirm({title:'Bileşeni sil',text:selected.name+' ve içeriği kaldırılacak. Geri al ile kurtarabilirsin.',button:'Sil',run:()=>{change(removeNode(document,selectedId));setSelected(null);}})}>Sil</button></div>}{selected&&<div className="beStyleActions"><button type="button" disabled={busy||loading||failed} title="Masaüstü, tablet ve mobil stillerini birlikte kopyala" onClick={copyStyle}>Stili kopyala</button><button type="button" disabled={!styleClipboard||busy||loading||failed} title={styleClipboard?styleClipboard.name+' stilini üç cihaz için uygula':'Önce bir bileşenin stilini kopyala'} onClick={pasteStyle}>Stili yapıştır</button></div>}{selected&&selected.type!=='native'&&<button className="beSaveBlock" onClick={()=>{setBlockName(selected.name);setBlockSave(true);}}>Bölümü şablon olarak kaydet</button>}{selected&&!key.startsWith('block:')&&selected.type!=='native'&&<button className="beSaveBlock" disabled={busy} onClick={createShared}>Ortak bölüm olarak kaydet</button>}<Inspector products={products} pages={pages} onOpenShared={switchPage} key={selectedId||'theme'} node={selected} document={document} device={device} focusField={focusField} onUpdate={updateSelected} onTheme={theme=>change({...document,theme})} onAsset={openAssets} onError={setError}/></>}<div className="beInspectorFoot">{key==='home'&&!flattenNodes(document).some(node=>node.type==='siteSection')&&<p className="beHint">Bu taslak önceki şablonu kullanıyor. Özgün ana sayfayla başlamak için gerçek site düzenini yükleyebilirsin. Taslağını önce JSON olarak dışa aktarabilirsin.</p>}<button onClick={()=>setConfirm({title:key==='home'?'Gerçek site düzenini yükle':'Başlangıç şablonunu yükle',text:'Taslak başlangıç düzeniyle değişecek. Geri al kullanılabilir; yayındaki sayfa etkilenmez.',button:'Şablonu yükle',run:()=>{change(starterDocument(key));setSelected(null);}})}>{key==='home'?'Gerçek site düzenini yükle':'Başlangıç şablonu'}</button>{publishedVersion&&<button onClick={()=>setConfirm({title:'Yayını kaldır',text:key.startsWith('page:')?'Bu sayfa ziyaretçilere kapanacak. Taslak korunur.':'Site bu sayfa için önceki yerleşik tasarımı kullanacak. Taslak korunur.',button:'Yayını kaldır',run:()=>save('unpublish')})}>Yayını kaldır</button>}</div></aside>}
    </div>
    <footer className="beBottom"><span>SIDE:II / VISUAL STUDIO</span><span>Ctrl / ⌘ S · Kaydet &nbsp; Ctrl / ⌘ Z · Geri al</span><span>{dirty?'TARAYICI YEDEĞİ AÇIK':'DRAFT → PREVIEW → PUBLISH'}</span></footer>
    {confirm&&<Modal title={confirm.title} onClose={()=>setConfirm(null)}><p>{confirm.text}</p>{confirm.diff&&<ul className="bePublicationDiff">{confirm.diff.map((line,i)=><li key={i}>{line}</li>)}</ul>}<div className="beModalActions"><button onClick={()=>setConfirm(null)}>Vazgeç</button><button className="bePublish" onClick={()=>{const run=confirm.run;setConfirm(null);run();}}>{confirm.button}</button></div></Modal>}
    {newPage&&!confirm&&<Modal title="Yeni sayfa" onClose={()=>setNewPage(false)}><label className="beField"><span>Sayfa adı</span><input value={newTitle} maxLength={120} onChange={event=>setNewTitle(event.target.value)} placeholder="Örneğin: Production"/></label><label className="beField"><span>Adres · /pages/</span><input value={newSlug} maxLength={80} onChange={event=>setNewSlug(event.target.value.toLowerCase())} placeholder="production"/></label><p>Yeni sayfa önce özel taslak olarak açılır.</p><div className="beModalActions"><button onClick={()=>setNewPage(false)}>Vazgeç</button><button className="bePublish" onClick={createPage}>Sayfayı oluştur</button></div></Modal>}
    {blockSave&&<Modal title="Bölüm şablonu kaydet" onClose={()=>setBlockSave(false)}><label className="beField"><span>Şablon adı</span><input value={blockName} maxLength={100} onChange={event=>setBlockName(event.target.value)}/></label>{error&&<p role="alert">{error}</p>}<p>Bu bölümün bağımsız bir kopyasını diğer sayfalara ekleyebilirsin.</p><div className="beModalActions"><button onClick={()=>setBlockSave(false)}>Vazgeç</button><button className="bePublish" disabled={busy} onClick={saveBlock}>Şablonu kaydet</button></div></Modal>}
    {asset&&<Modal title="Görsel arşivi" wide onClose={()=>{if(!assetLoading)setAsset(null);}}>{error&&<p role="alert">{error}</p>}<MediaLibrary onBusy={setAssetLoading} onSelect={useAsset} onError={setError} onNotice={setNotice}/></Modal>}
  </main></SiteDesignProvider>;
}
