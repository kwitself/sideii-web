import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Static launch guardrail; does not make HTTP requests or change production data.
const layout=readFileSync('app/layout.js','utf8');
assert.ok(layout.includes('process.env.NEXT_PUBLIC_SITE_URL'), 'Site URL must be configurable');
assert.ok(!layout.includes('sideii-web.vercel.app'), 'Old deployment URL must not be canonical');
assert.ok(layout.includes('index: canonicalSiteConfigured'), 'No indexing before canonical URL setup');
assert.ok(layout.includes('follow: canonicalSiteConfigured'), 'No link following before canonical URL setup');
assert.ok(layout.includes("metadataBase: new URL(siteUrl)"), 'Metadata base must use configured site URL');
console.log('Launch SEO fallback and canonical indexing guards passed (static verification).');
