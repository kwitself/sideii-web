import assert from 'node:assert/strict';

// Read-only application smoke test: GET only; never creates orders or payments.
const base=(process.env.SMOKE_BASE_URL||'http://127.0.0.1:3000').replace(/\/$/,'');
const cases=[['/','homepage'],['/store','storefront'],['/robots.txt','robots'],['/sitemap.xml','sitemap']];
async function get(path){
 const response=await fetch(base+path,{redirect:'manual',signal:AbortSignal.timeout(15000)});
 const body=await response.text();
 assert.ok(response.status===200,`${path}: expected HTTP 200, got ${response.status}`);
 assert.ok(!body.includes('sideii-web.vercel.app'),`${path}: obsolete site URL detected`);
 return {response,body};
}
for(const [path,name] of cases){
 const {response,body}=await get(path);
 assert.ok(body.length>0,`${name}: empty response`);
 if(path==='/robots.txt'){
  assert.ok(/user-agent:/i.test(body),'robots must declare a user agent');
  if(!process.env.NEXT_PUBLIC_SITE_URL)assert.ok(/disallow:\s*\//i.test(body),'No canonical site URL: robots must block crawling');
 }
 if(path==='/sitemap.xml'&&process.env.NEXT_PUBLIC_SITE_URL){
  assert.ok(body.includes('<urlset')||body.includes('<sitemapindex'),'Configured sitemap must contain XML');
 }
 console.log(`PASS ${name}: HTTP ${response.status}`);
}
console.log('Read-only HTTP smoke completed. Payment, order and browser E2E remain untested.');
