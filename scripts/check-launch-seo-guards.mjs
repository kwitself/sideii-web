import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const layout=readFileSync('app/layout.js','utf8');
const robots=readFileSync('app/robots.js','utf8');
const sitemap=readFileSync('app/sitemap.js','utf8');
const policy=readFileSync('app/lib/public-site-url.js','utf8');
assert.ok(layout.includes('getPublicSiteUrl()')&&layout.includes('index: canonicalSiteConfigured'),'Metadata must enforce the canonical policy');
assert.ok(policy.includes("url.protocol!=='https:'")&&policy.includes("host==='localhost'"),'HTTPS and local host guards required');
assert.ok(robots.includes("if(!base)return")&&robots.includes("disallow:'/'"),'Robots must block staging without canonical URL');
assert.ok(robots.includes("'/admin'")&&robots.includes("'/api/'")&&robots.includes("'/order'"),'Private pages must be disallowed');
assert.ok(sitemap.includes('if(!base)return []'),'Sitemap must be empty without canonical URL');
for(const [name,source] of [['robots',robots],['sitemap',sitemap],['layout',layout]])assert.ok(!source.includes('sideii-web.vercel.app'),name+' must not use obsolete host');
// Execute the exact production URL validator rather than only searching for source markers.
const encoded=Buffer.from(policy,'utf8').toString('base64');
const {getPublicSiteUrl}=await import('data:text/javascript;base64,'+encoded);
for(const raw of [undefined,'','http://sideii.com','https://localhost:3000','https://127.0.0.1','https://192.168.1.10','https://10.0.0.5','https://172.16.0.1','https://sideii.local','https://sideii.internal','https://user:password@sideii.com','https://sideii.com?utm=1','not a url']){
 assert.equal(getPublicSiteUrl(raw),null,'Must reject unsafe canonical site URL: '+raw);
}
assert.equal(getPublicSiteUrl(' https://SIDEII.COM/store/ '),'https://sideii.com','Valid canonical must normalize to origin');
assert.equal(getPublicSiteUrl('https://shop.sideii.com'),'https://shop.sideii.com','Subdomain canonical must be allowed');
console.log('Canonical URL behavior, robots and sitemap guards passed (production URL validator executed).');
