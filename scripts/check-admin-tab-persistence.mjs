import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const rail=readFileSync('app/admin/AdminRail.js','utf8');
const dashboard=readFileSync('app/admin/AdminDashboard.js','utf8');
const key='sideii-admin-last-view';
for(const [name,source] of [['rail',rail],['dashboard',dashboard]]){
 assert.ok(source.includes("localStorage.getItem('"+key+"')"),name+': restores remembered tab');
 assert.ok(source.includes("localStorage.setItem('"+key+"'"),name+': saves selected tab');
 assert.ok(source.includes('valid.has(fromHash)')||source.includes('allowed.has(initial)'),name+': explicit deep links take priority');
}
assert.ok(rail.includes("history.replaceState(null,'','#'+initial)"),'Rail restores URL hash when missing');
assert.ok(dashboard.includes("localStorage.getItem('sideii-admin-products-tab')"),'Restores Products subtab');
assert.ok(dashboard.includes("localStorage.setItem('sideii-admin-products-tab'"),'Persists Products subtab');
for(const view of ['all','release','merch'])assert.ok(dashboard.includes("selectProductView('"+view+"')"),'Can select '+view);
console.log('Admin main-section and Products subtab persistence source checks passed.');
