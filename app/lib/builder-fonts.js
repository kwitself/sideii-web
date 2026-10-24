// Stable IDs are stored in page documents. Font files are served by this site.
export const FONT_CATALOG = [
  {id: 'sans', label: 'Arial', category: 'system', family: 'Arial,Helvetica,sans-serif'},
  {id: 'serif', label: 'Georgia', category: 'system', family: 'Georgia,serif'},
  {id: 'mono', label: 'Monospace', category: 'system', family: 'monospace'},
  {id: 'inter', label: 'Inter', category: 'sans', family: '"PB Inter",Arial,sans-serif'},
  {id: 'manrope', label: 'Manrope', category: 'sans', family: '"PB Manrope",Arial,sans-serif'},
  {id: 'dm-sans', label: 'DM Sans', category: 'sans', family: '"PB DM Sans",Arial,sans-serif'},
  {id: 'space-grotesk', label: 'Space Grotesk', category: 'sans', family: '"PB Space Grotesk",Arial,sans-serif'},
  {id: 'montserrat', label: 'Montserrat', category: 'sans', family: '"PB Montserrat",Arial,sans-serif'},
  {id: 'oswald', label: 'Oswald', category: 'display', family: '"PB Oswald",Arial,sans-serif'},
  {id: 'playfair-display', label: 'Playfair Display', category: 'serif', family: '"PB Playfair Display",Georgia,serif'},
  {id: 'lora', label: 'Lora', category: 'serif', family: '"PB Lora",Georgia,serif'},
  {id: 'cormorant-garamond', label: 'Cormorant Garamond', category: 'serif', family: '"PB Cormorant Garamond",Georgia,serif'},
  {id: 'roboto-slab', label: 'Roboto Slab', category: 'serif', family: '"PB Roboto Slab",Georgia,serif'},
  {id: 'bodoni-moda', label: 'Bodoni Moda', category: 'display', family: '"PB Bodoni Moda",Georgia,serif'},
  {id: 'jetbrains-mono', label: 'JetBrains Mono', category: 'mono', family: '"PB JetBrains Mono",monospace'},
];
export const FONT_VALUES = Object.fromEntries(FONT_CATALOG.map(font => [font.id, font.family]));
export const FONT_CATEGORIES = {all: 'Tümü', sans: 'Sans', serif: 'Serif', display: 'Vurgu', mono: 'Mono', system: 'Sistem'};

export const TYPOGRAPHY_PRESETS = [
  {id: 'display', label: 'Büyük başlık', fontFamily: 'space-grotesk', fontWeight: '600', sizes: [64, 48, 36], lineHeight: 1.1, letterSpacing: -2, textTransform: 'none'},
  {id: 'editorial', label: 'Editoryal', fontFamily: 'playfair-display', fontWeight: '400', sizes: [56, 44, 32], lineHeight: 1.2, letterSpacing: -1, textTransform: 'none'},
  {id: 'poster', label: 'Afiş', fontFamily: 'oswald', fontWeight: '600', sizes: [72, 56, 40], lineHeight: 1.1, letterSpacing: 1, textTransform: 'uppercase'},
  {id: 'body', label: 'Gövde metni', fontFamily: 'inter', fontWeight: '400', sizes: [18, 18, 16], lineHeight: 1.7, letterSpacing: 0, textTransform: 'none'},
  {id: 'caption', label: 'Küçük etiket', fontFamily: 'manrope', fontWeight: '600', sizes: [12, 12, 11], lineHeight: 1.5, letterSpacing: 2, textTransform: 'uppercase'},
  {id: 'technical', label: 'Teknik', fontFamily: 'jetbrains-mono', fontWeight: '400', sizes: [16, 15, 14], lineHeight: 1.6, letterSpacing: 0, textTransform: 'none'},
];
export function typographyPreset(id, device = 'desktop') {
  const preset = TYPOGRAPHY_PRESETS.find(item => item.id === id);
  if (!preset) return {};
  const {label, sizes, id: unused, ...style} = preset;
  return {...style, fontSize: sizes[device === 'mobile' ? 2 : device === 'tablet' ? 1 : 0], fontStyle: 'normal', textDecoration: 'none', wordSpacing: 0};
}
