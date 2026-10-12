import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';

const panel = readFileSync('app/admin/FinanceAccountingPanel.js','utf8');
const migrations = readFileSync('supabase/migrations/20261013_finance_invoice_draft_server_validation_v2.sql','utf8');

for(const marker of [
  "admin_finance_invoice_draft_create",
  "INVOICE DRAFTS",
  "Only eligible paid TRY orders",
  "Complete configured order item VAT snapshots required",
  "UNISSUED E-INVOICE / E-ARCHIVE DRAFTS",
  "ACCOUNTANT HANDOFF",
  "CASH FORECAST",
  "EXPORT REVIEW JSON",
  "UNISSUED_INVOICE_REVIEW_ONLY",
  "ITEM COUNT MISMATCH",
  "INVALID ITEM QUANTITY",
]){
  assert.ok(panel.includes(marker), `Missing finance UI invariant: ${marker}`);
}
for(const marker of [
  "security definer",
  "Admin required",
  "Eligible paid order required",
  "Complete item VAT snapshots required",
  "needs_review",
  "Invalid tax ID",
]){
  assert.ok(migrations.includes(marker), `Missing finance SQL invariant: ${marker}`);
}
assert.ok(!panel.includes("supabase.rpc('issue_invoice'"), 'Unreviewed invoice issue RPC');
assert.ok(panel.includes("const content='\\uFEFF'"), 'CSV export must contain a UTF-8 BOM');
assert.ok(panel.includes(".join('\\r\\n')"), 'CSV export must use real CRLF row separators');
assert.ok(panel.includes("const isNumeric="), 'CSV exporter should preserve numeric cells');
assert.ok(panel.includes("const normalized=v.replace("), 'CSV spreadsheet formula prevention missing');

const helperSource=panel.match(/^const netVat=.*;$/m)?.[0];
assert.ok(helperSource,'Production VAT helper not found');
const money=runInNewContext(helperSource+'\nnetVat',{Number});
const near=(actual,expected,label)=>assert.ok(Math.abs(actual-expected)<0.005,`${label}: expected ${expected}, got ${actual}`);
near(money(120,20,true).net,100,'VAT inclusive net');
near(money(120,20,true).vat,20,'VAT inclusive amount');
near(money(100,20,false).gross,120,'VAT exclusive gross');
near(money(100,0,true).vat,0,'Zero-rate VAT');
for(const rate of [0,1,10,20]){
  for(const included of [true,false]){
    const m=money(237.42,rate,included);
    near(m.net+m.vat,m.gross,`VAT balance rate=${rate}, included=${included}`);
  }
}
assert.equal(typeof money,'function','Real production VAT helper must be callable');


const csvStart=panel.indexOf('const exportCsv=(filename,head,rows)=>');
const csvEnd=panel.indexOf(' const downloadExpenses=',csvStart);
assert.ok(csvStart>=0&&csvEnd>csvStart,'Production CSV exporter not found');
const blobs=[];
const csvURL={createObjectURL:(blob)=>{blobs.push(blob);return 'blob:finance-test'},revokeObjectURL:()=>{}};
const csvDocument={createElement:()=>({click(){},set href(_){},set download(_){}})};
const csv=runInNewContext(panel.slice(csvStart,csvEnd)+'\nexportCsv',{
 URL:csvURL,Blob,document:csvDocument,setTimeout:()=>{}
});
csv('test.csv',['Name','Amount','Note'],[
 ['Türkçe',-42,'=SUM(1,2)'],
 ['Quoted',12.5,'a "quote"'],
 ['Whitespace',3,'  +evil']
]);
assert.equal(blobs.length,1,'Exactly one CSV download should be built');
const output=await blobs[0].text();
assert.ok(output.startsWith('\uFEFF'),'CSV must actually begin with a BOM');
assert.ok(output.includes('\r\n'),'CSV must contain CRLF separators');
assert.ok(output.includes('Türkçe'),'CSV must preserve Unicode');
assert.ok(output.includes('"-42"'),'Negative numeric amounts must stay numeric');
assert.ok(output.includes('"\'=SUM(1,2)"'),'Formula-like cells must be neutralized');
assert.ok(output.includes('a ""quote""'),'Quotes must be doubled');
assert.ok(output.includes('"\'  +evil"'),'Leading whitespace must not bypass formula protection');
assert.equal(output.split('\\r\\n').length,4,'CSV must contain header and three data rows');
assert.ok(!output.includes('\\\\r\\\\n'),'CSV must not emit literal backslash escape sequences');
assert.ok(output.includes('"12.5"'),'Decimal numerics must remain unprefixed');


console.log('Production finance VAT and CSV checks passed; these checks are NOT a replacement for build or e2e testing.');
