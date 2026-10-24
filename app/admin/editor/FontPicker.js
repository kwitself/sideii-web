'use client';
import {useEffect, useRef, useState} from 'react';
import {FONT_CATALOG, FONT_CATEGORIES, FONT_VALUES} from '../../lib/builder-fonts';
import '../../components/builder/builder-fonts.css';

export default function FontPicker({value, inherited, sample, onChange}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const search = useRef(null), trigger = useRef(null);
  const selected = FONT_CATALOG.find(font => font.id === (value || inherited));
  const results = FONT_CATALOG.filter(font => (category === 'all' || font.category === category) && font.label.toLowerCase().includes(query.trim().toLowerCase()));
  useEffect(() => {if (open) search.current?.focus();}, [open]);
  function choose(id) {onChange(id);setOpen(false);trigger.current?.focus();}
  return <div className="beFontPicker">
    <div className="beControlLabel"><span>Yazı tipi</span><button type="button" aria-label="Yazı tipini sıfırla" disabled={!value} onClick={() => choose('')}>Sıfırla</button></div>
    <button ref={trigger} type="button" className="beFontTrigger" aria-expanded={open} aria-label="Yazı tipi seç" onClick={() => setOpen(current => !current)}><span>{selected?.label || 'Sitenin yazı tipi'}{!value && <small> · Miras</small>}</span><span aria-hidden="true">{open ? '−' : '+'}</span></button>
    <div className="beFontSample" style={{fontFamily: FONT_VALUES[value || inherited] || 'inherit'}} lang="tr">{sample?.trim().slice(0, 100) || 'Müziğin başka bir hâli. Aa 0123'}<small>Çç Ğğ Iı İi Öö Şş Üü</small></div>
    {open && <div className="beFontMenu" onKeyDown={event => {if(event.key === 'Escape') {event.stopPropagation();setOpen(false);trigger.current?.focus();}}}>
      <input ref={search} aria-label="Font ara" type="search" placeholder="Font adı ara…" value={query} onChange={event => setQuery(event.target.value)}/>
      <div className="beFontCategories" aria-label="Font kategorileri">{Object.entries(FONT_CATEGORIES).map(([key, label]) => <button key={key} type="button" aria-pressed={category === key} onClick={() => setCategory(key)}>{label}</button>)}</div>
      <div className="beFontResults" aria-label="Font seçenekleri">{results.map(font => <button key={font.id} type="button" aria-pressed={value === font.id} onClick={() => choose(font.id)}><span style={{fontFamily: font.family}}>{font.label}</span><small>{FONT_CATEGORIES[font.category]}{value === font.id ? ' · Seçili' : ''}</small></button>)}{!results.length && <p role="status">Eşleşen font yok.</p>}</div>
      <p className="beHint">15 font · Türkçe karakter desteği</p>
    </div>}
  </div>;
}
