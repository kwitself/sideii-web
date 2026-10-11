import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveEmailDeliveryStatus as resolve} from '../app/lib/server/resolveEmailDeliveryStatus.js';
const event=(event_type,received_at)=>({event_type,received_at});
test('delivery outranks late sent event',()=>assert.equal(resolve([event('email.sent','2026-10-12T09:00:00Z'),event('email.delivered','2026-10-12T08:00:00Z')]),'email.delivered'));
test('bounce outranks accepted delivery',()=>assert.equal(resolve([event('email.delivered','2026-10-12T08:00:00Z'),event('email.bounced','2026-10-12T09:00:00Z')]),'email.bounced'));
test('complaint outranks all',()=>assert.equal(resolve([event('email.bounced','2026-10-12T09:00:00Z'),event('email.complained','2026-10-12T08:00:00Z')]),'email.complained'));
test('delay outranks sent',()=>assert.equal(resolve([event('email.sent','2026-10-12T09:00:00Z'),event('email.delivery_delayed','2026-10-12T08:00:00Z')]),'email.delivery_delayed'));
test('empty history has no delivery claim',()=>assert.equal(resolve([]),null));
