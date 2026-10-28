'use client';
import {useEffect, useRef, useState} from 'react';
import {FONT_CATALOG, FONT_CATEGORIES} from '../../lib/builder-fonts';
import {useSiteDesign} from '../../components/builder/SiteDesignProvider';
import {fontFamily} from '../../lib/builder-design';
import '../../components/builder/builder-fonts.css';

export default function FontPicker({value, inherited, sample, onChange, label='Yazı tipi'}) {
  const site=useSiteDesign(),catalog=[...FONT_CATALOG,...site.fonts.map(f=>({id:f.id,label:f.name,category:'custom',family:fontFamily(f.id)}))],categories={...FONT_CATEGORIES,custom:'Özel'};
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const search = useRef(null), trigger = useRef(null);
  const selected = catalog.find(font => font.id === (value || inherited));
  const themeFont = catalog.find(font => font.id === inherited);
  const results = catalog.filter(font => (category === 'all' || font.category === category) && font.label.toLowerCase().includes(query.trim().toLowerCase()));
  useEffect(() => {if (open) search.current?.focus();}, [open]);
  function choose(id) {onChange(id);setOpen(false);trigger.current?.focus();}
  return <div className="beFontPicker">
    <div className="beControlLabel"><span>{label}</span><button type="button" aria-label={label+' sıfırla'} disabled={!value} onClick={() => choose('')}>Sıfırla</button></div>
    <button ref={trigger} type="button" className="beFontTrigger" aria-expanded={open} aria-label={label+' seç'} onClick={() => setOpen(current => !current)}><span>{selected?.label || 'Sitenin yazı tipi'}{!value && <small> · Temadan</small>}</span><span aria-hidden="true">{open ? '−' : '+'}</span></button>
    <div className="beFontSample" style={{fontFamily: fontFamily(value || inherited)}} lang="tr">{sample?.trim().slice(0, 100) || 'Müziğin başka bir hâli. Aa 0123'}<small>Çç Ğğ Iı İi Öö Şş Üü</small></div>
    {open && <div className="beFontMenu" onKeyDown={event => {if(event.key === 'Escape') {event.stopPropagation();setOpen(false);trigger.current?.focus();}}}>
      <input ref={search} aria-label="Font ara" type="search" placeholder="Font adı ara…" value={query} onChange={event => setQuery(event.target.value)}/>
      <div className="beFontCategories" aria-label="Font kategorileri">{Object.entries(categories).map(([key, label]) => <button key={key} type="button" aria-pressed={category === key} onClick={() => setCategory(key)}>{label}</button>)}</div>
      <div className="beFontResults" aria-label="Font seçenekleri"><button type="button" aria-pressed={!value} onClick={()=>choose('')}><span style={{fontFamily:fontFamily(inherited)}}>Temadan al{themeFont?' · '+themeFont.label:''}</span><small>Varsayılan{!value?' · Seçili':''}</small></button>{results.map(font => <button key={font.id} type="button" aria-pressed={value === font.id} onClick={() => choose(font.id)}><span style={{fontFamily: font.family}}>{font.label}</span><small>{categories[font.category]}{value === font.id ? ' · Seçili' : ''}</small></button>)}{!results.length && <p role="status">Eşleşen font yok.</p>}</div>
      <p className="beHint">{catalog.length} font · Türkçe karakter önizlemesi</p>
    </div>}
  </div>;
}
