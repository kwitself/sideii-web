import Link from 'next/link';
import { releases } from '../data/releases';
import './admin.css';

const orders = [
  { id: '#SII-0004', customer: 'Demo customer', item: 'SIDEII—001', total: '—', status: 'Awaiting launch' },
  { id: '#SII-0003', customer: 'Demo customer', item: 'SIDEII—002', total: '—', status: 'Draft' },
];

export default function AdminPage() {
  const stockUnits = releases.reduce((sum, release) => sum + (release.stock || 0), 0);
  return <main className="adminApp">
    <aside className="adminRail">
      <Link href="/" className="adminBrand"><span>side:II</span><small>CONTROL ROOM</small></Link>
      <nav className="adminNav">
        <a className="active" href="#overview"><i>01</i>Overview</a>
        <a href="#products"><i>02</i>Products</a>
        <a href="#orders"><i>03</i>Orders</a>
        <a href="#inventory"><i>04</i>Inventory</a>
        <a href="#customers"><i>05</i>Customers</a>
        <a href="#settings"><i>06</i>Settings</a>
      </nav>
      <div className="railFoot"><span>STORE STATUS</span><b><i/>PRE-LAUNCH</b><small>MMXXVI / SIDE:II</small></div>
    </aside>

    <section className="adminMain">
      <header className="adminTop"><div><span>SIDE:II / ADMINISTRATION</span><h1>Control <em>room.</em></h1></div><div className="topActions"><Link href="/">View storefront ↗</Link><a className="primaryAction" href="#new-release">＋ New release</a></div></header>

      <section id="overview" className="adminSection">
        <div className="sectionLabel"><span>01 / OVERVIEW</span><p>Catalogue and commerce at a glance.</p></div>
        <div className="metricGrid">
          <article><span>CATALOGUE</span><strong>{String(releases.length).padStart(2,'0')}</strong><small>physical editions</small></article>
          <article><span>INVENTORY</span><strong>{String(stockUnits).padStart(2,'0')}</strong><small>units currently entered</small></article>
          <article><span>OPEN ORDERS</span><strong>00</strong><small>store not yet live</small></article>
          <article><span>REVENUE</span><strong>—</strong><small>commerce inactive</small></article>
        </div>
      </section>

      <section id="products" className="adminSection">
        <div className="sectionLabel"><span>02 / PRODUCTS</span><p>Physical editions and release status.</p></div>
        <div className="adminPanel productPanel">
          <div className="tableHead"><span>EDITION</span><span>FORMAT</span><span>STATUS</span><span>PRICE</span><span>STOCK</span><span>ACTIONS</span></div>
          {releases.map(r=><div className="productRow" key={r.slug}>
            <div className="editionCell"><b>{r.number}</b><div><strong>{r.title}</strong><small>{r.catalogue}</small></div></div>
            <span className="formatPill">{r.format}</span><span className="statusDot"><i/>{r.status}</span><span>{r.price ? `₺${r.price}` : '—'}</span><span>{r.stock || 0}</span><div className="rowActions"><Link href={`/releases/${r.slug}`}>VIEW ↗</Link><a href="#new-release">EDIT</a><a href="#inventory">STOCK</a></div>
          </div>)}
          <div className="panelAction"><a href="#new-release">＋ ADD PHYSICAL EDITION</a></div>
        </div>
      </section>

      <section id="new-release" className="adminSection releaseWorkspace">
        <div className="sectionLabel"><span>NEW / RELEASE WORKSPACE</span><p>Prepare the next physical object.</p></div>
        <div className="releaseGrid">
          <div className="adminPanel releaseForm">
            <div className="formIntro"><span>DRAFT EDITION</span><h2>New <em>release.</em></h2><p>This is the interface layer first. Persistence will be connected after the catalogue workflow is approved.</p></div>
            <div className="formGrid">
              <label><span>CATALOGUE NO.</span><input placeholder="SIDEII—003" /></label>
              <label><span>EDITION TITLE</span><input placeholder="Third Edition" /></label>
              <label><span>FORMAT</span><select defaultValue="CD"><option>CD</option><option>CASSETTE</option></select></label>
              <label><span>STATUS</span><select defaultValue="DRAFT"><option>DRAFT</option><option>IN PREPARATION</option><option>FORTHCOMING</option><option>AVAILABLE</option></select></label>
              <label><span>PRICE / TRY</span><input inputMode="decimal" placeholder="0" /></label>
              <label><span>INITIAL STOCK</span><input inputMode="numeric" placeholder="0" /></label>
              <label className="wideField"><span>ARTIST / PROJECT</span><input placeholder="Artist or project name" /></label>
              <label className="wideField"><span>SHORT DESCRIPTION</span><textarea rows="4" placeholder="Edition note, concept or production detail…" /></label>
            </div>
            <div className="formActions"><button type="button" className="ghostButton">SAVE DRAFT</button><button type="button" className="saveButton">CREATE RELEASE →</button></div>
          </div>
          <aside className="releasePreview">
            <span>LIVE PREVIEW / 003</span>
            <div className="previewObject"><div className="previewSleeve"><small>SIDEII—003</small><strong>side:II</strong><b>03</b><em>NEW EDITION</em></div><div className="previewDisc"><i/></div></div>
            <div className="previewMeta"><small>PHYSICAL OBJECT</small><h3>Third<br/><em>Edition.</em></h3><p>CD · DRAFT EDITION</p></div>
          </aside>
        </div>
      </section>

      <section id="orders" className="adminSection twoCol">
        <div><div className="sectionLabel"><span>03 / ORDERS</span><p>Latest order activity.</p></div><div className="adminPanel orderList">{orders.map(o=><article key={o.id}><div><strong>{o.id}</strong><small>{o.customer} · {o.item}</small></div><span>{o.status}</span><b>{o.total}</b></article>)}<div className="emptyNote">Order management activates when checkout is connected.</div></div></div>
        <div id="inventory"><div className="sectionLabel"><span>04 / INVENTORY</span><p>Production and stock readiness.</p></div><div className="adminPanel inventoryCard"><div className="inventoryRing"><strong>{stockUnits}</strong><span>UNITS</span></div><div><b>Inventory is ready for data.</b><p>Add manufactured quantity, reserved stock and low-stock thresholds when editions enter production.</p><button type="button">MANAGE STOCK →</button></div></div></div>
      </section>

      <section id="customers" className="adminSection lowerGrid"><article><span>05 / CUSTOMERS</span><h2>Audience,<br/><em>when ready.</em></h2><p>Customer records will appear here after commerce is enabled.</p></article><article id="settings"><span>06 / SETTINGS</span><h2>Store<br/><em>configuration.</em></h2><p>Payments, shipping, release defaults and notification settings.</p><button type="button">OPEN SETTINGS →</button></article></section>
      <footer className="adminFooter"><span>SIDE:II CONTROL ROOM</span><span>INTERNAL / MMXXVI</span></footer>
    </section>
  </main>;
}
