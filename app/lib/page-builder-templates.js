import {createNode, SCHEMA_VERSION} from './page-builder.js';
const node = (type, props = {}, style = {}, children = []) => {const n = createNode(type); return {...n, props: {...n.props, ...props}, style: {...n.style, ...style}, children};};
const text = value => node('text', {text: value});
const heading = (value, size = 64) => node('heading', {text: value, level: 'h2'}, {fontSize: size, fontWeight: '400', letterSpacing: -2});
const section = (name, children, style = {}) => ({...node('section', {}, {maxWidth: 1440, paddingTop: 80, paddingBottom: 80, ...style}, children), name});
const eyebrow = value => node('text', {text: value}, {fontSize: 11, letterSpacing: 3, color: '#a6a6aa'});
const document = children => ({schemaVersion: SCHEMA_VERSION, theme: {backgroundColor: '#09090a', color: '#eeeef0', fontFamily: 'sans'}, children});
export function starterDocument(key = 'home') {
  if (key === 'store') return document([
    section('Mağaza başlığı', [eyebrow('STORE / CATALOGUE'), heading('Available\neditions.'), text('Physical objects and digital masters from SIDE:II and its imprints.')]),
    node('native', {slot: 'store-catalogue'}),
  ]);
  if (key === 'product') return document(['product-hero', 'product-imprint', 'product-gallery', 'product-listen', 'product-tracks', 'product-note', 'product-related'].map(slot => node('native', {slot})));
  if (key !== 'home') return document([section('Karşılama', [eyebrow('SIDE:II / INDEPENDENT'), heading('A new perspective.'), text('Music, artwork and physical form.'), node('button', {text: 'EXPLORE THE STORE →', href: '/store'})])]);
  return document([
    section('SIDE:II / Hero', [eyebrow('INDEPENDENT PHYSICAL MUSIC LABEL · EST. MMXXVI'), node('image', {src: '/brand/sideii-logo-silver.png', alt: 'SIDE:II'}, {maxWidth: 760, width: 100, objectFit: 'contain'}), node('heading', {text: 'Music, in another form.', level: 'h1'}, {fontSize: 32, fontFamily: 'serif', fontWeight: '400'}), node('button', {text: 'EXPLORE ↓', href: '#manifesto'})], {minHeight: 640, textAlign: 'center', alignItems: 'center', justifyContent: 'center'}),
    section('Capabilities', [node('columns', {}, {columns: 4, gap: 32}, ['PHYSICAL EDITIONS', 'ART DIRECTION', 'PRODUCTION', 'CATALOGUE'].map((name, i) => node('stack', {}, {gap: 12}, [eyebrow('0' + (i + 1)), node('heading', {text: name, level: 'h3'}, {fontSize: 16, letterSpacing: 1})])))], {paddingTop: 32, paddingBottom: 32}),
    {...section('Manifesto', [node('columns', {}, {columns: 2, gap: 64}, [heading('Sound becomes\nan edition.'), node('stack', {}, {gap: 24, justifyContent: 'center'}, [eyebrow('01 / APPROACH'), text('Each Side:II release is developed as a complete physical edition: music, format, artwork and production considered together.'), eyebrow('SOUND · ARTWORK · FORMAT')])])]), props: {anchor: 'manifesto'}},
    {...section('Selected releases', [eyebrow('02 / CATALOGUE'), heading('Selected\nreleases.'), node('products', {title: '', limit: 3, imprint: 'all'})]), props: {anchor:'releases'}},
    {...section('Lethargia', [eyebrow('03 / IMPRINT · A SIDE:II IMPRINT'), node('image', {src: '/brand/lethargia/lethargia-logo.png', alt: 'Lethargia Records'}, {maxWidth: 650, objectFit: 'contain'}), text('Lethargia operates within Side:II with a distinct catalogue identity.\nIts visual system and physical formats are shaped release by release.'), node('button', {text: 'OPEN LETHARGIA CATALOGUE →', href: '/imprints/lethargia'})], {backgroundColor: '#1b1013'}), props:{anchor:'imprints'}},
    section('About', [eyebrow('04 / ABOUT'), node('columns', {}, {}, [heading('Built around\nthe release.'), node('stack', {}, {}, [text('Side:II develops physical music releases across compact disc, cassette and limited formats. The format and visual system are chosen for the individual project rather than imposed as a house style.'), text('One release.\nOne complete edition.'), eyebrow('CD · CASSETTE · LIMITED')])])]),
    section('Production', [eyebrow('05 / PRODUCTION'), heading('From master\nto object.'), text('Physical editions are developed as one system: audio, format, artwork, print, packaging and final production.'), node('columns', {}, {columns: 4}, ['Music + format', 'Artwork + packaging', 'Manufacture + QC', 'Catalogue + release'].map((name, i) => node('stack', {}, {}, [eyebrow('0' + (i + 1)), node('heading', {text: name, level: 'h3'}, {fontSize: 24})]))), node('button', {text: 'SUBMIT A PROJECT →', href: '/apply'})]),
    section('Store', [eyebrow('06 / STORE'), heading('Catalogue editions\ncoming into print.'), node('products', {title: '', limit: 3, imprint: 'all'}), node('button', {text: 'VIEW FULL STORE →', href: '/store'})]),
    section('Closing', [eyebrow('07 / SIDE:II'), heading('Sound. Artwork.\nPhysical edition.'), node('button', {text: 'RETURN TO TOP ↑', href: '#top'})]),
  ]);
}
export function sectionTemplate(kind) {
  if (kind === 'hero') return section('Hero', [eyebrow('SIDE:II / NEW EDITION'), heading('Sound takes shape.'), text('A new chapter in independent sound.'), node('button', {text: 'DISCOVER →', href: '/store'})], {minHeight: 520, justifyContent: 'center'});
  if (kind === 'split') return section('Görsel + metin', [node('columns', {}, {}, [node('image'), node('stack', {}, {justifyContent: 'center'}, [heading('Made to be held.', 48), text('Tell the story behind the edition.'), node('button')])])]);
  if (kind === 'cta') return section('Çağrı', [heading('Have a release ready?', 48), text('Let’s make it physical.'), node('button', {text: 'SUBMIT A PROJECT →', href: '/apply'})], {textAlign: 'center', alignItems: 'center', backgroundColor: '#171719'});
  if (kind === 'faq') return section('Sık sorulanlar', [heading('Questions.', 48), node('accordion', {title: 'How do I order?', text: 'Choose an edition in our store and follow the checkout steps.'}), node('accordion', {title: 'Where can I track my order?', text: 'Use the Track an order link with your order details.'})]);
  return section('Ürün vitrini', [node('products')]);
}
