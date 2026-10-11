import test from 'node:test';
import assert from 'node:assert/strict';
import {notificationReviewState as review} from '../app/lib/server/notificationReviewState.js';
test('bounces demand review even after provider acceptance',()=>assert.equal(review({outcome:'sent',delivery_status:'email.bounced'}),'attention_required'));
test('complaints demand review',()=>assert.equal(review({outcome:'sent',delivery_status:'email.complained'}),'attention_required'));
test('verified delivery is resolved',()=>assert.equal(review({outcome:'sent',delivery_status:'email.delivered'}),'delivered'));
test('accepted but no webhook remains unverified',()=>assert.equal(review({outcome:'sent',delivery_status:'email.accepted'}),'awaiting_confirmation'));
test('network errors remain uncertain',()=>assert.equal(review({outcome:'failed',error_code:'network_error',attempts:2}),'unknown_outcome_review'));
test('retry exhaustion requires review',()=>assert.equal(review({outcome:'failed',error_code:'http_503',attempts:5}),'retry_limit_review'));
