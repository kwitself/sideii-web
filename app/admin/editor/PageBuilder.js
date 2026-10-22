'use client';
import {useEffect, useReducer, useRef, useState} from 'react';
import {supabase} from '../../lib/supabase';
import {CONTAINERS, WIDGETS, NATIVE_SLOTS, SLOT_LABELS, createNode, cloneNodeTree, findNode, findLocation, insertNode, moveNode, removeNode, duplicateNode, updateNode, validateDocument, pagePath, flattenNodes} from '../../lib/page-builder';
import {starterDocument, sectionTemplate} from '../../lib/page-builder-templates';
import PageCanvas from '../../components/builder/PageCanvas';
import Inspector, {BufferedField} from './Inspector';
import useAdminDialog from '../useAdminDialog';
import './editor.css';

const DEFAULT_PAGES = [{page_key:'home',title:'Ana sayfa'},{page_key:'store',title:'Mağaza'},{page_key:'product',title:'Ürün şablonu'}];
const MIME = 'application/x-sideii-builder';
const messages = {save: 'Taslak kaydedildi.', publish: 'Sayfa yayımlandı.', unpublish: 'Yayın kaldırıldı. Mevcut site şablonu devrede.', restore: 'Önceki sürüm taslak olarak geri yüklendi.'};
function historyReducer(state, action) {
  if (action.type === 'reset') return {past: [], present: action.document, future: []};
  if (action.type === 'undo' && state.past.length) return {past: state.past.slice(0,-1), present: state.past.at(-1), future: [state.present, ...state.future]};
  if (action.type === 'redo' && state.future.length) return {past: [...state.past, state.present], present: state.future[0], future: state.future.slice(1)};
  if (action.type === 'change') return {past: [...state.past, state.present].slice(-60), present: action.document, future: []};
  return state;
}
async function api(path = '', body) {
  if (!supabase) throw new Error('Veritabanı bağlantısı yok.');
  const {data, error} = await supabase.auth.getSession();
  if (error || !data.session?.access_token) throw new Error('Oturum süresi dolmuş. Yeniden giriş yapın.');
  let response;
  try {response = await fetch('/api/admin/page-builder' + path, {method: body ? 'POST' : 'GET', cache: 'no-store', signal: AbortSignal.timeout(30000), headers: {Authorization: 'Bearer ' + data.session.access_token, ...(body ? {'Content-Type':'application/json'} : {})}, ...(body ? {body: JSON.stringify(body)} : {})});}
  catch {throw new Error('Bağlantı yanıt vermedi. Çalışman bu tarayıcıda korunuyor; yeniden denemeden önce güncel sürümü kontrol et.');}
  let result; try {result = await response.json();} catch {throw new Error('Sunucu yanıtı okunamadı. Çalışman bu tarayıcıda korunuyor.');}
  if (!response.ok) {const failure = new Error(result.error || 'İşlem tamamlanamadı.'); failure.status = response.status; throw failure;}
  return result;
}
function Modal({title, children, onClose, wide = false}) {
  const ref = useAdminDialog(true, onClose);
  return <div className="beModalBackdrop" onMouseDown={event => {if(event.target === event.currentTarget) onClose();}}><section ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className={'beModal' + (wide ? ' beModalWide' : '')}><header><h2>{title}</h2><button onClick={onClose} aria-label="Pencereyi kapat">×</button></header>{children}</section></div>;
}
export default function PageBuilder({products = [], slots = {}}) {
  const [history, dispatch] = useReducer(historyReducer, null, () => ({past: [], present: starterDocument('home'), future: []}));
  const document = history.present;
  const [key, setKey] = useState('home'), [title, setTitle] = useState('Ana sayfa'), [pages, setPages] = useState(DEFAULT_PAGES);
  const [version, setVersion] = useState(0), [publishedVersion, setPublishedVersion] = useState(null), [saved, setSaved] = useState('');
  const [selectedId, setSelected] = useState(null), [device, setDevice] = useState('desktop'), [panel, setPanel] = useState('blocks'), [leftOpen,setLeftOpen] = useState(true), [rightOpen,setRightOpen] = useState(true);
  const [preview, setPreview] = useState(false), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [failed, setFailed] = useState(false);
  const [notice, setNotice] = useState(''), [error, setError] = useState(''), [confirm, setConfirm] = useState(null), [revisions,setRevisions] = useState([]);
  const [asset, setAsset] = useState(null), [assets,setAssets] = useState([]), [assetLoading,setAssetLoading] = useState(false);
  const [blocks,setBlocks]=useState([]),[blockSave,setBlockSave]=useState(false),[blockName,setBlockName]=useState('');
  const [stageWidth,setStageWidth]=useState(900),[fit,setFit]=useState(true);
  const [newPage,setNewPage] = useState(false), [newSlug,setNewSlug] = useState(''), [newTitle,setNewTitle] = useState('');
  const [recovery,setRecovery] = useState(null), [userId,setUserId] = useState(''), [insertAt,setInsertAt] = useState(null);
  const importRef = useRef(null), uploadRef = useRef(null), canvasRef = useRef(null), liveRef = useRef(null), operationRef = useRef(false), loadSequence = useRef(0), dragRef = useRef(null);
  const signature = JSON.stringify({title, document}), dirty = saved !== '' && signature !== saved;
  const selected = findNode(document, selectedId);
  liveRef.current = {key,title,document,version,dirty,userId};
  const localKey = (pageKey, id = userId) => 'sideii:builder:v1:' + id + ':' + pageKey;
  const persistRecovery = () => {const value=liveRef.current;if(!value.dirty||!value.userId)return;try{localStorage.setItem(localKey(value.key,value.userId),JSON.stringify({...value,signature:JSON.stringify({title:value.title,document:value.document}),time:Date.now()}));}catch{}};
  const clearRecovery = (pageKey, id = userId) => {try {localStorage.removeItem(localKey(pageKey,id));} catch {}};
  const accept = (data, pageKey) => {
    const doc = validateDocument(data.page.draft_document, pageKey);
    dispatch({type:'reset',document:doc}); setKey(pageKey); setTitle(data.page.title); setVersion(Number(data.page.version)); setPublishedVersion(data.publishedVersion); setSelected(null); setInsertAt(null);
    setSaved(JSON.stringify({title:data.page.title,document:doc})); if (data.userId) setUserId(data.userId);
  };
  const load = async pageKey => {
    if (operationRef.current) return;
    persistRecovery();
    operationRef.current = true; const request = ++loadSequence.current;
    setLoading(true); setError(''); setNotice(''); setFailed(false); setRecovery(null);
    try {
      const [data, list] = await Promise.all([api('?key=' + encodeURIComponent(pageKey)), api()]);
      if (request !== loadSequence.current) return;
      accept(data,pageKey);
      setPages([...DEFAULT_PAGES.map(p => list.pages.find(row => row.page_key === p.page_key) || p), ...list.pages.filter(p => p.page_key.startsWith('page:'))]);
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
      if(action !== 'restore') validateDocument(snapshot.document,snapshot.key,{publishing:action==='publish'});
      const result = await api('',{key:snapshot.key,title:snapshot.title,document:snapshot.document,expectedVersion:snapshot.version,action,...extra});
      accept(result,snapshot.key); clearRecovery(snapshot.key); setRecovery(null); setNotice(action==='unpublish'&&snapshot.key.startsWith('page:')?'Yayın kaldırıldı. Sayfa ziyaretçilere kapatıldı.':messages[action]);
      setPages(current => {const entry={page_key:snapshot.key,title:result.page.title};return current.some(p=>p.page_key===snapshot.key)?current.map(p=>p.page_key===snapshot.key?entry:p):[...current,entry];});
      if(panel==='history') api('?key='+encodeURIComponent(snapshot.key)+'&history=1').then(list=>setRevisions(list.revisions)).catch(()=>setNotice(messages[action]+' Geçmişi yenilemek için tekrar aç.'));
    } catch(failure) {setError(failure.message); if(failure.status===409) setNotice('Yerel değişikliklerin korunuyor. JSON dışa aktar seçeneğini kullanabilirsin.');}
    finally {operationRef.current=false;setBusy(false);}
  };
  useEffect(() => {
    const onKey = event => {
      if(loading || busy || failed || confirm || asset || newPage) return;
      const typing = /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable;
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s') {event.preventDefault();event.target.blur?.();setTimeout(()=>save(),0);}
      if(!typing&&(event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z') {event.preventDefault();dispatch({type:event.shiftKey?'redo':'undo'});}
      if(!typing&&(event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='y') {event.preventDefault();dispatch({type:'redo'});}
      if(event.key==='Escape') {setSelected(null);setPreview(false);}
    };
    window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);
  },[loading,busy,failed,confirm,asset,newPage,key]);
  const select = id => {setSelected(id);setRightOpen(true);if(window.innerWidth<=1000)setLeftOpen(false);setInsertAt(null);};
  const add = node => {
    try {
      let parentId = null,index=null;
      if(insertAt) ({parentId,index}=insertAt);
      else if(selected && CONTAINERS.has(selected.type)) parentId=selected.id;
      else if(selected) {const location=findLocation(document,selected.id);parentId=location.parentId;index=location.index+1;}
      change(insertNode(document,node,parentId,index));select(node.id);
    } catch(failure) {setError(failure.message);}
  };
  const beginDrag = (event,payload) => {dragRef.current=payload;event.dataTransfer.setData(MIME,JSON.stringify(payload));event.dataTransfer.effectAllowed=payload.id?'move':'copy';};
  const onDrop = (event,parentId,index) => {
    try {
      const raw=event.dataTransfer.getData(MIME); if(!raw) return;
      const payload=JSON.parse(raw);
      if(payload.id) change(moveNode(document,payload.id,parentId,index));
      else {const node=payload.template?sectionTemplate(payload.template):createNode(payload.type,payload.slot?{props:{slot:payload.slot}}:{});change(insertNode(document,node,parentId,index));setSelected(node.id);}
    } catch(failure) {setError(failure.message);}
    dragRef.current=null;
  };
  const moveSelection = direction => {try {const location=findLocation(document,selectedId);if(location) change(moveNode(document,selectedId,location.parentId,Math.max(0,location.index+(direction>0?2:-1))));}catch(failure){setError(failure.message);}};
  const switchPage = target => {if(target===key)return;dirty?setConfirm({title:'Kaydedilmemiş değişiklikler',text:'Bu sayfanın değişiklikleri tarayıcı yedeğinde kalacak. Diğer sayfaya geçilsin mi?',button:'Sayfaya geç',run:()=>load(target)}):load(target);};
  const exportJson = () => {
    const blob = new Blob([JSON.stringify({pageKey:key,title,document},null,2)],{type:'application/json'}), url=URL.createObjectURL(blob), link=window.document.createElement('a');
    link.href=url;link.download='sideii-'+key.replace(':','-')+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const importJson = async event => {const file=event.target.files?.[0];event.target.value='';if(!file)return;try {if(file.size>450000)throw new Error('Dosya çok büyük.');const data=JSON.parse(await file.text());const doc=validateDocument(data.document||data,key);setConfirm({title:'Sayfayı içe aktar',text:'Mevcut taslağın yerini bu dosya alacak. Geri al ile önceki haline dönebilirsin.',button:'İçe aktar',run:()=>change(doc)});}catch(failure){setError(failure.message);}};
  const openHistory = async () => {setPanel('history');setError('');try{const result=await api('?key='+encodeURIComponent(key)+'&history=1');setRevisions(result.revisions);}catch(failure){setError(failure.message);}};
  const openAssets = async prop => {setAsset({nodeId:selectedId,prop});setAssetLoading(true);setError('');try {const result=await api('/assets');setAssets(result.assets);}catch(failure){setError(failure.message);}finally{setAssetLoading(false);}};
  const useAsset = url => {const target=findNode(document,asset.nodeId);if(target)change(updateNode(document,target.id,{props:{...target.props,[asset.prop]:url}}));setAsset(null);};
  const upload = async event => {
    const file=event.target.files?.[0];event.target.value='';if(!file)return;
    setAssetLoading(true);setError('');
    try {
      const extensions={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif','image/gif':'gif'};
      if(!extensions[file.type]||file.size>10485760)throw new Error('En fazla 10 MB: JPG, PNG, WebP, AVIF veya GIF.');
      const path='images/'+crypto.randomUUID()+'.'+extensions[file.type];
      const {error:failure}=await supabase.storage.from('site-builder-assets').upload(path,file,{contentType:file.type,upsert:false,cacheControl:'31536000'});
      if(failure)throw new Error('Görsel yüklenemedi. Yönetici oturumunu ve bağlantıyı kontrol et.');
      const url=supabase.storage.from('site-builder-assets').getPublicUrl(path).data.publicUrl;
      useAsset(url);setNotice('Görsel yüklendi. Sayfayı kaydetmeyi unutma.');
    }catch(failure){setError(failure.message);}finally{setAssetLoading(false);}
  };
  const createPage = () => {
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(newSlug)||newSlug.length>80||!newTitle.trim()) {setError('Sayfa adı ve küçük harf/rakam/tire içeren bir adres gir.');return;}
    const pageKey='page:'+newSlug;
    if(pages.some(p=>p.page_key===pageKey)){setError('Bu adres zaten var.');return;}
    const proceed=()=>{persistRecovery();setNewPage(false);setPages(current=>[...current,{page_key:pageKey,title:newTitle.trim()}]);accept({page:{title:newTitle.trim(),version:0,draft_document:starterDocument(pageKey)},publishedVersion:null},pageKey);setSaved('new');historyReplace(pageKey);setNewSlug('');setNewTitle('');};
    dirty?setConfirm({title:'Yeni sayfaya geç',text:'Kaydedilmemiş mevcut sayfa değişiklikleri tarayıcı yedeğinde kalacak.',button:'Yeni sayfayı aç',run:proceed}):proceed();
  };
  const saveBlock=async()=>{if(!selected)return;setBusy(true);setError('');try{const result=await api('/blocks',{name:blockName,node:selected});setBlocks(current=>[result.block,...current]);setBlockSave(false);setNotice('Bölüm şablonu arşive kaydedildi.');}catch(failure){setError(failure.message);}finally{setBusy(false);}};
  const frameWidth=device==='desktop'?1200:device==='tablet'?820:390;
  const frameZoom=fit?Math.min(1,Math.max(.2,stageWidth/frameWidth)):1;
  const layerTree=(children,depth=0)=>children.map((node,index)=><div key={node.id} className="beLayerGroup"><div className={'beLayer'+(selectedId===node.id?' selected':'')} style={{paddingLeft:10+depth*12}} draggable onDragStart={event=>beginDrag(event,{id:node.id})} onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();event.stopPropagation();const location=findLocation(document,node.id);onDrop(event,location.parentId,index);}}><button aria-label={node.name} onClick={()=>select(node.id)} title={node.name}><span>{WIDGETS[node.type].icon}</span>{node.name}</button>{CONTAINERS.has(node.type)&&<button aria-label={node.name+' içine taşı'} title="Sürüklenen bileşeni içine bırak" className="beLayerInto" onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();event.stopPropagation();onDrop(event,node.id,node.children.length);}} onClick={()=>{setSelected(node.id);setInsertAt({parentId:node.id,index:node.children.length});setPanel('blocks');}}>＋</button>}</div>{layerTree(node.children,depth+1)}</div>);
  return <main className={'beApp'+(busy?' beBusy':'')} lang="tr">
    <header className="beTopbar"><a className="beBrand" href="/admin" onClick={event=>{if(dirty){event.preventDefault();setConfirm({title:'Editörden çık',text:'Kaydedilmemiş değişiklikler tarayıcı yedeğinde kalacak.',button:'Admin paneline dön',run:()=>{persistRecovery();window.location.href='/admin';}});}}}>SIDE:II <span>STUDIO</span></a><div className="bePageSelect"><select aria-label="Düzenlenen sayfa" disabled={busy||loading} value={key} onChange={event=>switchPage(event.target.value)}>{pages.map(page=><option key={page.page_key} value={page.page_key}>{page.title}</option>)}</select><button title="Yeni sayfa" disabled={busy||loading||failed} onClick={()=>setNewPage(true)}>＋</button></div><div className="beViewports" aria-label="Önizleme boyutu">{[['desktop','Masaüstü'],['tablet','Tablet'],['mobile','Mobil']].map(([id,label])=><button key={id} aria-pressed={device===id} onClick={()=>setDevice(id)}>{label}</button>)}</div><div className="beTopActions"><button aria-label="Geri al" disabled={!history.past.length||busy||loading} onClick={()=>dispatch({type:'undo'})}>↶</button><button aria-label="İleri al" disabled={!history.future.length||busy||loading} onClick={()=>dispatch({type:'redo'})}>↷</button><button aria-pressed={preview} onClick={()=>setPreview(value=>!value)}>{preview?'Düzenle':'Önizle'}</button><button disabled={busy||loading||failed} onClick={()=>save()}>Taslağı kaydet</button><button className="bePublish" disabled={busy||loading||failed} onClick={()=>setConfirm({title:'Sayfayı yayımla',text:title+' için '+flattenNodes(document).length+' bileşen içeren bu sürüm ziyaretçilere gösterilecek.',button:'Yayımla',run:()=>save('publish')})}>{busy?'İşleniyor…':'Yayımla ↗'}</button></div></header>
    <div className="beStatusbar"><div><span className={'beStatusDot '+(dirty?'dirty':'')}/>{loading?'Yükleniyor…':dirty?'Kaydedilmemiş değişiklikler':version?'Taslak v'+version:'Başlangıç şablonu'}<span>·</span>{publishedVersion?'Yayında v'+publishedVersion:'Özel taslak'}</div><div><button onClick={()=>{setLeftOpen(value=>!value);if(window.innerWidth<=1000)setRightOpen(false);if(preview)setPreview(false);}}>Bileşenler</button><button onClick={()=>{setRightOpen(value=>!value);if(window.innerWidth<=1000)setLeftOpen(false);if(preview)setPreview(false);}}>Ayarlar</button><a href={pagePath(key)} target="_blank" rel="noreferrer">Siteyi aç ↗</a></div></div>
    {(error||notice)&&<div className={'beMessage '+(error?'isError':'')} role={error?'alert':'status'}>{error||notice}{error&&<button onClick={()=>{setError('');setNotice('');}} aria-label="Bildirimi kapat">×</button>}</div>}
    {recovery&&<div className="beRecovery" role="status"><span>Bu tarayıcıda kaydedilmemiş bir çalışma var{recovery.version!==version?' · sunucu sürümü de değişmiş':''}.</span><button onClick={()=>{try{change(validateDocument(recovery.document,key));setTitle(recovery.title);setRecovery(null);}catch(failure){setError(failure.message);}}}>Çalışmayı kurtar</button><button onClick={()=>{clearRecovery(key);setRecovery(null);}}>Sunucu sürümünü kullan</button></div>}
    <div className={'beWorkspace '+(preview?'isPreview ':'')+(!leftOpen?'leftClosed ':'')+(!rightOpen?'rightClosed':'')}>
      {!preview&&leftOpen&&<aside className="beLibrary" aria-label="Bileşen kütüphanesi"><div className="beTabs"><button aria-pressed={panel==='blocks'} onClick={()=>setPanel('blocks')}>Ekle</button><button aria-pressed={panel==='layers'} onClick={()=>setPanel('layers')}>Katmanlar</button><button aria-pressed={panel==='history'} onClick={openHistory}>Geçmiş</button></div>
        {panel==='blocks'&&<div className="beLibraryBody"><span className="beEyebrow">YERLEŞTİR VE ŞEKİLLENDİR</span><h1>Senin alanın.</h1><p>{insertAt?'Seçtiğin aralığa eklenecek.':'Bir bileşeni sürükle veya eklemek için tıkla.'}</p><div className="beBlocks">{Object.entries(WIDGETS).filter(([type])=>type!=='native').map(([type,meta])=><button key={type} aria-label={meta.label} draggable disabled={loading||failed||busy} onDragStart={event=>beginDrag(event,{type})} onClick={()=>add(createNode(type))}><b>{meta.icon}</b><span>{meta.label}</span></button>)}</div>{(NATIVE_SLOTS[key]||[]).length>0&&<><h3>Mağaza bileşenleri</h3><div className="beNativeBlocks">{NATIVE_SLOTS[key].map(slot=><button key={slot} disabled={flattenNodes(document).some(n=>n.type==='native'&&n.props.slot===slot)} draggable onDragStart={event=>beginDrag(event,{type:'native',slot})} onClick={()=>add(createNode('native',{props:{slot},name:SLOT_LABELS[slot]}))}>{SLOT_LABELS[slot]} ＋</button>)}</div></>}{blocks.length>0&&<><h3>Bölüm şablonların</h3>{blocks.map(block=><button className="beTemplate" key={block.id} onClick={()=>{try{const data=validateDocument(block.document,'page:snippet');add(cloneNodeTree(data.children[0]));}catch(failure){setError(failure.message);}}}>{block.name} ＋</button>)}</>}<h3>Hazır bölümler</h3>{[['hero','Karşılama'],['split','Görsel + metin'],['cta','Çağrı alanı'],['faq','Sık sorulanlar'],['products','Ürün vitrini']].map(([id,label])=><button className="beTemplate" key={id} draggable onDragStart={event=>beginDrag(event,{template:id})} onClick={()=>add(sectionTemplate(id))}><span>{label}</span>↗</button>)}</div>}
        {panel==='layers'&&<div className="beLayers"><button className="beRootLayer" onClick={()=>{setSelected(null);setInsertAt({parentId:null,index:document.children.length});}}>SAYFA · {flattenNodes(document).length} BİLEŞEN</button>{layerTree(document.children)}<div className="beHint">Katman üstüne bırakarak önüne taşı; ＋ alanına bırakarak içine taşı. Seçili katmanı oklarla da taşıyabilirsin.</div></div>}
        {panel==='history'&&<div className="beLibraryBody"><h2>Sürüm geçmişi</h2><p>Son 50 kayıt. Geri yükleme taslağı değiştirir; yayına almak için ayrıca Yayımla kullanılır.</p>{revisions.length===0?<p>Henüz kayıt yok.</p>:revisions.map(revision=><button className="beRevision" key={revision.id} onClick={()=>setConfirm({title:'Sürümü geri yükle',text:'v'+revision.version+' taslak olarak geri yüklenecek. Mevcut çalışma önce dışa aktarılabilir.',button:'Taslağa geri yükle',run:()=>save('restore',{revisionId:Number(revision.id)})})}><b>v{revision.version} · {revision.action}</b><span>{new Date(revision.created_at).toLocaleString('tr-TR')}</span></button>)}</div>}
        <div className="beLibraryFoot"><button onClick={exportJson}>JSON dışa aktar</button><button disabled={busy||loading||failed} onClick={()=>importRef.current?.click()}>İçe aktar</button><input hidden ref={importRef} type="file" accept="application/json,.json" onChange={importJson}/></div>
      </aside>}
      <section className="beStage" ref={canvasRef} aria-label="Sayfa tuvali"><div className="beStageLabel"><span>{preview?'ÖNİZLEME':'CANLI TUVAL'} / {device==='desktop'?'1200':device==='tablet'?'820':'390'} PX</span><div><button onClick={()=>setFit(value=>!value)}>{fit?'Sığdır · %'+Math.round(frameZoom*100):'%100'}</button> <button onClick={()=>{setSelected(null);setRightOpen(true);if(window.innerWidth<=1000)setLeftOpen(false);}}>Sayfa teması</button></div></div>{loading?<div className="beLoading">Sayfa yükleniyor…</div>:failed?<div className="beLoading"><h2>Sayfa yüklenemedi.</h2><p>Bağlantı kurulmadan kayıt yapılamaz.</p><button onClick={()=>load(key)}>Tekrar dene</button></div>:<div className={'beCanvasFrame '+device} style={{width:frameWidth,maxWidth:'none',zoom:frameZoom}} onClick={()=>setSelected(null)}><PageCanvas document={document} products={products} slots={slots} editing={!preview} previewOnly selectedId={selectedId} onSelect={select} onDropNode={onDrop} onDragNode={(event,id)=>beginDrag(event,{id})} onInsertAt={(parentId,index)=>{setInsertAt({parentId,index});setLeftOpen(true);setPanel('blocks');}}/></div>}</section>
      {!preview&&rightOpen&&<aside className="beInspector" aria-label="Bileşen ayarları"><div className="bePageName"><BufferedField label="Sayfa adı" value={title} maxLength={120} onCommit={value=>{if(!busy)setTitle(value);}}/></div>{selected&&<div className="beNodeActions"><button aria-label="Bileşeni yukarı taşı" onClick={()=>moveSelection(-1)}>↑</button><button aria-label="Bileşeni aşağı taşı" onClick={()=>moveSelection(1)}>↓</button><button onClick={()=>{try{change(duplicateNode(document,selectedId));}catch(failure){setError(failure.message);}}}>Çoğalt</button><button onClick={()=>setConfirm({title:'Bileşeni sil',text:selected.name+' ve içeriği kaldırılacak. Geri al ile kurtarabilirsin.',button:'Sil',run:()=>{change(removeNode(document,selectedId));setSelected(null);}})}>Sil</button></div>}{selected&&selected.type!=='native'&&<button className="beSaveBlock" onClick={()=>{setBlockName(selected.name);setBlockSave(true);}}>Bölümü şablon olarak kaydet</button>}<Inspector key={selectedId||'theme'} node={selected} document={document} device={device} onUpdate={update=>change(updateNode(document,selectedId,update))} onTheme={theme=>change({...document,theme})} onAsset={openAssets} onError={setError}/><div className="beInspectorFoot"><button onClick={()=>setConfirm({title:'Başlangıç şablonunu yükle',text:'Taslak başlangıç düzeniyle değişecek. Geri al kullanılabilir; yayındaki sayfa etkilenmez.',button:'Şablonu yükle',run:()=>{change(starterDocument(key));setSelected(null);}})}>Başlangıç şablonu</button>{publishedVersion&&<button onClick={()=>setConfirm({title:'Yayını kaldır',text:key.startsWith('page:')?'Bu sayfa ziyaretçilere kapanacak. Taslak korunur.':'Site bu sayfa için önceki yerleşik tasarımı kullanacak. Taslak korunur.',button:'Yayını kaldır',run:()=>save('unpublish')})}>Yayını kaldır</button>}</div></aside>}
    </div>
    <footer className="beBottom"><span>SIDE:II / VISUAL STUDIO</span><span>Ctrl / ⌘ S · Kaydet &nbsp; Ctrl / ⌘ Z · Geri al</span><span>{dirty?'TARAYICI YEDEĞİ AÇIK':'DRAFT → PREVIEW → PUBLISH'}</span></footer>
    {confirm&&<Modal title={confirm.title} onClose={()=>setConfirm(null)}><p>{confirm.text}</p><div className="beModalActions"><button onClick={()=>setConfirm(null)}>Vazgeç</button><button className="bePublish" onClick={()=>{const run=confirm.run;setConfirm(null);run();}}>{confirm.button}</button></div></Modal>}
    {newPage&&!confirm&&<Modal title="Yeni sayfa" onClose={()=>setNewPage(false)}><label className="beField"><span>Sayfa adı</span><input value={newTitle} maxLength={120} onChange={event=>setNewTitle(event.target.value)} placeholder="Örneğin: Production"/></label><label className="beField"><span>Adres · /pages/</span><input value={newSlug} maxLength={80} onChange={event=>setNewSlug(event.target.value.toLowerCase())} placeholder="production"/></label><p>Yeni sayfa önce özel taslak olarak açılır.</p><div className="beModalActions"><button onClick={()=>setNewPage(false)}>Vazgeç</button><button className="bePublish" onClick={createPage}>Sayfayı oluştur</button></div></Modal>}
    {blockSave&&<Modal title="Bölüm şablonu kaydet" onClose={()=>setBlockSave(false)}><label className="beField"><span>Şablon adı</span><input value={blockName} maxLength={100} onChange={event=>setBlockName(event.target.value)}/></label>{error&&<p role="alert">{error}</p>}<p>Bu bölümün bağımsız bir kopyasını diğer sayfalara ekleyebilirsin.</p><div className="beModalActions"><button onClick={()=>setBlockSave(false)}>Vazgeç</button><button className="bePublish" disabled={busy} onClick={saveBlock}>Şablonu kaydet</button></div></Modal>}
    {asset&&<Modal title="Görsel arşivi" wide onClose={()=>{if(!assetLoading)setAsset(null);}}>{error&&<p role="alert">{error}</p>}<p>Yüklenen görseller herkese açık bir medya adresi alır. Sayfada görünmeleri için taslağı yayımlaman gerekir.</p><button disabled={assetLoading} className="bePublish" onClick={()=>uploadRef.current?.click()}>{assetLoading?'Yükleniyor…':'Görsel yükle'}</button><input ref={uploadRef} hidden type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" onChange={upload}/><div className="beAssetGrid">{assets.map(item=><button key={item.url} onClick={()=>useAsset(item.url)}><img src={item.url} alt={item.name}/><span>{item.name}</span></button>)}</div>{!assets.length&&!assetLoading&&<p>Arşiv henüz boş. İlk görseli yükleyebilirsin.</p>}</Modal>}
  </main>;
}
