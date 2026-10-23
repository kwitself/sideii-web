'use client';
import {useEffect, useState, useRef} from 'react';
import {HOME_SECTIONS} from '../../lib/home-sections';
import {CONTAINERS, SLOT_LABELS, STYLE_ENUMS, STYLE_FIELDS, WIDGETS} from '../../lib/page-builder';

export function BufferedField({value = '', onCommit, label, multiline = false, type = 'text', ...props}) {
  const [draft, setDraft] = useState(String(value));
  const cancelled = useRef(false);
  useEffect(() => setDraft(String(value)), [value]);
  const Input = multiline ? 'textarea' : 'input';
  return <label className="beField"><span>{label}</span><Input {...props} type={multiline ? undefined : type} value={draft} onChange={event => setDraft(event.target.value)} onBlur={() => {if(cancelled.current){cancelled.current=false;return;} if (String(value) !== draft) onCommit(draft);}} onKeyDown={event => {if (event.key === 'Enter' && !multiline) event.currentTarget.blur(); if (event.key === 'Escape') {event.stopPropagation();cancelled.current=true;setDraft(String(value)); event.currentTarget.blur();}}}/></label>;
}
const labels = {paddingTop: 'Üst iç boşluk', paddingRight: 'Sağ iç boşluk', paddingBottom: 'Alt iç boşluk', paddingLeft: 'Sol iç boşluk', marginTop: 'Üst dış boşluk', marginBottom: 'Alt dış boşluk', gap: 'Bileşen aralığı', fontSize: 'Yazı boyutu', lineHeight: 'Satır yüksekliği', letterSpacing: 'Harf aralığı', minHeight: 'En az yükseklik', maxWidth: 'En fazla genişlik', width: 'Genişlik (%)', borderRadius: 'Köşe yuvarlama', borderWidth: 'Çerçeve', opacity: 'Opaklık', columns: 'Sütun sayısı'};
const enumLabels = {textAlign: 'Metin hizası', alignItems: 'Yatay hizalama', justifyContent: 'Dağılım', direction: 'Yön', fontFamily: 'Yazı tipi', fontWeight: 'Kalınlık', objectFit: 'Görsel yerleşimi', display: 'Görünürlük'};
const values = {left: 'Sol', center: 'Orta', right: 'Sağ', stretch: 'Uzat', 'flex-start': 'Başlangıç', 'flex-end': 'Son', 'space-between': 'Aralıklı', row: 'Yatay', column: 'Dikey', sans: 'Sans serif', serif: 'Serif', mono: 'Monospace', cover: 'Doldur', contain: 'Sığdır', show: 'Göster', hide: 'Gizle'};
export default function Inspector({node, document, device, focusField, onUpdate, onTheme, onAsset, onError}) {
  const [tab, setTab] = useState('content');
  const contentRef = useRef(null);
  useEffect(() => {if(focusField) setTab('content');}, [focusField]);
  useEffect(() => {
    if (!focusField || tab !== 'content') return;
    const input = contentRef.current?.querySelector('[data-home-field-input="' + focusField.key + '"]');
    input?.focus({preventScroll:true});input?.scrollIntoView({block:'nearest'});
  }, [focusField,tab]);
  const prop = (key, value) => onUpdate({props: {...node.props, [key]: value}});
  const styleKey = device === 'desktop' ? 'style' : device;
  const style = node?.[styleKey] || document.theme;
  const setStyle = (key, value) => {
    const next = {...style}; if (value === '') delete next[key]; else next[key] = value;
    node ? onUpdate({[styleKey]: next}) : onTheme(next);
  };
  const numbers = keys => <div className="beFieldGrid">{keys.map(key => <BufferedField key={key + (node?.id || '') + device} label={labels[key]} type="number" min={STYLE_FIELDS[key][0]} max={STYLE_FIELDS[key][1]} step={['opacity','lineHeight'].includes(key) ? 0.1 : 1} placeholder={node && device !== 'desktop' ? String(node.style[key] ?? 'Miras') : 'Varsayılan'} value={style[key] ?? ''} onCommit={value => {const number = Number(value); if (value !== '' && (!Number.isFinite(number) || number < STYLE_FIELDS[key][0] || number > STYLE_FIELDS[key][1])) {onError('Değer ' + STYLE_FIELDS[key].join('–') + ' aralığında olmalı.'); return;} setStyle(key, value === '' ? '' : number);}}/>)}</div>;
  const select = key => <label className="beField" key={key}><span>{enumLabels[key]}</span><select value={style[key] ?? ''} onChange={event => setStyle(key, event.target.value)}><option value="">Varsayılan / miras</option>{STYLE_ENUMS[key].map(value => <option key={value} value={value}>{values[value] || value}</option>)}</select></label>;
  const colors = () => ['color','backgroundColor','borderColor'].map(key => <div className="beColor" key={key}><label><span>{{color: 'Yazı rengi', backgroundColor: 'Zemin', borderColor: 'Çerçeve rengi'}[key]}</span><input aria-label={{color: 'Yazı rengi', backgroundColor: 'Zemin rengi', borderColor: 'Çerçeve rengi'}[key]} type="color" value={/^#[a-fA-F0-9]{6}$/.test(style[key] || '') ? style[key] : '#111111'} onChange={event => setStyle(key, event.target.value)}/></label><button type="button" title="Rengi sıfırla" onClick={() => setStyle(key, '')}>↺</button><small>{style[key] || 'Miras'}</small></div>);
  if (!node) return <div className="beInspectorBody"><small>SAYFA TEMASI</small><h2>Tasarımın temeli.</h2><p>Bir bileşene tıkla veya sayfanın genel renklerini ve yazı tipini düzenle.</p>{colors()}{select('fontFamily')}<div className="beHint">Mobil ve tablet ayarları bileşen bazında düzenlenir. Boş bırakılan alanlar büyük ekran ayarını devralır.</div></div>;
  return <><div className="beInspectorTitle"><small>{WIDGETS[node.type].label.toUpperCase()}</small><BufferedField label="Katman adı" value={node.name} maxLength={100} onCommit={name => onUpdate({name})}/></div><div className="beTabs"><button type="button" aria-pressed={tab === 'content'} onClick={() => setTab('content')}>İçerik</button><button type="button" aria-pressed={tab === 'style'} onClick={() => setTab('style')}>Tasarım</button></div><div className="beInspectorBody" ref={contentRef}>
    {tab === 'content' ? <>
      {node.type === 'siteSection' && <><p className="beHint">Sitedeki özgün bölüm. Metne veya logoya tıklayarak ilgili alanı seçebilirsin.</p>{Object.entries(HOME_SECTIONS[node.props.section].fields).map(([key, field]) => <div key={key}>
        {field.type === 'image' && <>{node.props[key] && <img className="beAssetPreview" src={node.props[key]} alt={field.label}/>}<button className="beWideButton" onClick={() => onAsset(key)}>{field.label} seç / yükle</button></>}
        <BufferedField data-home-field-input={key} label={field.label} multiline={field.type === 'multiline'} value={node.props[key] ?? field.value} onCommit={value => prop(key,value)}/>
      </div>)}</>}
      {'text' in node.props && <BufferedField key={node.id + 'text'} label="Metin" multiline value={node.props.text} onCommit={value => prop('text', value)}/>}
      {node.type !== 'siteSection' && 'title' in node.props && <BufferedField key={node.id + 'title'} label="Başlık" value={node.props.title} onCommit={value => prop('title', value)}/>}
      {node.type === 'heading' && <label className="beField"><span>Başlık seviyesi</span><select value={node.props.level} onChange={event => prop('level', event.target.value)}>{['h1','h2','h3','h4'].map(level => <option key={level}>{level}</option>)}</select></label>}
      {node.type === 'image' && <>{node.props.src && <img className="beAssetPreview" src={node.props.src} alt="Seçili görsel"/>}<button className="beWideButton" onClick={() => onAsset('src')}>Görsel seç / yükle</button><BufferedField label="Görsel adresi" value={node.props.src} onCommit={value => prop('src', value)}/><BufferedField label="Alternatif metin" value={node.props.alt} onCommit={value => prop('alt', value)}/></>}
      {'href' in node.props && <BufferedField label="Bağlantı adresi" value={node.props.href} onCommit={value => prop('href', value)}/>}
      {node.type === 'button' && <label className="beCheck"><input type="checkbox" checked={node.props.newTab} onChange={event => prop('newTab', event.target.checked)}/>Yeni sekmede aç</label>}
      {node.type === 'quote' && <BufferedField label="Kaynak / kişi" value={node.props.author} onCommit={value => prop('author', value)}/>}
      {node.type === 'video' && <><BufferedField label="MP4 / WebM adresi" value={node.props.src} onCommit={value => prop('src', value)}/><BufferedField label="Kapak görseli" value={node.props.poster} onCommit={value => prop('poster', value)}/><button onClick={() => onAsset('poster')}>Kapak seç</button></>}
      {['section','siteSection'].includes(node.type) && <BufferedField label="Bölüm bağlantısı (# olmadan)" value={node.props.anchor} onCommit={value => prop('anchor', value)}/>}
      {node.type === 'products' && <><BufferedField type="number" label="Ürün sayısı" min="1" max="24" value={node.props.limit} onCommit={value => prop('limit', Number(value))}/><label className="beField"><span>Label</span><select value={node.props.imprint} onChange={event => prop('imprint', event.target.value)}><option value="all">Tümü</option><option value="sideii">SIDE:II</option><option value="lethargia">Lethargia</option></select></label><p className="beHint">Vitrin gerçek, yayımlanmış ürünleri kullanır. Fiyat ve stok ürün yönetiminden gelir.</p></>}
      {node.type === 'native' && <p className="beHint">{SLOT_LABELS[node.props.slot]} mevcut mağaza işlevini kullanır. Konumunu ve çevresindeki düzeni buradan değiştirebilirsin.</p>}
      {CONTAINERS.has(node.type) && <p className="beHint">Bileşenleri bu kapsayıcıya sürükle. Sütun, aralık ve hizalama için Tasarım sekmesini aç.</p>}
    </> : <>
      <div className="beBreakpoint">{device === 'desktop' ? 'MASAÜSTÜ · TEMEL' : device === 'tablet' ? 'TABLET · ≤900 PX' : 'MOBİL · ≤600 PX'}<button title="Bu cihazın stillerini sıfırla" onClick={() => onUpdate({[styleKey]: {}})}>Sıfırla</button></div>
      <details open><summary>Yerleşim</summary>{numbers(['width','maxWidth','minHeight',...(node.type === 'columns' ? ['columns'] : []),'gap'])}{CONTAINERS.has(node.type) && <>{select('direction')}{select('alignItems')}{select('justifyContent')}</>}{select('display')}</details>
      <details open><summary>Boşluklar</summary>{numbers(['paddingTop','paddingRight','paddingBottom','paddingLeft','marginTop','marginBottom'])}</details>
      <details><summary>Tipografi</summary>{node.type === 'siteSection' && <p className="beHint">Bu ayarlar bölümün ana başlığını değiştirir. Varsayılan değerler sitenin kendi tasarımından gelir.</p>}{numbers(['fontSize','lineHeight','letterSpacing'])}{select('fontFamily')}{select('fontWeight')}{select('textAlign')}</details>
      <details><summary>Renk ve çerçeve</summary>{colors()}{numbers(['borderRadius','borderWidth','opacity'])}</details>
      {node.type === 'image' && select('objectFit')}
    </>}
  </div></>;
}
