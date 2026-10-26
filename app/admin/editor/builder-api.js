import {supabase} from '../../lib/supabase';
export async function api(path = '', body) {
  if (!supabase) throw new Error('Veritabanı bağlantısı yok.');
  const {data, error} = await supabase.auth.getSession();
  if (error || !data.session?.access_token) throw new Error('Oturum süresi dolmuş. Yeniden giriş yapın.');
  let response;
  try {response = await fetch('/api/admin/page-builder' + path, {method: body ? 'POST' : 'GET', cache: 'no-store', signal: AbortSignal.timeout(30000), headers: {Authorization: 'Bearer ' + data.session.access_token, ...(body && !(body instanceof FormData) ? {'Content-Type':'application/json'} : {})}, ...(body ? {body: body instanceof FormData ? body : JSON.stringify(body)} : {})});}
  catch {throw new Error('Bağlantı yanıt vermedi. Çalışman bu tarayıcıda korunuyor; yeniden denemeden önce güncel sürümü kontrol et.');}
  let result; try {result = await response.json();} catch {throw new Error('Sunucu yanıtı okunamadı. Çalışman bu tarayıcıda korunuyor.');}
  if (!response.ok) {const failure = new Error(result.error || 'İşlem tamamlanamadı.'); failure.status = response.status; throw failure;}
  return result;
}
