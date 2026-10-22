// Content fields for the actual storefront sections, shared by the editor and site.
const field = (label, value, type = 'text') => ({label, value, type});
export const HOME_SECTIONS = {
  hero: {label: 'SIDE:II / Hero', anchor: '', fields: {
    eyebrow: field('Üst yazı', 'INDEPENDENT PHYSICAL MUSIC LABEL · EST. MMXXVI'),
    logo: field('Logo', '/brand/sideii-logo-silver.png', 'image'),
    logoAlt: field('Logo açıklaması', 'Side II'),
    tagline: field('Slogan', 'Music, in another form.'),
    linkText: field('Keşfet yazısı', 'EXPLORE'), linkHref: field('Keşfet bağlantısı', '#manifesto', 'url'),
    footLeft: field('Alt sol yazı', 'SELECTED RELEASES'), footRight: field('Alt sağ yazı', 'CD · CASSETTE · LIMITED EDITIONS'),
  }},
  capabilities: {label: 'Capabilities', anchor: '', fields: Object.fromEntries([
    ['PHYSICAL EDITIONS','CD · CASSETTE · LIMITED'], ['ART DIRECTION','OBJECT · PRINT · PACKAGING'],
    ['PRODUCTION','MASTER TO MANUFACTURE'], ['CATALOGUE','OWN · SELECTED · IMPRINTS'],
  ].flatMap(([title, detail], i) => [[`title${i}`, field(`${i+1}. başlık`, title)], [`detail${i}`, field(`${i+1}. açıklama`, detail)]]))},
  manifesto: {label: 'Manifesto', anchor: 'manifesto', fields: {
    title: field('Başlık', 'Sound becomes\nan ', 'multiline'), accent: field('İtalik başlık', 'edition.'),
    kicker: field('Bölüm etiketi', '01 / APPROACH'),
    copy: field('Açıklama', 'Each Side:II release is developed as a complete physical edition: music, format, artwork and production considered together.', 'multiline'),
    meta: field('Alt yazı', 'SOUND · ARTWORK · FORMAT'),
  }},
  releases: {label: 'Selected releases', anchor: 'releases', fields: {
    kicker: field('Bölüm etiketi', '02 / CATALOGUE'), title: field('Başlık', 'Selected\n', 'multiline'), accent: field('İtalik başlık', 'releases.'),
    copy: field('Alt açıklama', 'Selected editions from the current catalogue.'), meta: field('Alt sağ yazı', 'CATALOGUE / MMXXVI'),
  }},
  imprint: {label: 'Lethargia', anchor: 'imprints', fields: {
    kicker: field('Bölüm etiketi', '03 / IMPRINT'), eyebrow: field('Üst yazı', 'A SIDE:II IMPRINT'),
    logo: field('Logo', '/brand/lethargia/lethargia-logo.png', 'image'), logoAlt: field('Logo açıklaması', 'Lethargia Records'),
    copy: field('Açıklama', 'Lethargia operates within Side:II with a distinct catalogue identity.\nIts visual system and physical formats are shaped release by release.', 'multiline'),
    metaLeft: field('Alt sol yazı', 'SIDE:II / LETHARGIA'), metaRight: field('Alt sağ yazı', 'EST. MMXXVI'),
    linkText: field('Bağlantı yazısı', 'OPEN LETHARGIA CATALOGUE →'), linkHref: field('Bağlantı adresi', '/imprints/lethargia', 'url'),
  }},
  about: {label: 'About', anchor: 'about', fields: {
    kicker: field('Bölüm etiketi', '04 / ABOUT'), title: field('Başlık', 'Built around\nthe ', 'multiline'), accent: field('İtalik başlık', 'release.'),
    eyebrow: field('Üst yazı', 'SIDE:II / INDEPENDENT / MMXXVI'),
    copy: field('Açıklama', 'Side:II develops physical music releases across compact disc, cassette and limited formats. The format and visual system are chosen for the individual project rather than imposed as a house style.', 'multiline'),
    note: field('Alt açıklama', 'One release.\nOne complete edition.', 'multiline'),
    format0: field('1. format', 'CD'), format1: field('2. format', 'CASSETTE'), format2: field('3. format', 'LIMITED'),
  }},
  production: {label: 'Production', anchor: 'production', fields: {
    kicker: field('Bölüm etiketi', '05 / PRODUCTION'), title: field('Başlık', 'From master\nto ', 'multiline'), accent: field('İtalik başlık', 'object.'),
    copy: field('Açıklama', 'Physical editions are developed as one system: audio, format, artwork, print, packaging and final production.', 'multiline'),
    ...Object.fromEntries([
      ['PROJECT','Music + format','Release scope, edition size, medium and production path are defined first.'],
      ['DESIGN','Artwork + packaging','Cover, booklet, disc face, print details and physical presentation are developed together.'],
      ['PRODUCTION','Manufacture + QC','Masters and production files are prepared, checked and moved into physical manufacturing.'],
      ['EDITION','Catalogue + release','Finished editions can enter the Side:II catalogue, direct artist sales or selected distribution.'],
    ].flatMap(([tag, title, copy], i) => [[`stepTag${i}`,field(`${i+1}. adım etiketi`,tag)], [`stepTitle${i}`,field(`${i+1}. adım başlığı`,title)], [`stepCopy${i}`,field(`${i+1}. adım açıklaması`,copy,'multiline')]])),
    ctaTag: field('Çağrı etiketi', 'ARTIST / BAND / LABEL'), ctaCopy: field('Çağrı yazısı', 'Have a release ready for physical production?'),
    linkText: field('Bağlantı yazısı', 'SUBMIT A PROJECT →'), linkHref: field('Bağlantı adresi', '/apply', 'url'),
  }},
  store: {label: 'Store', anchor: 'store', fields: {
    kicker: field('Bölüm etiketi', '06 / STORE'), title: field('Başlık', 'Catalogue editions\n', 'multiline'), accent: field('İtalik başlık', 'coming into print.'),
    copy: field('Ürünler varken açıklama', 'Latest available editions.'), emptyCopy: field('Ürün yokken açıklama', 'Catalogue editions will appear here as they become available.'),
    meta: field('Alt yazı', 'CD · CASSETTE · VINYL · DIGITAL'), linkText: field('Bağlantı yazısı', 'VIEW FULL STORE →'), linkHref: field('Bağlantı adresi', '/store', 'url'),
  }},
  closing: {label: 'Closing', anchor: 'closing', fields: {
    kicker: field('Bölüm etiketi', '07 / SIDE:II'), title: field('Başlık', 'Sound. Artwork.\n', 'multiline'), accent: field('İtalik başlık', 'Physical edition.'),
    linkText: field('Bağlantı yazısı', 'RETURN TO TOP ↑'), linkHref: field('Bağlantı adresi', '#top', 'url'),
  }},
};
export const HOME_SECTION_ORDER = Object.keys(HOME_SECTIONS);
export function homeSectionProps(section) {
  const definition = HOME_SECTIONS[section];
  return {section, anchor: definition.anchor, ...Object.fromEntries(Object.entries(definition.fields).map(([key, field]) => [key, field.value]))};
}
