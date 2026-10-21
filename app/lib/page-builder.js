// Shared document contract: the editor, API and public renderer use the same rules.
export const SCHEMA_VERSION = 1;
export const MAX_NODES = 300;
export const MAX_DEPTH = 8;
export const MAX_DOCUMENT_BYTES = 400000;
export const CONTAINERS = new Set(['section', 'columns', 'stack']);
export const WIDGETS = {
  section: {label: 'Bölüm', icon: '▱'}, columns: {label: 'Sütunlar', icon: '▥'},
  stack: {label: 'Kapsayıcı', icon: '▤'}, heading: {label: 'Başlık', icon: 'H'},
  text: {label: 'Metin', icon: '¶'}, image: {label: 'Görsel', icon: '▧'},
  button: {label: 'Buton / bağlantı', icon: '↗'}, divider: {label: 'Ayırıcı', icon: '―'},
  spacer: {label: 'Boşluk', icon: '↕'}, quote: {label: 'Alıntı', icon: '“'},
  video: {label: 'Video', icon: '▷'}, accordion: {label: 'Açılır içerik', icon: '≡'},
  products: {label: 'Ürün vitrini', icon: '◫'}, native: {label: 'Mağaza bileşeni', icon: 'II'},
};
export const NATIVE_SLOTS = {
  home: [], store: ['store-catalogue'],
  product: ['product-hero', 'product-imprint', 'product-gallery', 'product-listen', 'product-tracks', 'product-note', 'product-related'],
};
export const SLOT_LABELS = {'store-catalogue': 'Katalog ve filtreler', 'product-hero': 'Ürün ve satın alma', 'product-imprint': 'Label kimliği', 'product-gallery': 'Ürün galerisi', 'product-listen': 'Dinleme / kitapçık', 'product-tracks': 'Parça listesi', 'product-note': 'Ürün notu ve katkılar', 'product-related': 'İlgili ürünler'};
export const STYLE_FIELDS = {
  paddingTop: [0, 240], paddingRight: [0, 160], paddingBottom: [0, 240], paddingLeft: [0, 160],
  marginTop: [-100, 240], marginBottom: [-100, 240], gap: [0, 160],
  fontSize: [10, 180], lineHeight: [0.8, 3], letterSpacing: [-5, 30],
  minHeight: [0, 1200], maxWidth: [100, 2400], width: [10, 100],
  borderRadius: [0, 200], borderWidth: [0, 12], opacity: [0, 1], columns: [1, 6],
};
export const STYLE_ENUMS = {
  textAlign: ['left', 'center', 'right'], alignItems: ['stretch', 'flex-start', 'center', 'flex-end'],
  justifyContent: ['flex-start', 'center', 'flex-end', 'space-between'],
  direction: ['column', 'row'], fontFamily: ['sans', 'serif', 'mono'], fontWeight: ['300', '400', '500', '600', '700', '800'],
  objectFit: ['cover', 'contain'], display: ['show', 'hide'],
};
export const FONT_VALUES = {sans: 'Arial,Helvetica,sans-serif', serif: 'Georgia,serif', mono: 'monospace'};
const propsByType = {
  section: ['anchor'], columns: [], stack: [], heading: ['text', 'level'], text: ['text'],
  image: ['src', 'alt', 'href'], button: ['text', 'href', 'newTab'], divider: [], spacer: [],
  quote: ['text', 'author'], video: ['src', 'poster'], accordion: ['title', 'text'],
  products: ['title', 'limit', 'imprint'], native: ['slot'],
};
const plain = value => !!value && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) !== null;
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const fail = message => {throw new Error(message);};
export const cloneDocument = value => JSON.parse(JSON.stringify(value));
export function newNodeId() {return 'n' + globalThis.crypto.randomUUID().replaceAll('-', '');}
export function safeUrl(value, media = false) {
  if (typeof value !== 'string' || value.length > 2048 || /[\u0000-\u0020<>"'`\\]/.test(value)) return '';
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  if (!media && /^#[a-zA-Z0-9_-]+$/.test(value)) return value;
  if (!media && /^(mailto:[^@\s]+@[^@\s]+|tel:\+?[0-9()-]+)$/.test(value)) return value;
  try {const url = new URL(value); const protocol = url.protocol === 'https:' || url.protocol === 'http:' && ['127.0.0.1','localhost'].includes(url.hostname); return protocol && !url.username && !url.password ? value : '';} catch {return '';}
}
export function validPageKey(key) {return ['home', 'store', 'product'].includes(key) || /^page:[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key) && key.length <= 85;}
export function pagePath(key) {return key === 'home' ? '/' : key === 'store' ? '/store' : key === 'product' ? '/store' : '/pages/' + key.slice(5);}
export function validateStyle(style = {}) {
  if (!plain(style)) fail('Geçersiz stil verisi.');
  const result = {};
  for (const [key, value] of Object.entries(style)) {
    if (own(STYLE_FIELDS, key)) {
      const [min, max] = STYLE_FIELDS[key];
      if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || key === 'columns' && !Number.isInteger(value)) fail('Geçersiz stil: ' + key);
    } else if (own(STYLE_ENUMS, key)) {
      if (!STYLE_ENUMS[key].includes(value)) fail('Geçersiz stil: ' + key);
    } else if (['color', 'backgroundColor', 'borderColor'].includes(key)) {
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
    const props = {};
    for (const [key, value] of Object.entries(node.props)) {
      if (!propsByType[node.type].includes(key)) fail('Desteklenmeyen bileşen ayarı.');
      if (key === 'newTab') {if (typeof value !== 'boolean') fail('Geçersiz bağlantı hedefi.');}
      else if (key === 'limit') {if (!Number.isInteger(value) || value < 1 || value > 24) fail('Ürün sayısı 1–24 olmalı.');}
      else if (typeof value !== 'string' || value.length > (key === 'text' ? 12000 : 2048)) fail('Geçersiz metin.');
      if (['src', 'href', 'poster'].includes(key) && value && !safeUrl(value, key !== 'href')) fail('Güvenli bir HTTPS adresi veya site içi yol kullanın.');
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
    return {id: node.id, type: node.type, name: node.name, props, style, tablet, mobile, children: node.children.map(child => walk(child, depth + 1, invisible))};
  };
  const theme = validateStyle(input.theme || {});
  const children = input.children.map(node => walk(node, 1, theme.display === 'hide' || theme.opacity === 0));
  if (publishing) {
    if (!children.length) fail('Boş sayfa yayımlanamaz.');
    if (pageKey === 'store' && !slots.has('store-catalogue') || pageKey === 'product' && !slots.has('product-hero')) fail('Katalog / satın alma bileşenini sayfaya ekleyin.');
  }
  return {schemaVersion: SCHEMA_VERSION, theme, children};
}
export function createNode(type, extra = {}) {
  if (!own(WIDGETS, type)) fail('Bilinmeyen bileşen.');
  const defaults = {
    heading: {text: 'Yeni başlık', level: 'h2'}, text: {text: 'Hikâyeni burada anlat.'},
    image: {src: '', alt: '', href: ''}, button: {text: 'Keşfet →', href: '/store', newTab: false},
    video: {src: '', poster: ''}, quote: {text: 'Music, in another form.', author: 'SIDE:II'},
    accordion: {title: 'Başlık', text: 'Açılır bölüm içeriği.'}, products: {title: 'Selected editions', limit: 3, imprint: 'all'},
    section: {anchor: ''}, native: {slot: ''},
  };
  const styles = {section: {paddingTop: 64, paddingBottom: 64, paddingLeft: 32, paddingRight: 32}, columns: {columns: 2, gap: 24}, stack: {gap: 24}, heading: {fontSize: 48, lineHeight: 1.1}, text: {fontSize: 18, lineHeight: 1.65}, spacer: {minHeight: 48}, image: {objectFit: 'cover'}};
  return {id: newNodeId(), type, name: WIDGETS[type].label, props: {...defaults[type]}, style: {...styles[type]}, tablet: {}, mobile: type === 'columns' ? {columns: 1} : type === 'heading' ? {fontSize: 32} : {}, children: [], ...extra};
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
export function documentCss(document) {
  const toCss = (style,type) => Object.entries(style).map(([key, value]) => {
    if (key === 'columns') return `grid-template-columns:repeat(${value},minmax(0,1fr))`;
    if (key === 'direction') return `flex-direction:${value}`;
    if (key === 'fontFamily') return `font-family:${FONT_VALUES[value]}`;
    if (key === 'display') return `display:${value === 'hide' ? 'none' : type === 'columns' ? 'grid' : CONTAINERS.has(type) ? 'flex' : 'block'}!important`;
    const property = key.replace(/[A-Z]/g, c => '-' + c.toLowerCase());
    const unit = key === 'width' ? '%' : own(STYLE_FIELDS, key) && !['lineHeight', 'opacity'].includes(key) ? 'px' : '';
    return `${property}:${value}${unit}`;
  }).join(';');
  const nodes = flattenNodes(document);
  const selector = node => `.pbRoot [data-pb-id="${node.id}"]`;
  return `.pbRoot{${toCss(document.theme)}}` + nodes.map(node => `${selector(node)}{${toCss(node.style,node.type)}}`).join('') +
    `@container pbCanvas (max-width:900px){${nodes.map(node => `${selector(node)}{${toCss(node.tablet,node.type)}}`).join('')}}` +
    `@container pbCanvas (max-width:600px){${nodes.map(node => `${selector(node)}{${toCss(node.mobile,node.type)}}`).join('')}}`;
}
