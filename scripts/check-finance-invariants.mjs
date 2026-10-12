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
const money=runInNewContext(helperSource+'\\nnetVat',{Number});
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

console.log('Finance static invariants verified; these checks are NOT a replacement for build or e2e testing.');
