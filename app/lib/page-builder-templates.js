import {defaultSiteSettings} from './builder-design.js';
import {createNode, cloneDocument, SCHEMA_VERSION} from './page-builder.js';
import {HOME_SECTIONS, HOME_SECTION_ORDER, homeSectionProps} from './home-sections.js';
import {STORE_DEFAULT_DOCUMENT} from './store-default.js';
export const homeSectionNode = section => createNode('siteSection', {name: HOME_SECTIONS[section].label, props: homeSectionProps(section)});
const node = (type, props = {}, style = {}, children = []) => {const n = createNode(type); return {...n, props: {...n.props, ...props}, style: {...n.style, ...style}, children};};
const text = value => node('text', {text: value});
const heading = (value, size = 64) => node('heading', {text: value, level: 'h2'}, {fontSize: size, fontWeight: '400', letterSpacing: -2});
const section = (name, children, style = {}) => ({...node('section', {}, {maxWidth: 1440, paddingTop: 80, paddingBottom: 80, ...style}, children), name});
const eyebrow = value => node('text', {text: value}, {fontSize: 11, letterSpacing: 3, color: '#a6a6aa'});
const document = children => ({schemaVersion: SCHEMA_VERSION, theme: {backgroundColor: '#09090a', color: '#eeeef0', fontFamily: 'sans'}, children});
export function starterDocument(key = 'home') {
  if (key === 'site') return {schemaVersion:1,theme:{},children:[],site:defaultSiteSettings()};
  if (key.startsWith('block:')) return {schemaVersion:1,theme:{},children:[section('Ortak bölüm',[heading('Ortak içerik',48)])]};
  if (key === 'store') return cloneDocument(STORE_DEFAULT_DOCUMENT);
  if (key === 'product') return document(['product-hero', 'product-imprint', 'product-gallery', 'product-listen', 'product-tracks', 'product-note', 'product-related'].map(slot => node('native', {slot})));
  if (key !== 'home') return document([section('Karşılama', [eyebrow('SIDE:II / INDEPENDENT'), heading('A new perspective.'), text('Music, artwork and physical form.'), node('button', {text: 'EXPLORE THE STORE →', href: '/store'})])]);
  return {schemaVersion: SCHEMA_VERSION, theme: {}, children: HOME_SECTION_ORDER.map(homeSectionNode)};
}
export function sectionTemplate(kind) {
  if (kind === 'hero') return section('Hero', [eyebrow('SIDE:II / NEW EDITION'), heading('Sound takes shape.'), text('A new chapter in independent sound.'), node('button', {text: 'DISCOVER →', href: '/store'})], {minHeight: 520, justifyContent: 'center'});
  if (kind === 'split') return section('Görsel + metin', [node('columns', {}, {}, [node('image'), node('stack', {}, {justifyContent: 'center'}, [heading('Made to be held.', 48), text('Tell the story behind the edition.'), node('button')])])]);
  if (kind === 'cta') return section('Çağrı', [heading('Have a release ready?', 48), text('Let’s make it physical.'), node('button', {text: 'SUBMIT A PROJECT →', href: '/apply'})], {textAlign: 'center', alignItems: 'center', backgroundColor: '#171719'});
  if (kind === 'faq') return section('Sık sorulanlar', [heading('Questions.', 48), node('accordion', {title: 'How do I order?', text: 'Choose an edition in our store and follow the checkout steps.'}), node('accordion', {title: 'Where can I track my order?', text: 'Use the Track an order link with your order details.'})]);
  return section('Ürün vitrini', [node('products')]);
}
