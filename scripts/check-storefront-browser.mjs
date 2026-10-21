import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdirSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';

// Isolated fixtures only. No live account, catalogue, order, payment or email writes.
const require = createRequire(import.meta.url);
let chromium;
try { ({chromium} = require('playwright')); }
catch { ({chromium} = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright')); }
const base = process.env.SIDEII_BASE_URL || 'http://127.0.0.1:3000';
assert.match(base, /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/);
assert.ok(!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'http://127.0.0.1:54321');
const out = (process.env.SIDEII_QA_OUTPUT || '/tmp/sideii-admin-qa') + '/storefront';
mkdirSync(out, {recursive: true});
const widths = (process.env.SIDEII_QA_WIDTHS || '320,375,390,428,768,1024,1440,1920').split(',').map(Number);
const pages = ['/', '/store', '/imprints/lethargia', '/apply', '/track-order', '/policies', '/wholesale',
  '/impact', '/archive', '/timeline', '/credits', '/artists', '/bundles', '/collections', '/wear'];
const variantId = '22222222-2222-4222-8222-222222222222';
const products = [
  {id: '11111111-1111-4111-8111-111111111111', catalogue_no: 'SII-009', slug: 'studio-edition',
    title: 'Studio Edition', artist_project: 'Independent Artist', product_type: 'release', imprint: 'sideii',
    status: 'active', is_public: true, product_variants: [{id: variantId, format: 'cd', sku: 'SII-009-CD',
      active: true, price: 120, currency: 'TRY', stock_qty: 5, reserved_qty: 1}]},
  {id: '33333333-3333-4333-8333-333333333333', catalogue_no: 'SII-010', slug: 'night-edition',
    title: 'Night Edition', product_type: 'release', imprint: 'sideii', status: 'active', is_public: true,
    product_variants: [{id: '44444444-4444-4444-8444-444444444444', format: 'vinyl', sku: 'SII-010-LP',
      active: true, price: 240, currency: 'TRY', stock_qty: 0, reserved_qty: 0}]},
  {id: '77777777-7777-4777-8777-777777777777', catalogue_no: 'SII-W01', slug: 'studio-tee',
    title: 'Studio Tee', product_type: 'merch', merch_category: 'apparel', imprint: 'sideii', status: 'active', is_public: true,
    product_variants: ['M', 'L'].map((size, i) => ({id: i ? '99999999-9999-4999-8999-999999999999' : '88888888-8888-4888-8888-888888888888',
      format: 'merch', sku: 'SII-W01-' + size, option_size: size, option_color: 'Black', active: true,
      price: 160, currency: 'TRY', stock_qty: i ? 2 : 3, reserved_qty: 0}))},
];
const user = {id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', aud: 'authenticated', email: 'customer@example.invalid',
  app_metadata: {}, user_metadata: {full_name: 'Studio Collector'}, created_at: '2026-01-01T00:00:00Z'};
const token = Buffer.from(JSON.stringify({alg: 'HS256', typ: 'JWT'})).toString('base64url') + '.' +
  Buffer.from(JSON.stringify({sub: user.id, role: 'authenticated', exp: 4102444800})).toString('base64url') + '.test';
const session = {access_token: token, refresh_token: 'test-only', token_type: 'bearer', expires_in: 3600, expires_at: 4102444800, user};
const orders = [{id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', order_no: 26, status: 'pending', payment_status: 'unpaid',
  currency: 'TRY', subtotal: 120, total: 120, created_at: '2026-10-18T10:00:00Z', items: []}];
let catalogue = 'empty', quoteMode = 'fail', trackingStatus = 503, accountFailure = false, applicationFailure = true;
let applicationCalls = 0, notifyCalls = 0, quoteUnitPrice = 120;
const heldQuotes = [], forbidden = [], errors = [], results = [];

// Server Components use this read-only local service; browser requests are separately intercepted.
const mock = createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1:54321');
  const send = (body, status = 200) => {res.writeHead(status, {'content-type': 'application/json'}); res.end(JSON.stringify(body));};
  if (req.method !== 'GET' && !url.pathname.includes('/rpc/get_')) {
    forbidden.push('server:' + req.method + ' ' + url.pathname); return send({message: 'Read-only fixture'}, 403);
  }
  const name = url.pathname.split('/').pop();
  if (catalogue === 'outage' && ['products', 'get_public_impact_summary'].includes(name)) return send({message: 'Simulated outage'}, 503);
  if (name === 'products') {
    let rows = catalogue === 'products' ? products : [];
    for (const key of ['slug', 'imprint', 'status', 'product_type']) {
      const filter = url.searchParams.get(key);
      if (filter?.startsWith('eq.')) rows = rows.filter(p => String(p[key]) === filter.slice(3));
      if (filter?.startsWith('in.(')) rows = rows.filter(p => filter.slice(4, -1).split(',').includes(p[key]));
    }
    if (url.searchParams.get('or')?.includes('product_type.neq.merch')) rows = rows.filter(p => p.product_type !== 'merch');
    return send(url.searchParams.has('slug') ? rows[0] || null : rows);
  }
  return send([]);
});
await new Promise((resolve, reject) => {mock.once('error', reject); mock.listen(54321, '127.0.0.1', resolve);});
const browser = await chromium.launch({headless: true, executablePath: process.env.SIDEII_CHROMIUM_PATH || undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage']});
const context = await browser.newContext({viewport: {width: 1440, height: 960}, reducedMotion: 'reduce'});
await context.route('**/*', async route => {
  const req = route.request(), url = new URL(req.url());
  const json = (body, status = 200) => route.fulfill({status, contentType: 'application/json', body: JSON.stringify(body)});
  if (url.origin === base) {
    if (url.pathname === '/api/order-tracking') return json({order: null}, trackingStatus);
    if (url.pathname === '/api/applications/notify') {notifyCalls++; return json({ok: true});}
    if (url.pathname.startsWith('/api/') && req.method() !== 'GET') {
      forbidden.push(url.pathname); return json({message: 'Forbidden in QA'}, 403);
    }
    return route.continue();
  }
  if (url.hostname !== '127.0.0.1') return route.abort();
  if (url.pathname.startsWith('/auth/v1')) return json(url.pathname.endsWith('/user') ? user : session);
  const name = url.pathname.split('/').pop();
  if (/create_store_order|reserve_order_value|set_order_gift|apply_payment|refund|request_order_action|notifications/.test(name)) {
    forbidden.push(name); return json({message: 'Forbidden in QA'}, 403);
  }
  if (name === 'quote_store_order_v4') {
    const args = req.postDataJSON();
    const amount = args.p_items.reduce((sum, item) => sum + item.quantity * quoteUnitPrice, 0);
    if (quoteMode === 'fail') return json({message: 'Product unavailable', code: 'TEST'}, 400);
    if (quoteMode === 'malformed') return json({});
    if (quoteMode === 'held') await new Promise(resolve => heldQuotes.push({args, resolve}));
    if (args.p_promo_code === 'EXPIRED') return json({message: 'Code expired', code: 'TEST'}, 400);
    if (args.p_promo_code === 'EMAIL' && !args.p_email) return json({message: 'Requires customer email', code: 'TEST'}, 400);
    return json({subtotal: amount, total: amount, shipping_total: 0, discount_total: 0});
  }
  if (['submit_production_application', 'submit_wholesale_application'].includes(name)) {
    applicationCalls++;
    return applicationFailure ? json({message: 'Simulated application outage', code: 'TEST'}, 503) : json('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
  }
  if (accountFailure && name === 'get_my_store_orders') return json({message: 'Simulated account outage'}, 503);
  const objects = {get_store_localization: {rates: [], locales: []},
    get_store_payment_mode: {mode: 'manual_link', provider: 'iyzico_link', enabled: true, extra_support_enabled: false},
    get_my_customer_account: {full_name: 'Studio Collector'}, get_my_store_orders: orders, get_my_store_credit: {balance: 0}};
  if (name in objects) return json(objects[name]);
  return json(req.headers().accept?.includes('vnd.pgrst.object') ? null : []);
});
const page = await context.newPage();
page.on('pageerror', error => errors.push(error.message));
page.setDefaultTimeout(12000);
async function go(path) {
  const response = await page.goto(base + path);
  assert.equal(response.status(), 200, path);
  await page.locator('.globalSiteHeader').waitFor();
}
async function fits(view) {
  const geometry = await page.evaluate(() => {
    const visible = [...document.querySelectorAll('.primaryNav>a,.primaryNav>.navExplore>button,.globalAccountTrigger,.globalBagTrigger,.mobileMenuTrigger,.globalSiteHeader>a')]
      .filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden')
      .map(el => ({text: el.textContent, rect: el.getBoundingClientRect().toJSON()}));
    const collisions = [];
    for (let i = 0; i < visible.length; i++) for (let j = i + 1; j < visible.length; j++) {
      const a = visible[i].rect, b = visible[j].rect;
      if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2)
        collisions.push([visible[i].text, visible[j].text]);
    }
    return {overflow: document.documentElement.scrollWidth - innerWidth, collisions};
  });
  results.push({view, width: page.viewportSize().width, ...geometry});
  assert.ok(geometry.overflow <= 2, view + ': overflow ' + geometry.overflow);
  assert.deepEqual(geometry.collisions, [], view + ': header controls overlap');
}
async function shot(name) {
  const width = page.viewportSize().width;
  if ([390, 1440].includes(width)) await page.screenshot({path: `${out}/${name}-${width}.png`, fullPage: true});
}
async function openDrawer(kind) {
  await page.locator('.global' + kind + 'Trigger').click();
  await page.locator('.global' + kind + 'Drawer.open[aria-hidden="false"]').waitFor();
  await page.waitForFunction(kind => {const r = document.querySelector('.global' + kind + 'Drawer').getBoundingClientRect(); return r.x >= -1 && r.right <= innerWidth + 1;}, kind);
}
async function closeDrawer() {await page.keyboard.press('Escape'); await page.locator('.globalBagTrigger').waitFor(); await page.locator('.globalAccountTrigger').waitFor();}
async function cart(qty = 1) {
  await page.evaluate(({qty, variantId}) => {
    const items = qty ? [{key: variantId, variantId, sku: 'SII-009-CD', title: 'Studio Edition', catalogue: 'SII-009', format: 'CD', price: 120, qty, stock: 5}] : [];
    localStorage.setItem('sideii_cart_v1', JSON.stringify(items)); window.dispatchEvent(new CustomEvent('sideii-cart', {detail: items}));
  }, {qty, variantId});
}
async function until(predicate, message) {
  const deadline = Date.now() + 12000;
  while (!predicate()) {assert.ok(Date.now() < deadline, message); await new Promise(resolve => setTimeout(resolve, 40));}
}
const bag = page.locator('.globalBagDrawer');
const account = page.locator('.globalAccountDrawer');
try {
  for (const width of widths) {
    await page.setViewportSize({width, height: 960});
    for (const path of pages) {await go(path); await fits(path); await shot(path === '/' ? 'home' : path.slice(1).replaceAll('/', '-'));}
    await openDrawer('Account'); await fits('signed-out account'); await page.keyboard.press('Tab');
    assert.ok(await account.evaluate(el => el.contains(document.activeElement))); await closeDrawer();
    quoteMode = 'fail'; await cart(); await openDrawer('Bag');
    await bag.getByRole('button', {name: 'CHECK AGAIN', exact: true}).waitFor();
    assert.ok(await bag.locator('.globalBagCheckout').isDisabled()); await fits('unavailable cart'); await shot('cart-error');
    quoteMode = 'ok'; await bag.getByRole('button', {name: 'CHECK AGAIN', exact: true}).click();
    await bag.getByRole('button', {name: 'CHECKOUT →', exact: true}).click();
    await page.locator('.globalCheckout').waitFor(); await fits('checkout'); await shot('checkout');
    await bag.getByRole('button', {name: '← BACK TO BAG', exact: true}).click();
    await bag.locator('.globalBagRemove').click(); await bag.locator('.globalBagEmpty').waitFor();
    assert.equal(await bag.locator('.quoteNotice').count(), 0); await closeDrawer();
    console.log(`PASS storefront ${pages.length} routes, account, failed quote/retry and checkout @${width}px`);
  }
  catalogue = 'outage'; await go('/store'); await page.getByRole('heading', {name: 'The catalogue could not be loaded.'}).waitFor();
  await go('/impact'); await page.getByRole('heading', {name: 'Contribution totals could not be loaded.'}).waitFor();
  assert.equal(await page.locator('.impactPublicStats').count(), 0);
  catalogue = 'products'; await go('/store');
  assert.equal(await page.locator('.storeProduct').count(), 3);
  await page.getByLabel('SEARCH CATALOGUE', {exact: true}).fill('unmatched object');
  await page.getByRole('heading', {name: 'Nothing fits these filters.'}).waitFor();
  await page.locator('.storeNoResults').getByRole('button', {name: 'RESET DISCOVERY'}).click();
  await page.getByRole('button', {name: /MORE FILTERS/}).click(); await page.getByLabel('MIN PRICE', {exact: true}).fill('150');
  await page.waitForFunction(() => document.querySelectorAll('.storeProduct').length === 2);
  await page.locator('.storeDiscoveryMeta').getByRole('button').click();
  await page.getByRole('button', {name: 'CLASSIC', exact: true}).click();
  await page.waitForFunction(() => document.querySelectorAll('.storeClassicCard').length === 3);
  await page.locator('.storeClassicCard').filter({hasText: 'Studio Tee'}).getByRole('link', {name: /SELECT OPTIONS/}).waitFor();
  for (const width of [390, 1440]) {await page.setViewportSize({width, height: 960}); await page.evaluate(() => scrollTo(0, 0)); await fits('classic catalogue'); await shot('store-products');}
  for (const path of ['/releases/studio-edition', '/store/studio-tee']) {await go(path); await fits(path);}

  // A stale successful quote must not unlock a changed cart, even briefly.
  await go('/store'); quoteMode = 'malformed'; await cart(); await openDrawer('Bag');
  await bag.getByRole('button', {name: 'CHECK AGAIN', exact: true}).waitFor(); assert.ok(await bag.locator('.globalBagCheckout').isDisabled());
  quoteMode = 'held'; await bag.getByRole('button', {name: 'CHECK AGAIN', exact: true}).click();
  await until(() => heldQuotes.length === 1, 'First quote was not requested');
  await cart(2); await until(() => heldQuotes.length === 2, 'Changed cart was not quoted');
  assert.equal(heldQuotes[0].args.p_items[0].quantity, 1); assert.equal(heldQuotes[1].args.p_items[0].quantity, 2);
  heldQuotes[0].resolve(); await page.waitForTimeout(100);
  assert.ok(await bag.locator('.globalBagCheckout').isDisabled(), 'Old response cannot unlock the current cart');
  quoteMode = 'ok'; heldQuotes[1].resolve(); await bag.getByRole('button', {name: 'CHECKOUT →', exact: true}).click();
  await page.locator('.globalCheckout').waitFor(); assert.match(await page.locator('.globalCheckout').innerText(), /240/);
  await bag.getByRole('button', {name: '← BACK TO BAG', exact: true}).click();
  await bag.getByLabel('Gift or promo code').fill('EXPIRED'); await bag.getByRole('button', {name: 'APPLY', exact: true}).click();
  await bag.getByText('This code has expired.', {exact: true}).waitFor(); assert.ok(await bag.locator('.globalBagCheckout').isDisabled());
  await bag.getByRole('button', {name: 'REMOVE PROMO CODE', exact: true}).click();
  await bag.getByRole('button', {name: 'CHECKOUT →', exact: true}).waitFor();
  await bag.getByLabel('Gift or promo code').fill('EMAIL'); await bag.getByRole('button', {name: 'APPLY', exact: true}).click();
  await bag.getByRole('button', {name: 'CONTINUE TO CHECKOUT →', exact: true}).click();
  const placeOrder = bag.getByRole('button', {name: /PLACE ORDER/});
  assert.ok(await placeOrder.isDisabled());
  await page.locator('.globalCheckout').dispatchEvent('submit');
  await bag.getByText('Wait for prices and availability to be confirmed before placing your order.', {exact: true}).waitFor();
  await page.locator('.globalCheckout').getByLabel('EMAIL', {exact: true}).fill(user.email);
  await page.waitForFunction(() => ![...document.querySelectorAll('.globalCheckout button')].find(el => el.textContent.includes('PLACE ORDER'))?.disabled);
  await closeDrawer(); quoteUnitPrice = 140; await cart(1); await openDrawer('Bag');
  await bag.locator('.globalBagTotal strong').filter({hasText: '140'}).waitFor();
  assert.equal(await bag.locator('.globalBagTotal span').innerText(), 'SUBTOTAL', 'Confirmed subtotal uses the server price');
  await closeDrawer(); await cart(0); quoteUnitPrice = 120;
  console.log('PASS malformed, stale and email-dependent quotes; expired promo; guarded submit');

  await page.evaluate(session => localStorage.setItem('sb-127-auth-token', JSON.stringify(session)), session);
  await go('/store'); await openDrawer('Account'); await page.locator('#account-panel-profile').waitFor();
  for (const width of widths) {
    await page.setViewportSize({width, height: 960});
    for (const section of ['saved', 'collection', 'orders', 'profile']) {
      await account.getByRole('button', {name: section.toUpperCase(), exact: true}).click();
      await page.locator('#account-panel-' + section).waitFor();
      assert.equal(await page.locator('[id^="account-panel-"]:visible').count(), 1);
      await fits('account/' + section); await shot('account-' + section);
    }
  }
  await account.getByRole('button', {name: 'ORDERS', exact: true}).click(); await account.locator('.accountOrderRow').click();
  await account.locator('.accountOrderDetail').waitFor(); await page.keyboard.press('Escape');
  await account.locator('.accountOrderDetail').waitFor({state: 'detached'});
  await account.locator('.accountSignout').focus(); await page.keyboard.press('Tab');
  assert.ok(await account.locator('.globalAccountClose').evaluate(el => el === document.activeElement), 'Hidden account controls must not enter focus cycle');
  await closeDrawer(); accountFailure = true; await go('/store'); await openDrawer('Account');
  await account.locator('.accountLoadError').waitFor(); assert.equal(await page.locator('[id^="account-panel-"]:visible').count(), 0);
  accountFailure = false; await account.getByRole('button', {name: 'TRY AGAIN', exact: true}).click(); await page.locator('#account-panel-profile').waitFor();
  await closeDrawer(); await page.evaluate(() => window.dispatchEvent(new CustomEvent('sideii-open-account', {detail: {section: 'orders'}})));
  await page.locator('#account-panel-orders').waitFor(); await closeDrawer();
  console.log('PASS four account sections, order detail, keyboard focus, account outage/retry and order-history shortcut');

  await go('/track-order'); await page.getByLabel('ORDER NUMBER', {exact: true}).fill('SII-abc26'); await page.locator('.trackingForm').getByLabel('EMAIL', {exact: true}).fill(user.email);
  await page.getByRole('button', {name: 'TRACK ORDER →'}).click(); await page.getByText(/Enter a valid order number/).waitFor();
  await page.getByLabel('ORDER NUMBER', {exact: true}).fill('SII-0026');
  for (const [status, message] of [[503, 'Order tracking is temporarily unavailable.'], [429, 'Too many attempts.'], [200, 'NO MATCH']]) {
    trackingStatus = status; await page.getByRole('button', {name: 'TRACK ORDER →'}).click(); await page.getByText(message, {exact: false}).waitFor();
  }
  await go('/apply'); await page.getByLabel('NAME / CONTACT PERSON', {exact: true}).fill('Local Test');
  await page.locator('.productionApplicationForm').getByLabel('EMAIL', {exact: true}).fill(user.email);
  await page.getByLabel('ARTIST / PROJECT NAME', {exact: true}).fill('Test Artist'); await page.getByLabel('ALBUM / RELEASE TITLE', {exact: true}).fill('Test Release');
  await page.getByRole('button', {name: 'CD PRESSING', exact: true}).click();
  await page.getByRole('button', {name: 'SEND PRODUCTION APPLICATION →'}).click(); await page.getByText('Simulated application outage', {exact: true}).waitFor();
  assert.equal(await page.getByLabel('ARTIST / PROJECT NAME', {exact: true}).inputValue(), 'Test Artist');
  applicationFailure = false; await page.getByRole('button', {name: 'SEND PRODUCTION APPLICATION →'}).click(); await page.getByRole('heading', {name: 'We got your project.'}).waitFor();
  assert.equal(notifyCalls, 1, 'Only confirmed production application triggers the mocked notification');
  await go('/wholesale'); await page.getByLabel('COMPANY / STORE', {exact: true}).fill('Test Store'); await page.locator('.wholesaleForm').getByLabel('EMAIL', {exact: true}).fill(user.email);
  applicationFailure = true; await page.getByRole('button', {name: 'SUBMIT TRADE INTEREST →'}).click(); await page.getByText('Simulated application outage', {exact: true}).waitFor();
  assert.equal(await page.getByLabel('COMPANY / STORE', {exact: true}).inputValue(), 'Test Store');
  applicationFailure = false; await page.getByRole('button', {name: 'SUBMIT TRADE INTEREST →'}).click(); await page.getByText('Application received.', {exact: true}).waitFor();
  assert.equal(applicationCalls, 4); assert.deepEqual(forbidden, []); assert.deepEqual(errors, []);
  console.log('PASS tracking validation/outage/rate-limit/no-match and application failure/retry; all writes mocked');
  console.log(`Storefront Chromium passed: ${pages.length} routes × ${widths.length} widths, populated catalogue and guarded customer flows.`);
} catch (error) {
  await page.screenshot({path: out + '/failure.png', fullPage: true}); writeFileSync(out + '/failure.txt', await page.locator('body').innerText()); throw error;
} finally {
  writeFileSync(out + '/results.json', JSON.stringify({widths, pages, results, errors, forbidden, applicationCalls, notifyCalls}, null, 2));
  for (const quote of heldQuotes) quote.resolve(); await browser.close(); await new Promise(resolve => mock.close(resolve));
}
