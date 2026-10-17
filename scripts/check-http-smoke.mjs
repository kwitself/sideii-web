import assert from 'node:assert/strict';
import {getPublicSiteUrl} from '../app/lib/public-site-url.js';

// Non-mutating HTTP smoke checks against a locally started production build.
const base=(process.env.SMOKE_BASE_URL||'http://127.0.0.1:3000').replace(/\/$/,'');
const publicUrl=getPublicSiteUrl();
const paths=['/','/store','/robots.txt','/sitemap.xml'];
for(const path of paths){
 const response=await fetch(base+path,{redirect:'manual',signal:AbortSignal.timeout(20000)});
 const body=await response.text();
 assert.equal(response.status,200,`${path} must return HTTP 200 (got ${response.status})`);
 assert.ok(body.length>0,`${path} must not be empty`);
 assert.ok(!body.includes('sideii-web.vercel.app'),`${path} must not advertise the obsolete host`);
 if(path==='/robots.txt'){
  assert.match(body,/user-agent:/i,'robots must declare user-agent');
  if(!publicUrl){
   assert.match(body,/disallow:\s*\//i,'Without a valid public URL, robots must block crawlers');
   assert.ok(!body.includes('Sitemap:'),'Staging robots must not announce a sitemap');
  }else{
   assert.ok(body.includes(publicUrl+'/sitemap.xml'),'Published robots must advertise the canonical sitemap');
   assert.match(body,/disallow:\s*\/admin/i,'Admin must not be crawled');
   assert.match(body,/disallow:\s*\/api\//i,'API must not be crawled');
  }
 }
 if(path==='/sitemap.xml'&&publicUrl){
  assert.ok(body.includes('<urlset')||body.includes('<sitemapindex'),'Configured sitemap must provide XML');
  assert.ok(body.includes(publicUrl),'Sitemap must use configured canonical origin');
 }
 if(path==='/'&&!publicUrl){
  assert.match(body,/noindex/i,'Staging home must include noindex');
 }
 console.log(`PASS ${path} HTTP ${response.status}`);
}
console.log('GET-only HTTP smoke passed. Payment, order and browser E2E remain separate go/no-go checks.');
