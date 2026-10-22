import {createClient} from '@supabase/supabase-js';
export async function builderAdmin(request) {
  const authorization = request.headers.get('authorization') || '';
  if (!/^Bearer \S+$/.test(authorization)) return {error: 'Oturum açmanız gerekiyor.', status: 401};
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return {error: 'Veritabanı bağlantısı yapılandırılmamış.', status: 503};
  const client = createClient(url, key, {global: {headers: {Authorization: authorization}, fetch: (input, init) => fetch(input, {...init, cache: 'no-store', signal: init?.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(12000)]) : AbortSignal.timeout(12000)})}, auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false}});
  const {data, error} = await client.auth.getUser();
  if (error || !data?.user) return {error: 'Oturum süresi dolmuş. Yeniden giriş yapın.', status: 401};
  if (data.user.app_metadata?.role !== 'admin') return {error: 'Yönetici yetkisi gerekiyor.', status: 403};
  return {client, user: data.user};
}
export function builderResponse(data, status = 200) {return Response.json(data, {status, headers: {'Cache-Control': 'private, no-store'}});}
export async function boundedJson(request, limit = 450000) {
  if (!request.headers.get('content-type')?.includes('application/json')) throw new Error('JSON verisi gerekiyor.');
  const reader = request.body?.getReader(); if (!reader) throw new Error('İstek boş.');
  let length = 0; const chunks = [];
  while (true) {const {done, value} = await reader.read(); if (done) break; length += value.byteLength; if (length > limit) {await reader.cancel(); throw new Error('Sayfa dosyası çok büyük.');} chunks.push(value);}
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) {bytes.set(chunk, offset); offset += chunk.byteLength;}
  return JSON.parse(new TextDecoder().decode(bytes));
}
