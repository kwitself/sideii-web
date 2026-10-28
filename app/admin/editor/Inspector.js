'use client';
import {useEffect, useState, useRef} from 'react';
import {HOME_SECTIONS} from '../../lib/home-sections';
import {CONTAINERS, SLOT_LABELS, STYLE_ENUMS, STYLE_FIELDS, WIDGETS, inheritedNodeStyle} from '../../lib/page-builder';
import {TYPOGRAPHY_PRESETS, typographyPreset} from '../../lib/builder-fonts';
import WidgetFields from './WidgetFields';
import {EXTRA_WIDGETS} from '../../lib/builder-widgets';
import FontPicker from './FontPicker';
import {useSiteDesign} from '../../components/builder/SiteDesignProvider';
import {SITE_THEME_DEFAULTS,themeFontId} from '../../lib/builder-design';

export {default as BufferedField} from './BufferedField';
import BufferedField from './BufferedField';
const labels = {columnSplit:'Sol sütun oranı (%)',paddingTop: 'Üst iç boşluk', paddingRight: 'Sağ iç boşluk', paddingBottom: 'Alt iç boşluk', paddingLeft: 'Sol iç boşluk', marginTop: 'Üst dış boşluk', marginBottom: 'Alt dış boşluk', gap: 'Bileşen aralığı', fontSize: 'Yazı boyutu', lineHeight: 'Satır yüksekliği', letterSpacing: 'Harf aralığı', wordSpacing: 'Kelime aralığı', minHeight: 'En az yükseklik', maxWidth: 'En fazla genişlik', width: 'Genişlik (%)', borderRadius: 'Köşe yuvarlama', borderWidth: 'Çerçeve', opacity: 'Opaklık', columns: 'Sütun sayısı', mediaHeight: 'Sabit yükseklik (px)', gradientAngle: 'Degrade açısı (°)'};
const enumLabels = {textAlign: 'Metin hizası', alignItems: 'Yatay hizalama', justifyContent: 'Dağılım', direction: 'Yön', fontWeight: 'Kalınlık', objectFit: 'Görsel yerleşimi', display: 'Görünürlük', fontStyle: 'Yazı eğimi', textDecoration: 'Metin çizgisi', textTransform: 'Büyük / küçük harf', aspectRatio: 'En / boy oranı', backgroundType: 'Zemin türü', borderStyle: 'Çerçeve türü', boxShadow: 'Gölge'};
const values = {left: 'Sol', center: 'Orta', right: 'Sağ', stretch: 'Uzat', 'flex-start': 'Başlangıç', 'flex-end': 'Son', 'space-between': 'Aralıklı', row: 'Yatay', column: 'Dikey', cover: 'Kırp ve doldur', contain: 'Tamamını sığdır', show: 'Göster', hide: 'Gizle', normal: 'Normal', italic: 'İtalik', none: 'Yok', underline: 'Altı çizili', 'line-through': 'Üstü çizili', uppercase: 'BÜYÜK HARF', lowercase: 'küçük harf', capitalize: 'Baş Harfler', auto: 'Doğal oran', solid: 'Düz', gradient: 'Degrade', dashed: 'Kesikli', dotted: 'Noktalı', double: 'Çift çizgi', soft: 'Hafif', medium: 'Orta', strong: 'Güçlü', glow: 'Işıltı'};
const colorLabels = {color: 'Yazı rengi', backgroundColor: 'Zemin rengi', borderColor: 'Çerçeve rengi', gradientColor: 'Degrade bitiş rengi'};
const palette = ['#09090a', '#101012', '#302f33', '#a9a19d', '#e3e0d9', '#ffffff', '#742633'];
const focalPoints = [['left top','Sol üst'],['top','Üst'],['right top','Sağ üst'],['left','Sol'],['center','Orta'],['right','Sağ'],['left bottom','Sol alt'],['bottom','Alt'],['right bottom','Sağ alt']];
export default function Inspector({node, document, device, focusField, onUpdate, onTheme, onAsset, onError, products=[], pages=[], onOpenShared}) {
  const site=useSiteDesign();
  const [tab, setTab] = useState('content');
  const contentRef = useRef(null);
  useEffect(() => {if(focusField) setTab('content');}, [focusField]);
  useEffect(() => {
    if (!focusField || tab !== 'content') return;
    const input = contentRef.current?.querySelector('[data-home-field-input="' + focusField.key + '"]');
    input?.focus({preventScroll:true});input?.scrollIntoView({block:'nearest'});
  }, [focusField,tab]);
  const prop = (key, value) => {const richText={...node.richText};delete richText[key];onUpdate({props:{...node.props,[key]:value},richText});};
  const styleKey = device === 'desktop' ? 'style' : device;
  const style = node?.[styleKey] || document.theme;
  const inherited = {fontFamily:themeFontId(node,site),color:site.design.textColor||SITE_THEME_DEFAULTS.textColor,...(!node?{backgroundColor:site.design.backgroundColor||SITE_THEME_DEFAULTS.backgroundColor}:{}),...(node?inheritedNodeStyle(document,node.id,device):{})};
  const effective = {...inherited, ...style};
  const setStyles = patch => {
    const next = {...style}; for (const [key, value] of Object.entries(patch)) {if (value === '') delete next[key]; else next[key] = value;}
    node ? onUpdate({[styleKey]: next}) : onTheme(next);
  };
  const setStyle = (key, value) => setStyles({[key]: value});
  const numbers = keys => <div className="beFieldGrid">{keys.map(key => <BufferedField key={key + (node?.id || '') + device} label={labels[key]} type="number" min={STYLE_FIELDS[key][0]} max={STYLE_FIELDS[key][1]} step={['opacity','lineHeight','letterSpacing','wordSpacing'].includes(key) ? 0.1 : 1} placeholder={String(inherited[key] ?? 'Varsayılan')} value={style[key] ?? ''} onCommit={value => {const number = Number(value); if (value !== '' && (!Number.isFinite(number) || number < STYLE_FIELDS[key][0] || number > STYLE_FIELDS[key][1] || key === 'columns' && !Number.isInteger(number))) {onError('Değer ' + STYLE_FIELDS[key].join('–') + ' aralığında' + (key === 'columns' ? ' bir tam sayı' : '') + ' olmalı.'); return;} setStyle(key, value === '' ? '' : number);}}/>)}</div>;
  const select = key => <label className="beField" key={key}><span>{enumLabels[key]}</span><select aria-label={enumLabels[key]} value={style[key] ?? ''} onChange={event => setStyle(key, event.target.value)}><option value="">Varsayılan / miras</option>{STYLE_ENUMS[key].map(value => <option key={value} value={value}>{values[value] || value}</option>)}</select></label>;
  const color = key => <div className="beColorControl" key={key}><div className="beColorInput"><input aria-label={colorLabels[key]} type="color" value={/^#[a-fA-F0-9]{6}$/.test(effective[key] || '') ? effective[key] : '#111111'} onChange={event => setStyle(key, event.target.value)}/><BufferedField label={colorLabels[key] + ' · HEX'} value={style[key] || ''} placeholder={inherited[key] || '#000000'} onCommit={value => {value = value.trim();if(value && !/^(#[a-fA-F0-9]{6}|transparent)$/.test(value)) {onError('Renk için #RRGGBB veya transparent kullan.');return;}setStyle(key,value);}}/><button type="button" aria-label={colorLabels[key] + ' sıfırla'} onClick={() => setStyle(key, '')}>↺</button></div><div className="bePalette" aria-label={colorLabels[key] + ' paleti'}>{palette.map(value => <button type="button" key={value} style={{backgroundColor:value}} aria-label={colorLabels[key] + ' ' + value} aria-pressed={effective[key] === value} onClick={() => setStyle(key,value)}/>)}<button type="button" className="beTransparent" aria-label={colorLabels[key] + ' şeffaf'} aria-pressed={effective[key] === 'transparent'} onClick={() => setStyle(key,'transparent')}>∅</button></div></div>;
  const fontPicker = () => <FontPicker value={style.fontFamily} inherited={inherited.fontFamily} sample={node?.props.text || node?.props.title} onChange={value => setStyle('fontFamily',value)}/>;
  const background = () => <>{select('backgroundType')}{color('backgroundColor')}{effective.backgroundType === 'gradient' && <>{color('gradientColor')}{numbers(['gradientAngle'])}</>}</>;
  if (!node) return <div className="beInspectorBody"><small>SAYFA TEMASI</small><h2>Tasarımın temeli.</h2><p>Bir bileşene tıkla veya sayfanın genel renklerini ve yazı tipini düzenle.</p>{fontPicker()}{color('color')}<details open><summary>Arka plan</summary>{background()}</details><div className="beHint">Bileşenlerde seçtiğin fontlar sayfa fontunun önüne geçer. Mobil ve tablet ayarları bileşen bazında düzenlenir.</div></div>;
  return <><div className="beInspectorTitle"><small>{WIDGETS[node.type].label.toUpperCase()}</small><BufferedField label="Katman adı" value={node.name} maxLength={100} onCommit={name => onUpdate({name})}/></div><div className="beTabs"><button type="button" aria-pressed={tab === 'content'} onClick={() => setTab('content')}>İçerik</button><button type="button" aria-pressed={tab === 'style'} onClick={() => setTab('style')}>Tasarım</button></div><div className="beInspectorBody" ref={contentRef}>
    {tab === 'content' ? <>
      {Object.hasOwn(EXTRA_WIDGETS,node.type)&&<WidgetFields node={node} products={products} pages={pages} onProps={props=>onUpdate({props})} onAsset={onAsset} onOpenShared={onOpenShared}/>}
      {node.type === 'siteSection' && <><p className="beHint">Sitedeki özgün bölüm. Metne veya logoya tıklayarak ilgili alanı seçebilirsin.</p>{Object.entries(HOME_SECTIONS[node.props.section].fields).map(([key, field]) => <div key={key}>
        {field.type === 'image' && <>{node.props[key] && <img className="beAssetPreview" src={node.props[key]} alt={field.label}/>}<button className="beWideButton" onClick={() => onAsset(key)}>{field.label} seç / yükle</button></>}
        <BufferedField data-home-field-input={key} label={field.label} multiline={field.type === 'multiline'} value={node.props[key] ?? field.value} onCommit={value => prop(key,value)}/>
      </div>)}</>}
      {!Object.hasOwn(EXTRA_WIDGETS,node.type) && 'text' in node.props && <BufferedField key={node.id + 'text'} label="Metin" multiline value={node.props.text} onCommit={value => prop('text', value)}/>}
      {!Object.hasOwn(EXTRA_WIDGETS,node.type) && node.type !== 'siteSection' && 'title' in node.props && <BufferedField key={node.id + 'title'} label="Başlık" value={node.props.title} onCommit={value => prop('title', value)}/>}
      {node.type === 'heading' && <label className="beField"><span>Başlık seviyesi</span><select value={node.props.level} onChange={event => prop('level', event.target.value)}>{['h1','h2','h3','h4'].map(level => <option key={level}>{level}</option>)}</select></label>}
      {node.type === 'image' && <>{node.props.src && <img className="beAssetPreview" src={node.props.src} alt="Seçili görsel"/>}<button className="beWideButton" onClick={() => onAsset('src')}>Görsel seç / yükle</button><BufferedField label="Görsel adresi" value={node.props.src} onCommit={value => prop('src', value)}/><BufferedField label="Alternatif metin" value={node.props.alt} onCommit={value => prop('alt', value)}/></>}
      {!Object.hasOwn(EXTRA_WIDGETS,node.type) && 'href' in node.props && <BufferedField label="Bağlantı adresi" value={node.props.href} onCommit={value => prop('href', value)}/>}
      {node.type === 'button' && <label className="beCheck"><input type="checkbox" checked={node.props.newTab} onChange={event => prop('newTab', event.target.checked)}/>Yeni sekmede aç</label>}
      {node.type === 'quote' && <BufferedField label="Kaynak / kişi" value={node.props.author} onCommit={value => prop('author', value)}/>}
      {node.type === 'video' && <><BufferedField label="MP4 / WebM adresi" value={node.props.src} onCommit={value => prop('src', value)}/><BufferedField label="Kapak görseli" value={node.props.poster} onCommit={value => prop('poster', value)}/><button onClick={() => onAsset('poster')}>Kapak seç</button></>}
      {['section','siteSection'].includes(node.type) && <BufferedField label="Bölüm bağlantısı (# olmadan)" value={node.props.anchor} onCommit={value => prop('anchor', value)}/>}
      {node.type === 'products' && <><label className="beField"><span>Vitrin düzeni</span><select aria-label="Vitrin düzeni" value={node.props.layout||'grid'} onChange={e=>prop('layout',e.target.value)}><option value="grid">Izgara</option><option value="rail">Yatay şerit</option><option value="feature">Öne çıkan</option></select></label><BufferedField type="number" label="Ürün sayısı" min="1" max="24" value={node.props.limit} onCommit={value => prop('limit', Number(value))}/><label className="beField"><span>Label</span><select value={node.props.imprint} onChange={event => prop('imprint', event.target.value)}><option value="all">Tümü</option><option value="sideii">SIDE:II</option><option value="lethargia">Lethargia</option></select></label><p className="beHint">Vitrin gerçek, yayımlanmış ürünleri kullanır. Fiyat ve stok ürün yönetiminden gelir.</p></>}
      {node.type === 'native' && <p className="beHint">{SLOT_LABELS[node.props.slot]} mevcut mağaza işlevini kullanır. Konumunu ve çevresindeki düzeni buradan değiştirebilirsin.</p>}
      {CONTAINERS.has(node.type) && <p className="beHint">Bileşenleri bu kapsayıcıya sürükle. Sütun, aralık ve hizalama için Tasarım sekmesini aç.</p>}
    </> : <>
      <div className="beBreakpoint">{device === 'desktop' ? 'MASAÜSTÜ · TEMEL' : device === 'tablet' ? 'TABLET · ≤900 PX' : 'MOBİL · ≤600 PX'}<button title="Bu cihazın stillerini sıfırla" onClick={() => onUpdate({[styleKey]: {}})}>Sıfırla</button></div>
      <details open={!['image','video','spacer','divider','native'].includes(node.type)}><summary>Tipografi</summary>{node.type === 'siteSection' && <p className="beHint">Bölümün ana başlığını düzenler.</p>}{fontPicker()}<label className="beField"><span>Hazır metin stili</span><select aria-label="Hazır metin stili" value="" onChange={event => {if(event.target.value) setStyles(typographyPreset(event.target.value,device));}}><option value="">Bir stil uygula…</option>{TYPOGRAPHY_PRESETS.map(preset => <option key={preset.id} value={preset.id}>{preset.label}</option>)}</select></label>{numbers(['fontSize','lineHeight','letterSpacing','wordSpacing'])}{select('fontWeight')}{select('fontStyle')}{select('textDecoration')}{select('textTransform')}{select('textAlign')}{color('color')}</details>
      {['image','video'].includes(node.type) && <details open><summary>Görsel boyutu ve kırpma</summary>{select('aspectRatio')}{select('objectFit')}{numbers(['mediaHeight'])}<p className="beHint">Sabit yükseklik en / boy oranının önüne geçer. Alanı boşaltarak miras alınan ölçüye dön.</p><div className="beFocalControl"><span>Odak noktası</span><div className="beFocalGrid" role="group" aria-label="Görsel odak noktası">{focalPoints.map(([value,label]) => <button key={value} type="button" aria-label={'Odak: ' + label} aria-pressed={(effective.objectPosition || 'center') === value} onClick={() => setStyle('objectPosition',value)}>●</button>)}</div><button type="button" onClick={() => setStyle('objectPosition','')}>Odağı sıfırla</button></div></details>}
      <details open={CONTAINERS.has(node.type)}><summary>Yerleşim</summary>{numbers(['width','maxWidth','minHeight',...(node.type === 'columns' ? ['columns',...(effective.columns===2?['columnSplit']:[])] : []),'gap'])}{CONTAINERS.has(node.type) && <>{select('direction')}{select('alignItems')}{select('justifyContent')}</>}{select('display')}</details>
      <details><summary>Boşluklar</summary>{numbers(['paddingTop','paddingRight','paddingBottom','paddingLeft','marginTop','marginBottom'])}</details>
      <details><summary>Arka plan</summary>{background()}</details>
      <details><summary>Çerçeve ve efektler</summary>{select('borderStyle')}{color('borderColor')}{numbers(['borderRadius','borderWidth','opacity'])}{select('boxShadow')}</details>
    </>}
  </div></>;
}
