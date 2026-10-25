import {safeUrl} from './builder-url.js';
export {safeUrl} from './builder-url.js';
import {validFontId, fontFamily, validateSiteSettings, validateSeo} from './builder-design.js';
import {validateRuns} from './builder-rich-text.js';
import {EXTRA_WIDGETS, widgetDefaults, validateWidgetProps} from './builder-widgets.js';
import {HOME_SECTIONS, homeSectionProps} from './home-sections.js';
import {FONT_CATALOG, FONT_VALUES} from './builder-fonts.js';
export {FONT_VALUES} from './builder-fonts.js';
// Shared document contract: the editor, API and public renderer use the same rules.
export const SCHEMA_VERSION = 1;
export const MAX_NODES = 300;
export const MAX_DEPTH = 8;
export const MAX_DOCUMENT_BYTES = 400000;
export const CONTAINERS = new Set(['section', 'columns', 'stack']);
export const WIDGETS = {
  ...EXTRA_WIDGETS,
  section: {label: 'Bölüm', icon: '▱'}, columns: {label: 'Sütunlar', icon: '▥'},
  stack: {label: 'Kapsayıcı', icon: '▤'}, heading: {label: 'Başlık', icon: 'H'},
  text: {label: 'Metin', icon: '¶'}, image: {label: 'Görsel', icon: '▧'},
  button: {label: 'Buton / bağlantı', icon: '↗'}, divider: {label: 'Ayırıcı', icon: '―'},
  spacer: {label: 'Boşluk', icon: '↕'}, quote: {label: 'Alıntı', icon: '“'},
  video: {label: 'Video', icon: '▷'}, accordion: {label: 'Açılır içerik', icon: '≡'},
  products: {label: 'Ürün vitrini', icon: '◫'}, native: {label: 'Mağaza bileşeni', icon: 'II'},
  siteSection: {label: 'Site bölümü', icon: 'II'},
};
export const NATIVE_SLOTS = {
  home: [], store: ['store-catalogue'],
  product: ['product-hero', 'product-imprint', 'product-gallery', 'product-listen', 'product-tracks', 'product-note', 'product-related'],
};
export const SLOT_LABELS = {'store-catalogue': 'Katalog ve filtreler', 'product-hero': 'Ürün ve satın alma', 'product-imprint': 'Label kimliği', 'product-gallery': 'Ürün galerisi', 'product-listen': 'Dinleme / kitapçık', 'product-tracks': 'Parça listesi', 'product-note': 'Ürün notu ve katkılar', 'product-related': 'İlgili ürünler'};
export const STYLE_FIELDS = {
  paddingTop: [0, 240], paddingRight: [0, 160], paddingBottom: [0, 240], paddingLeft: [0, 160],
  marginTop: [-100, 240], marginBottom: [-100, 240], gap: [0, 160],
  fontSize: [10, 180], lineHeight: [0.8, 3], letterSpacing: [-5, 30], wordSpacing: [-5, 30],
  minHeight: [0, 1200], maxWidth: [100, 2400], width: [10, 100],
  borderRadius: [0, 200], borderWidth: [0, 12], opacity: [0, 1], columns: [1, 6],
  columnSplit: [10, 90], mediaHeight: [40, 1200], gradientAngle: [0, 360],
};
export const STYLE_ENUMS = {
  textAlign: ['left', 'center', 'right'], alignItems: ['stretch', 'flex-start', 'center', 'flex-end'],
  justifyContent: ['flex-start', 'center', 'flex-end', 'space-between'],
  direction: ['column', 'row'], fontFamily: FONT_CATALOG.map(font => font.id), fontWeight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  objectFit: ['cover', 'contain'], display: ['show', 'hide'],
  fontStyle: ['normal', 'italic'], textDecoration: ['none', 'underline', 'line-through'],
  textTransform: ['none', 'uppercase', 'lowercase', 'capitalize'],
  objectPosition: ['center', 'top', 'bottom', 'left', 'right', 'left top', 'right top', 'left bottom', 'right bottom'],
  aspectRatio: ['auto', '1:1', '4:3', '3:4', '16:9', '9:16', '3:2', '2:3', '21:9'],
  backgroundType: ['solid', 'gradient'], borderStyle: ['solid', 'dashed', 'dotted', 'double'],
  boxShadow: ['none', 'soft', 'medium', 'strong', 'glow'],
};
const SHADOW_VALUES = {none: 'none', soft: '0 4px 16px #00000026', medium: '0 12px 32px #00000059', strong: '0 24px 64px #00000080', glow: '0 0 36px #ffffff26'};
const TYPOGRAPHY_FIELDS = ['fontSize', 'lineHeight', 'letterSpacing', 'wordSpacing', 'fontFamily', 'fontWeight', 'fontStyle', 'textDecoration', 'textTransform', 'textAlign'];
const MEDIA_FIELDS = ['mediaHeight', 'aspectRatio', 'objectFit', 'objectPosition'];
const propsByType = {
  section: ['anchor'], columns: [], stack: [], heading: ['text', 'level'], text: ['text'],
  image: ['src', 'alt', 'href'], button: ['text', 'href', 'newTab'], divider: [], spacer: [],
  quote: ['text', 'author'], video: ['src', 'poster'], accordion: ['title', 'text'],
  products: ['title', 'limit', 'imprint', 'layout'], native: ['slot'],
};
const plain = value => !!value && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) !== null;
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const fail = message => {throw new Error(message);};
export const cloneDocument = value => JSON.parse(JSON.stringify(value));
export function newNodeId() {return 'n' + globalThis.crypto.randomUUID().replaceAll('-', '');}
export function validPageKey(key) {return ['home', 'store', 'product', 'site'].includes(key) || /^(?:page|block):[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key) && key.length <= 85;}
export function pagePath(key) {return key === 'home' ? '/' : key === 'store' ? '/store' : key === 'product' ? '/store' : '/pages/' + key.slice(5);}
export function validateStyle(style = {}) {
  if (!plain(style)) fail('Geçersiz stil verisi.');
  const result = {};
  for (const [key, value] of Object.entries(style)) {
    if (own(STYLE_FIELDS, key)) {
      const [min, max] = STYLE_FIELDS[key];
      if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || key === 'columns' && !Number.isInteger(value)) fail('Geçersiz stil: ' + key);
    } else if (own(STYLE_ENUMS, key)) {
      if (!(key === 'fontFamily' ? validFontId(value) : STYLE_ENUMS[key].includes(value))) fail('Geçersiz stil: ' + key);
    } else if (['color', 'backgroundColor', 'borderColor', 'gradientColor'].includes(key)) {
      if (typeof value !== 'string' || !/^(#[a-fA-F0-9]{6}|transparent)$/.test(value)) fail('Geçersiz renk.');
    } else fail('Desteklenmeyen stil: ' + key);
    result[key] = value;
  }
  return result;
}
export function validateDocument(input, pageKey = 'home', {publishing = false} = {}) {
  if (!validPageKey(pageKey)) fail('Geçersiz sayfa adresi.');
  if (!plain(input) || input.schemaVersion !== SCHEMA_VERSION || !Array.isArray(input.children)) fail('Desteklenmeyen sayfa dosyası.');
  if (new TextEncoder().encode(JSON.stringify(input)).length > MAX_DOCUMENT_BYTES) fail('Sayfa dosyası çok büyük.');
  const ids = new Set(), slots = new Set(), anchors = new Set(['top']); let count = 0;
  const walk = (node, depth, hidden = false) => {
    if (++count > MAX_NODES || depth > MAX_DEPTH) fail('En fazla 300 bileşen ve 8 iç içe seviye kullanılabilir.');
    if (!plain(node) || !own(WIDGETS, node.type) || !/^n[a-zA-Z0-9_-]{1,70}$/.test(node.id) || ids.has(node.id)) fail('Geçersiz veya tekrarlanan bileşen.');
    ids.add(node.id);
    if (typeof node.name !== 'string' || node.name.length > 100) fail('Bileşen adı en fazla 100 karakter olmalı.');
    if (!plain(node.props)) fail('Geçersiz bileşen ayarları.');
    const homeSection = node.type === 'siteSection';
    if (homeSection && !own(HOME_SECTIONS, node.props.section)) fail('Geçersiz site bölümü.');
    const fields = homeSection ? HOME_SECTIONS[node.props.section].fields : {};
    const extra = Object.hasOwn(EXTRA_WIDGETS, node.type);
    const allowedProps = extra ? [] : homeSection ? ['section', 'anchor', ...Object.keys(fields)] : propsByType[node.type];
    const props = extra ? validateWidgetProps(node.type, node.props, pageKey) : {};
    for (const [key, value] of Object.entries(extra ? {} : homeSection ? {...homeSectionProps(node.props.section), ...node.props} : node.props)) {
      if (!allowedProps.includes(key)) fail('Desteklenmeyen bileşen ayarı.');
      if (key === 'newTab') {if (typeof value !== 'boolean') fail('Geçersiz bağlantı hedefi.');}
      else if (key === 'limit') {if (!Number.isInteger(value) || value < 1 || value > 24) fail('Ürün sayısı 1–24 olmalı.');}
      else if (typeof value !== 'string' || value.length > (key === 'text' || fields[key]?.type === 'multiline' ? 12000 : 2048)) fail('Geçersiz metin.');
      if (['src', 'href', 'poster'].includes(key) && value && !safeUrl(value, key !== 'href')) fail('Güvenli bir HTTPS adresi veya site içi yol kullanın.');
      if (['url', 'image'].includes(fields[key]?.type) && value && !safeUrl(value, fields[key].type === 'image')) fail('Güvenli bir HTTPS adresi veya site içi yol kullanın.');
      if (key === 'layout' && !['grid','rail','feature'].includes(value)) fail('Geçersiz vitrin düzeni.');
      if (key === 'level' && !['h1', 'h2', 'h3', 'h4'].includes(value)) fail('Geçersiz başlık seviyesi.');
      if (key === 'anchor' && value && !/^[a-zA-Z][a-zA-Z0-9_-]{0,60}$/.test(value)) fail('Geçersiz bölüm bağlantısı.');
      if (key === 'anchor' && value) {if (anchors.has(value)) fail('Bölüm bağlantıları benzersiz olmalı.'); anchors.add(value);}
      if (key === 'imprint' && !['all', 'sideii', 'lethargia'].includes(value)) fail('Geçersiz label.');
      props[key] = value;
    }
    const style = validateStyle(node.style || {}), tablet = validateStyle(node.tablet || {}), mobile = validateStyle(node.mobile || {});
    const invisible = hidden || [style, tablet, mobile].some(x => x.display === 'hide' || x.opacity === 0);
    if (node.type === 'native') {
      const allowed = NATIVE_SLOTS[pageKey] || [];
      if (!allowed.includes(props.slot) || slots.has(props.slot)) fail('Bu mağaza bileşeni burada kullanılamaz veya zaten var.');
      slots.add(props.slot);
      if (publishing && ['store-catalogue', 'product-hero'].includes(props.slot) && invisible) fail('Satın alma ve katalog bileşenleri gizlenemez.');
    }
    if (!Array.isArray(node.children) || !CONTAINERS.has(node.type) && node.children.length) fail('Bileşen içeriği geçersiz.');
    const richText = {};
    for (const [key, runs] of Object.entries(node.richText || {})) {
      const allowed = homeSection ? ['text','multiline'].includes(fields[key]?.type) : ['heading','text','button','quote','accordion'].includes(node.type) && ['text','title'].includes(key);
      if (!allowed || typeof props[key] !== 'string') fail('Bu alan metin biçimlendirmesini desteklemiyor.');
      richText[key] = validateRuns(runs, props[key], !homeSection && node.type !== 'button');
    }
    return {...(Object.keys(richText).length ? {richText} : {}), id: node.id, type: node.type, name: node.name, props, style, tablet, mobile, children: node.children.map(child => walk(child, depth + 1, invisible))};
  };
  const theme = validateStyle(input.theme || {});
  const children = input.children.map(node => walk(node, 1, theme.display === 'hide' || theme.opacity === 0));
  if (publishing) {
    if (!children.length && pageKey !== 'site') fail('Boş sayfa yayımlanamaz.');
    if (pageKey === 'store' && !slots.has('store-catalogue') || pageKey === 'product' && !slots.has('product-hero')) fail('Katalog / satın alma bileşenini sayfaya ekleyin.');
  }
  if (pageKey === 'site' && children.length) fail('Site ayarlarına bileşen eklenemez.');
  if (input.site && pageKey !== 'site') fail('Site ayarları yalnızca ortak tasarım sayfasında kullanılabilir.');
  return {schemaVersion: SCHEMA_VERSION, theme, children, ...(input.seo ? {seo:validateSeo(input.seo)} : {}), ...(pageKey === 'site' ? {site:validateSiteSettings(input.site)} : {})};
}
export function createNode(type, extra = {}) {
  if (!own(WIDGETS, type)) fail('Bilinmeyen bileşen.');
  const defaults = {
    heading: {text: 'Yeni başlık', level: 'h2'}, text: {text: 'Hikâyeni burada anlat.'},
    image: {src: '', alt: '', href: ''}, button: {text: 'Keşfet →', href: '/store', newTab: false},
    video: {src: '', poster: ''}, quote: {text: 'Music, in another form.', author: 'SIDE:II'},
    accordion: {title: 'Başlık', text: 'Açılır bölüm içeriği.'}, products: {title: 'Selected editions', limit: 3, imprint: 'all'},
    section: {anchor: ''}, native: {slot: ''}, siteSection: homeSectionProps('hero'),
  };
  const styles = {section: {paddingTop: 64, paddingBottom: 64, paddingLeft: 32, paddingRight: 32}, columns: {columns: 2, gap: 24}, stack: {gap: 24}, heading: {fontSize: 48, lineHeight: 1.1}, text: {fontSize: 18, lineHeight: 1.65}, spacer: {minHeight: 48}, image: {objectFit: 'cover'}};
  return {id: newNodeId(), type, name: WIDGETS[type].label, props: {...defaults[type], ...widgetDefaults(type)}, style: {...styles[type]}, tablet: {}, mobile: type === 'columns' ? {columns: 1} : type === 'heading' ? {fontSize: 32} : {}, children: [], ...extra};
}
export function findNode(document, id) {for (const node of document.children) {if (node.id === id) return node; const match = findNode(node, id); if (match) return match;} return null;}
export function findLocation(document, id, parentId = null) {for (let index = 0; index < document.children.length; index++) {const node = document.children[index]; if (node.id === id) return {parentId, index}; const match = findLocation(node, id, node.id); if (match) return match;} return null;}
export function updateNode(document, id, update) {const next = cloneDocument(document), node = findNode(next, id); if (node) Object.assign(node, typeof update === 'function' ? update(node) : update); return next;}
export function removeNode(document, id) {const next = cloneDocument(document), location = findLocation(next, id); if (!location) return next; const parent = location.parentId ? findNode(next, location.parentId) : next; parent.children.splice(location.index, 1); return next;}
export function insertNode(document, node, parentId = null, index = null) {
  const next = cloneDocument(document), parent = parentId ? findNode(next, parentId) : next;
  if (!parent || parentId && !CONTAINERS.has(parent.type)) fail('Bu bileşenin içine eklenemez.');
  parent.children.splice(index == null ? parent.children.length : Math.max(0, Math.min(index, parent.children.length)), 0, cloneDocument(node));
  return next;
}
export function moveNode(document, id, parentId, index) {
  const node = findNode(document, id), location = findLocation(document, id);
  if (!node || !location) return document;
  if (id === parentId || parentId && findNode(node, parentId)) fail('Bir bileşen kendi içine taşınamaz.');
  const adjusted = location.parentId === parentId && location.index < index ? index - 1 : index;
  return insertNode(removeNode(document, id), node, parentId, adjusted);
}
export function duplicateNode(document, id) {
  const original = findNode(document, id), location = findLocation(document, id);
  if (!original) return document;
  const duplicate = cloneNodeTree(original);
  duplicate.name += ' kopya';
  return insertNode(document, duplicate, location.parentId, location.index + 1);
}
export function cloneNodeTree(original) {
  const duplicate = cloneDocument(original);
  const renew = node => {if (node.type === 'native') fail('Mağaza bileşeni çoğaltılamaz.'); node.id = newNodeId(); if (node.props.anchor) node.props.anchor = node.props.anchor.slice(0,50) + '-' + node.id.slice(-6); node.children.forEach(renew);};
  renew(duplicate); return duplicate;
}
export function flattenNodes(document) {return document.children.flatMap(node => [node, ...flattenNodes(node)]);}
export function inheritedNodeStyle(document, id, device = 'desktop') {
  // Only inheritable properties flow from a parent. Backgrounds, borders and
  // dimensions belong to their own box; device overrides do inherit those.
  const inheritedFields = new Set([...TYPOGRAPHY_FIELDS.filter(key => key !== 'textDecoration'), 'color']);
  const pick = style => Object.fromEntries(Object.entries(style).filter(([key]) => inheritedFields.has(key)));
  const walk = (children, parent) => {
    for (const node of children) {
      const previous = device === 'desktop' ? {} : {...node.style, ...(device === 'mobile' ? node.tablet : {})};
      if (node.id === id) return {...parent, ...previous};
      const effective = {...node.style, ...(device !== 'desktop' ? node.tablet : {}), ...(device === 'mobile' ? node.mobile : {})};
      const found = walk(node.children, {...parent, ...pick(effective)});
      if (found) return found;
    }
    return null;
  };
  return walk(document.children, pick(document.theme)) || {};
}
export function documentCss(document, scope = '') {
  const root = scope ? '.pbRoot[data-pb-scope="' + scope + '"]' : '.pbRoot';
  const toCss = (style, type, effective = style) => {
    const declarations = Object.entries(style).map(([key, value]) => {
      if (key === 'columnSplit') return effective.columns === 2 ? `grid-template-columns:${value}fr ${100-value}fr` : '';
      if (key === 'columns') return `grid-template-columns:repeat(${value},minmax(0,1fr))`;
      if (key === 'direction') return `flex-direction:${value}`;
      if (key === 'fontFamily') return `font-family:${fontFamily(value)}`;
      if (key === 'boxShadow') return `box-shadow:${SHADOW_VALUES[value]}`;
      if (key === 'mediaHeight') return `height:${value}px`;
      if (key === 'aspectRatio') return `aspect-ratio:${value.replace(':', ' / ')}`;
      if (['backgroundType', 'gradientColor', 'gradientAngle'].includes(key)) return '';
      if (key === 'display') return `display:${value === 'hide' ? 'none' : type === 'columns' ? 'grid' : CONTAINERS.has(type) ? 'flex' : 'block'}!important`;
      const property = key.replace(/[A-Z]/g, c => '-' + c.toLowerCase());
      const unit = key === 'width' ? '%' : own(STYLE_FIELDS, key) && !['lineHeight', 'opacity'].includes(key) ? 'px' : '';
      return `${property}:${value}${unit}`;
    }).filter(Boolean);
    // Rebuild composite backgrounds from the effective device cascade. A mobile
    // end-colour change must retain the desktop start colour and gradient angle.
    if (['backgroundType', 'backgroundColor', 'gradientColor', 'gradientAngle'].some(key => own(style, key))) {
      declarations.push(effective.backgroundType === 'gradient'
        ? `background-image:linear-gradient(${effective.gradientAngle ?? 135}deg,${effective.backgroundColor || '#171719'},${effective.gradientColor || '#38383e'})`
        : 'background-image:none');
    }
    return declarations.join(';');
  };
  const nodes = flattenNodes(document);
  const selector = node => `${root} [data-pb-id="${node.id}"]`;
  const rule = (node, style, effective = style) => {
    if (['image', 'video'].includes(node.type)) {
      const media = Object.fromEntries(Object.entries(style).filter(([key]) => MEDIA_FIELDS.includes(key)));
      const layout = Object.fromEntries(Object.entries(style).filter(([key]) => !MEDIA_FIELDS.includes(key)));
      return `${selector(node)}{${toCss(layout,node.type,effective)}}${selector(node)} :is(img,video){${toCss(media)}}`;
    }
    if (node.type !== 'siteSection') return `${selector(node)}{${toCss(style,node.type,effective)}}`;
    const heading = Object.fromEntries(Object.entries(style).filter(([key]) => TYPOGRAPHY_FIELDS.includes(key)));
    const layout = Object.fromEntries(Object.entries(style).filter(([key]) => !TYPOGRAPHY_FIELDS.includes(key)));
    return `${selector(node)}{${toCss(layout,node.type,effective)}}${selector(node)} [data-home-title]{${toCss(heading)}}` +
      (style.color ? `${selector(node)} [data-home-field]{color:${style.color}}` : '');
  };
  // The native home design has explicit font declarations; a page font is an
  // intentional override, with per-section typography still taking precedence.
  const homeFont = document.theme.fontFamily ? `${root} .pb-siteSection [data-home-field]{font-family:${fontFamily(document.theme.fontFamily)}}` : '';
  return `.pbCanvas ${root}{${toCss(document.theme)}}${homeFont}` + nodes.map(node => rule(node,node.style)).join('') +
    `@container pbCanvas (max-width:900px){${nodes.map(node => rule(node,node.tablet,{...node.style,...node.tablet})).join('')}}` +
    `@container pbCanvas (max-width:600px){${nodes.map(node => rule(node,node.mobile,{...node.style,...node.tablet,...node.mobile})).join('')}}`;
}

export function sharedKeys(document) {return [...new Set(flattenNodes(document).filter(n=>n.type==='shared').map(n=>n.props.key))];}
export function scopeSharedDocument(document, instance) {const copy=cloneDocument(document);for(const node of flattenNodes(copy)){node.id=instance+'_'+node.id;if(node.props.anchor)node.props.anchor=instance+'_'+node.props.anchor;}return copy;}
