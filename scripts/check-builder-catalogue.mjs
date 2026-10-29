import assert from 'node:assert/strict';
import {createNode, findNode} from '../app/lib/page-builder.js';
import {starterDocument} from '../app/lib/page-builder-templates.js';

export async function checkBuilderCatalogue({page, canvas, browser, base, out, request, publish, pages, publications, products}) {
  const keys = ['home', 'store', 'product', 'page:qa-catalogue', 'block:qa-catalogue'];
  const snapshots = [pages, publications].map(map => new Map(keys.map(key => [key, map.get(key)])));
  const originalProducts = structuredClone(products);
  const selected = products.find(product => product.slug === 'lethargia-edition');
  selected.artwork_path = 'catalogue/lethargia.png';
  products.push(
    {...products[0], id: '44444444-4444-4444-8444-444444444444', slug: 'studio-shirt', title: 'Studio Shirt', product_type: 'merch', product_variants: []},
    {...products[0], id: '55555555-5555-4555-8555-555555555555', slug: 'private-edition', title: 'Private Edition', is_public: false},
    {...products[0], id: '66666666-6666-4666-8666-666666666666', slug: 'draft-edition', title: 'Draft Edition', status: 'draft'},
  );
  const visitor = await browser.newContext({viewport: {width: 1200, height: 900}, reducedMotion: 'reduce'});
  await visitor.route('**/*', route => ['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
  const live = await visitor.newPage();
  const errors = [];
  live.on('pageerror', error => errors.push(error.message));
  const write = async (key, document, action = 'publish') => {
    const result = await request({key, title: key, document, action, expectedVersion: pages.get(key)?.version || 0});
    assert.equal(result.status, 200, JSON.stringify(result.data));
  };
  const doc = children => ({schemaVersion: 1, theme: {}, children});
  const checkCard = async path => {
    const response = await live.goto(base + path);
    assert.equal(response.status(), 200, path);
    assert.equal(await live.locator('.pbAlbum h2').filter({hasText: 'LETHARGIA EDITION'}).count(), 1, 'Selected Lethargia album must render on ' + path);
    assert.equal(await live.locator('.pbAlbum').getAttribute('href'), '/releases/lethargia-edition');
    assert.match(await live.locator('.pbAlbum img').getAttribute('src'), /catalogue\/lethargia\.png$/);
    assert.equal(await live.locator('.pbEmptyCatalogue').count(), 0, path);
  };
  const checkGrid = async () => {
    assert.deepEqual((await live.locator('.pbProducts h3').allTextContents()).sort(), ['LETHARGIA EDITION', 'STUDIO EDITION', 'STUDIO SHIRT']);
  };
  try {
    // Reproduce the actual editor -> publish -> homepage flow for a non-SIDE:II release.
    const album = createNode('album'), grid = createNode('products', {props: {title: 'Catalogue parity', imprint: 'all', limit: 24}});
    const home = starterDocument('home');
    home.children.splice(1, 0, album, grid);
    await write('home', home, 'save');
    await page.goto(base + '/admin/editor?page=home');
    await canvas.locator('[data-pb-id="' + album.id + '"]').click();
    await page.getByLabel('Albüm', {exact: true}).selectOption('lethargia-edition');
    assert.equal(await page.getByLabel('Albüm', {exact: true}).locator('option[value="private-edition"],option[value="draft-edition"]').count(), 0);
    await canvas.locator('.pbAlbum h2').filter({hasText: 'LETHARGIA EDITION'}).waitFor();
    await publish();
    assert.equal(findNode(publications.get('home').document, album.id).props.slug, 'lethargia-edition');
    await checkCard('/');
    await checkGrid();
    // The original selected-releases section keeps its own curation rules.
    assert.equal(await live.locator('#releases').getByText('LETHARGIA EDITION', {exact: true}).count(), 0);
    for (const width of [1200, 390]) {
      await live.setViewportSize({width, height: 900});
      assert(await live.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await live.locator('.pbAlbum').screenshot({path: out + '/catalogue-album-' + width + '.png'});
    }
    console.log('PASS editor-selected Lethargia album and full public catalogue survive homepage publication');

    // Shared sections and product templates must use the same catalogue as the editor.
    const shared = doc([createNode('album', {props: {slug: 'lethargia-edition', label: 'Selected album'}}), grid]);
    await write('block:qa-catalogue', shared);
    const linked = doc([createNode('shared', {props: {key: 'block:qa-catalogue'}})]);
    for (const [key, paths] of [
      ['home', ['/']], ['store', ['/store']], ['page:qa-catalogue', ['/pages/qa-catalogue']],
      ['product', ['/releases/studio-edition', '/store/studio-shirt']],
    ]) {
      const requiredSlot = key === 'store' ? 'store-catalogue' : key === 'product' ? 'product-hero' : null;
      await write(key, doc([...linked.children, ...(requiredSlot ? [createNode('native', {props: {slot: requiredSlot}})] : [])]));
      for (const path of paths) {await checkCard(path); await checkGrid();}
    }
    // Direct album cards on product templates are covered as well as linked blocks.
    await write('product', doc([...shared.children, createNode('native', {props: {slot: 'product-hero'}})]));
    for (const path of ['/releases/studio-edition', '/store/studio-shirt']) {await checkCard(path); await checkGrid();}
    assert.deepEqual(errors, []);
    console.log('PASS direct/shared album cards and product grids on home, store, custom, release and merch pages; private/draft products stay excluded');
  } finally {
    await visitor.close();
    products.splice(0, products.length, ...originalProducts);
    [pages, publications].forEach((map, index) => {
      for (const [key, value] of snapshots[index]) value === undefined ? map.delete(key) : map.set(key, value);
    });
  }
}
