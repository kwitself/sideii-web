import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';

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
console.log('Finance static invariants verified; these checks are NOT a replacement for build or e2e testing.');
