import test from 'node:test';
import assert from 'node:assert/strict';
import {isValidCartQuote, parseOrderNumber} from '../app/lib/storefront-validation.js';

test('checkout requires a complete, nonnegative server quote', () => {
  for (const quote of [null, [], {}, {subtotal: false, total: 0}, {subtotal: [], total: 0},
    {subtotal: 10}, {total: 10}, {subtotal: null, total: 0}, {subtotal: '', total: 0},
    {subtotal: 10, total: Infinity}, {subtotal: 10, total: -1},
    {subtotal: 10, total: 10, shipping_total: 'bad'}]) {
    assert.equal(isValidCartQuote(quote), false, JSON.stringify(quote));
  }
  assert.equal(isValidCartQuote({subtotal: 100, total: 100, shipping_total: 20, discount_total: 20}), true);
  assert.equal(isValidCartQuote({subtotal: '0', total: 0}), true, 'Free orders remain valid');
});

test('tracking accepts the displayed order number and its numeric form', () => {
  for (const input of ['SII-0026', '#SII-0026', 'sii-0026', ' 26 ', '0026']) {
    assert.equal(parseOrderNumber(input), 26, input);
  }
});

test('tracking never strips arbitrary text into an unrelated order number', () => {
  for (const input of ['foo26', 'SII-abc26', '26.1', '-26', '0', 'SII-0', '1e3',
    '9007199254740992', '26 27', '']) assert.equal(parseOrderNumber(input), null, input);
});
