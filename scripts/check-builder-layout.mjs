import assert from 'node:assert/strict';
import {createNode, WIDGETS, CONTAINERS} from '../app/lib/page-builder.js';
import {starterDocument} from '../app/lib/page-builder-templates.js';

export async function checkBuilderLayout({page, canvas, browser, base, out, request, publish, pages, publications, products}) {
  const keys = ['home', 'site', 'page:qa-layout', 'block:qa-layout'];
  const snapshots = [pages, publications].map(map => new Map(keys.map(key => [key, map.get(key)])));
  const selected = products.find(product => product.slug === 'lethargia-edition');
  const originalArtwork = selected.artwork_path;
  selected.artwork_path = 'layout/album.png';
  const visitor = await browser.newContext({viewport: {width: 1200, height: 900}, reducedMotion: 'reduce'});
  await visitor.route('**/*', route => ['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
  const live = await visitor.newPage(), errors = [];
  live.on('pageerror', error => errors.push(error.message));
  const write = async (key, document, action = 'publish') => {
    const result = await request({key, title: key, document, action, expectedVersion: pages.get(key)?.version || 0});
    assert.equal(result.status, 200, JSON.stringify(result.data));
  };
  const doc = children => ({schemaVersion: 1, theme: {}, children});
  const selector = node => '[data-pb-id="' + node.id + '"]';
  const box = locator => locator.evaluate(el => {
    const r = el.getBoundingClientRect(), s = el.ownerDocument.defaultView.getComputedStyle(el);
    return {left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height,
      marginTop: parseFloat(s.marginTop), marginBottom: parseFloat(s.marginBottom)};
  });
  const near = (actual, expected, label) => assert(Math.abs(actual - expected) < 1.1, label + ': ' + actual + ' vs ' + expected);
  const sharedChildren = [createNode('text'), createNode('text')];
  const widgets = Object.keys(WIDGETS).filter(type => !['native', 'siteSection'].includes(type)).map(type => {
    const node = createNode(type);
    if (CONTAINERS.has(type)) node.children = [createNode('text'), createNode('text')];
    if (type === 'album') node.props.slug = 'lethargia-edition';
    if (type === 'artist') node.props.image = '/brand/sideii-logo-silver.png';
    if (type === 'audio') node.props.cover = '/brand/sideii-logo-silver.png';
    if (type === 'shared') node.props.key = 'block:qa-layout';
    if (type === 'countdown') node.props.date = '2099-01-01T00:00:00Z';
    if (type === 'gallery') node.props.items = [{src: '/brand/sideii-logo-silver.png', alt: 'Gallery fixture'}];
    return node;
  });
  const home = starterDocument('home');
  home.children.splice(1, 0, ...widgets);
  const check = async (scope, width) => {
    const gutter = width <= 600 ? 20 : width <= 900 ? 24 : 32;
    let previous;
    for (const node of widgets) {
      const b = await box(scope.locator(selector(node)));
      near(b.left, width - b.right, node.type + ' centred at ' + width);
      assert(b.left >= gutter - 1, node.type + ' needs an outer gutter at ' + width + ', got ' + b.left);
      if (width < 1600) assert(b.width <= 1441, node.type + ' exceeds the site content width');
      else assert(b.width <= width, node.type + ' overflows the wide screen');
      if (['album', 'artist'].includes(node.type)) {
        const cover = scope.locator(selector(node) + ' img');
        const picture = await box(cover);
        assert(picture.left >= b.left - 1 && picture.right <= b.right + 1, node.type + ' cover stays inside its frame');
        assert(picture.width <= (width <= 600 ? b.width : b.width * (node.type === 'album' ? .55 : .5)) + 1, node.type + ' cover follows responsive columns');
      }
      if (previous) assert(b.top - previous.bottom >= (width <= 600 ? 32 : 48) - 1, node.type + ' touches the preceding widget');
      previous = b;
      if (CONTAINERS.has(node.type)) {
        const first = await box(scope.locator(selector(node.children[0]))), second = await box(scope.locator(selector(node.children[1])));
        near(node.type === 'columns' && width > 600 ? second.left - first.right : second.top - first.bottom, 24, node.type + ' keeps its own gap');
      }
    }
    const shared = widgets.find(node => node.type === 'shared');
    const outer = await box(scope.locator(selector(shared)));
    const inner = await box(scope.locator('[data-pb-id="' + shared.id + '_' + sharedChildren[0].id + '"]'));
    near(inner.left, outer.left, 'Shared content has no doubled side gutter');
    near(inner.top, outer.top, 'Shared content has no doubled top margin');
    const last = await box(scope.locator('[data-pb-id="' + shared.id + '_' + sharedChildren[1].id + '"]'));
    near(last.bottom, outer.bottom, 'Shared content has no doubled bottom margin');
    near(last.top - inner.bottom, width <= 600 ? 32 : 48, 'Shared siblings have breathing room');
  };
  try {
    await write('site', starterDocument('site'));
    await write('block:qa-layout', doc(sharedChildren));
    await write('home', home, 'save');
    await page.goto(base + '/admin/editor?page=home');
    await canvas.locator(selector(widgets[0])).waitFor();
    await publish();
    await live.goto(base + '/');
    for (const [device, width] of [['Masaüstü', 1200], ['Tablet', 820], ['Mobil', 390]]) {
      await page.getByRole('button', {name: device, exact: true}).click();
      await live.setViewportSize({width, height: 900});
      await check(canvas, width);
      await check(live, width);
      for (const node of widgets.filter(node => ['album', 'artist', 'audio'].includes(node.type))) {
        const editor = await box(canvas.locator(selector(node))), published = await box(live.locator(selector(node)));
        near(editor.width, published.width, node.type + ' editor/public width');
        near(editor.left, published.left, node.type + ' editor/public alignment');
      }
      assert(await live.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await live.locator(selector(widgets[0])).screenshot({path: out + '/layout-album-' + width + '.png'});
    }
    // At wide viewports, Studio addons align with the effective native
    // homepage shell content edges instead of remaining in a 1440px island.
    for (const width of [1600, 1920, 2160, 2400]) {
      await live.setViewportSize({width, height: 1000});
      const shell = await live.locator('.pbRoot.pbHome .hero.shell').evaluate(el => {
        const rect = el.getBoundingClientRect(), style = getComputedStyle(el);
        return {left: rect.left + parseFloat(style.paddingLeft), right: rect.right - parseFloat(style.paddingRight)};
      });
      for (const type of ['button', 'album', 'artist', 'gallery', 'products']) {
        const widget = widgets.find(node => node.type === type);
        const item = await box(live.locator(selector(widget)));
        near(item.left, shell.left, type + ' aligns with native shell left at ' + width);
        near(item.right, shell.right, type + ' aligns with native shell right at ' + width);
      }
      assert(await live.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        'Wide homepage must not scroll horizontally at ' + width);
    }
    await live.setViewportSize({width: 2160, height: 1000});
    await check(live, 2160);
    console.log('PASS all addon types centred with responsive gutters/gaps; nested and shared layouts avoid doubled spacing; editor/public parity');
    // Editorial polish belongs to the shared renderer. Verify real pointer
    // motion, keyboard focus, reduced motion and native commerce isolation.
    const motionContext = await browser.newContext({viewport:{width:1200,height:900},reducedMotion:'no-preference'});
    await motionContext.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
    try {
      const motionPage=await motionContext.newPage();
      await motionPage.goto(base+'/');
      const albumNode=widgets.find(node=>node.type==='album');
      const galleryNode=widgets.find(node=>node.type==='gallery');
      const productsNode=widgets.find(node=>node.type==='products');
      const buttonNode=widgets.find(node=>node.type==='button');
      const albumLink=motionPage.locator(selector(albumNode)+' .pbAlbum');
      const art=albumLink.locator('.pbAlbumArtwork img');
      assert(await art.isVisible(), 'Album artwork must be visible');
      assert.notEqual(await art.evaluate(el=>getComputedStyle(el).transitionDuration),'0s','Album hover animates without reduced-motion');
      await albumLink.hover();
      await motionPage.waitForTimeout(900);
      assert.notEqual(await art.evaluate(el=>getComputedStyle(el).transform),'none','Album artwork zoom is applied on hover');
      const galleryLink=motionPage.locator(selector(galleryNode)+' .pbGalleryLink').first();
      await galleryLink.hover();
      await motionPage.waitForTimeout(550);
      assert.notEqual(await galleryLink.locator('img').evaluate(el=>getComputedStyle(el).transform),'none','Gallery hover motion');
      const productLink=motionPage.locator(selector(productsNode)+' .pbProducts a').first();
      await productLink.hover();
      await motionPage.waitForTimeout(450);
      assert.notEqual(await productLink.evaluate(el=>getComputedStyle(el).transform),'none','Product card hover lift');
      const button=motionPage.locator(selector(buttonNode)+' .pbButton');
      await button.hover();
      await motionPage.waitForTimeout(420);
      assert.notEqual(await button.evaluate(el=>getComputedStyle(el).transform),'none','Button hover lift');
      await albumLink.focus();
      assert(await albumLink.evaluate(el=>el===document.activeElement),'Album is keyboard focusable');
      assert(await galleryLink.getAttribute('aria-label'),'Gallery image link is labeled');
      await albumLink.screenshot({path:out+'/studio-premium-album.png'});
      assert(await motionPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Hover introduces no horizontal overflow');
    } finally {
      await motionContext.close();
    }
    const reducedAlbum=live.locator(selector(widgets.find(node=>node.type==='album'))+' .pbAlbumArtwork img');
    assert.equal(await reducedAlbum.evaluate(el=>getComputedStyle(el).transitionDuration),'0s','Reduced motion disables artwork animation');
    assert.equal(await canvas.locator(selector(widgets.find(node=>node.type==='album'))+' .pbAlbumArtwork img').evaluate(el=>getComputedStyle(el).transitionDuration),'0s','Editor preview is reduced motion safe');
    console.log('PASS addon editorial hover, keyboard focus, gallery/album/button/product feedback and reduced-motion fallback');


    // Width/margin controls must override defaults and resetting must restore them.
    const album = createNode('album'), artist = createNode('artist');
    album.props.slug = 'lethargia-edition';
    album.style = {width: 69, maxWidth: 900, marginTop: 11, marginBottom: 17};
    album.tablet = {width: 80, marginTop: 7};
    album.mobile = {width: 100, marginTop: 0, marginBottom: 0};
    const custom = doc([album, artist]);
    await write('page:qa-layout', custom);
    for (const [width, ratio, top, bottom, gutter] of [[1200, .69, 11, 17, 32], [820, .8, 7, 17, 24], [390, 1, 0, 0, 20]]) {
      await live.setViewportSize({width, height: 900});
      await live.goto(base + '/pages/qa-layout');
      const b = await box(live.locator(selector(album)));
      near(b.width, Math.min((width - 2 * gutter) * ratio, 900), 'Explicit responsive width');
      near(b.marginTop, top, 'Explicit responsive top margin');
      near(b.marginBottom, bottom, 'Explicit responsive bottom margin');
      near(b.left, width - b.right, 'Custom width stays centred');
    }
    album.style = {}; album.tablet = {}; album.mobile = {};
    await write('page:qa-layout', custom);
    await live.reload();
    const reset = await box(live.locator(selector(album)));
    near(reset.width, 350, 'Reset returns to the default mobile frame');
    near(reset.marginTop, 16, 'Reset restores default spacing');
    artist.style = {display: 'hide'};
    await write('page:qa-layout', custom);
    await live.reload();
    near((await box(live.locator(selector(artist)).locator('..'))).height, 0, 'Hidden widgets leave no phantom gap');
    const site = starterDocument('site'); site.site.design = {contentWidth: 1000};
    await write('site', site);
    await live.setViewportSize({width: 2160, height: 1000}); await live.reload();
    near((await box(live.locator(selector(album)))).width, 1000, 'Site content width applies without resaving the page');
    assert.deepEqual(errors, []);
    console.log('PASS explicit responsive width/margins, reset, hidden widgets and shared site width on custom pages');
  } finally {
    await visitor.close();
    originalArtwork === undefined ? delete selected.artwork_path : selected.artwork_path = originalArtwork;
    [pages, publications].forEach((map, index) => {
      for (const [key, value] of snapshots[index]) value === undefined ? map.delete(key) : map.set(key, value);
    });
  }
}
