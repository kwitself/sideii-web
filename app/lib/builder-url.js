export function safeUrl(value, media = false) {
  if (typeof value !== 'string' || value.length > 2048 || /[\u0000-\u0020<>"'`\\]/.test(value)) return '';
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  if (!media && /^#[a-zA-Z0-9_-]+$/.test(value)) return value;
  if (!media && /^(mailto:[^@\s]+@[^@\s]+|tel:\+?[0-9()-]+)$/.test(value)) return value;
  try {const url = new URL(value); const protocol = url.protocol === 'https:' || url.protocol === 'http:' && ['127.0.0.1','localhost'].includes(url.hostname); return protocol && !url.username && !url.password ? value : '';} catch {return '';}
}
