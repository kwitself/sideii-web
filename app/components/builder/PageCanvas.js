import {CONTAINERS, documentCss, safeUrl, SLOT_LABELS, WIDGETS} from '../../lib/page-builder';
import HomeSection from '../home/HomeSection';
import HomeFooter from '../home/HomeFooter';
import HomeSectionRail from '../HomeSectionRail';
import GlobalHeader from '../GlobalHeader';
import './page-canvas.css';

export default function PageCanvas({document, products = [], homeData = {}, pageKey, slots = {}, editing = false, previewOnly = false, selectedId, onSelect, onDropNode, onDragNode, onInsertAt}) {
  const drop = (parentId, index, label) => editing && <button type="button" className="pbDropZone" aria-label={label || 'Buraya bileşen ekle'} onClick={event => {event.preventDefault();event.stopPropagation();onInsertAt?.(parentId, index);}} onDragOver={event => {event.preventDefault(); event.stopPropagation(); event.currentTarget.classList.add('over');}} onDragLeave={event => event.currentTarget.classList.remove('over')} onDrop={event => {event.preventDefault(); event.stopPropagation(); event.currentTarget.classList.remove('over'); onDropNode?.(event, parentId, index);}}>＋</button>;
  const renderChildren = (children, parentId = null) => <>{children.map((node, index) => <div className="pbNodePosition" key={node.id}>{drop(parentId, index)}{node.type === 'siteSection' && dragHandle(node)}{renderNode(node)}</div>)}{drop(parentId, children.length)}</>;
  const dragHandle = node => editing && <button type="button" draggable className="pbDragHandle" title="Sürükleyerek taşı" aria-label={node.name + ' taşı'} onDragStart={event => {event.stopPropagation(); onDragNode?.(event, node.id);}} onClick={event => {event.preventDefault(); event.stopPropagation(); onSelect?.(node.id);}}>⠿ {node.name || WIDGETS[node.type].label}</button>;
  const attributes = node => ({
    'data-pb-id': node.id, 'data-pb-type': node.type,
    className: 'pbNode pb-' + node.type + (editing ? ' pbEditable' : '') + (selectedId === node.id && editing ? ' pbSelected' : ''),
    tabIndex: editing ? 0 : undefined, 'aria-label': editing ? node.name : undefined,
    onClickCapture: editing ? event => {
      // Stop Next Link before it can navigate the admin's router from the portal.
      if (event.target.closest('.pbDropZone,.pbDragHandle')) return;
      const owner = event.target.closest('[data-pb-id]');
      if (owner !== event.currentTarget) return;
      event.stopPropagation();event.preventDefault();
      onSelect?.(node.id, event.target.closest('[data-home-field]')?.dataset.homeField);
    } : undefined,
    onKeyDown: editing ? event => {if (event.key === 'Enter' && event.target === event.currentTarget) {event.preventDefault();onSelect?.(node.id);}} : undefined,
  });
  function renderNode(node) {
    const p = node.props; let body;
    if (node.type === 'siteSection') return <HomeSection section={p.section} content={p} featured={homeData.featured} storeReleases={homeData.storeReleases} attributes={attributes(node)}/>;
    if (CONTAINERS.has(node.type)) body = renderChildren(node.children, node.id);
    else if (node.type === 'heading') {const Tag = p.level || 'h2'; body = <Tag>{p.text}</Tag>;}
    else if (node.type === 'text') body = <p>{p.text}</p>;
    else if (node.type === 'image') {
      const picture = safeUrl(p.src, true) ? <img src={p.src} alt={p.alt || ''} loading="lazy" draggable={false}/> : <div className="pbImagePlaceholder">{editing ? 'Görsel seç veya yükle' : ''}</div>;
      body = safeUrl(p.href) ? <a href={p.href}>{picture}</a> : picture;
    } else if (node.type === 'button') body = <a className="pbButton" href={safeUrl(p.href) || '#'} target={p.newTab ? '_blank' : undefined} rel={p.newTab ? 'noopener noreferrer' : undefined}>{p.text}</a>;
    else if (node.type === 'divider') body = <hr/>;
    else if (node.type === 'spacer') body = null;
    else if (node.type === 'quote') body = <blockquote><p>{p.text}</p>{p.author && <cite>{p.author}</cite>}</blockquote>;
    else if (node.type === 'video') body = safeUrl(p.src, true) ? <video src={p.src} poster={safeUrl(p.poster, true) || undefined} controls preload="metadata" playsInline/> : <div className="pbImagePlaceholder">{editing ? 'HTTPS video adresi ekle (MP4 / WebM)' : ''}</div>;
    else if (node.type === 'accordion') body = <details open={editing || undefined}><summary>{p.title}</summary><p>{p.text}</p></details>;
    else if (node.type === 'native') body = <div inert={editing || previewOnly}>{slots[p.slot] || (editing || previewOnly ? <div className="pbNativePlaceholder"><b>{SLOT_LABELS[p.slot]}</b><p>Bu bileşen yayımlanan sayfada gerçek ürün verileriyle çalışır.</p></div> : null)}</div>;
    else if (node.type === 'products') {
      const items = products.filter(product => p.imprint === 'all' || !p.imprint || product.imprint === p.imprint).slice(0, p.limit || 3);
      body = <>{p.title && <h2>{p.title}</h2>}<div className="pbProducts">{items.map(product => <a key={product.id || product.slug} href={(product.isMerch ? '/store/' : '/releases/') + product.slug}>{safeUrl(product.cover, true) ? <img src={product.cover} alt={product.title} loading="lazy"/> : <div className="pbImagePlaceholder">{product.catalogue}</div>}<small>{product.catalogue} · {product.format}</small><h3>{product.title}</h3><p>{product.artist}</p></a>)}</div>{!items.length && <p className="pbEmptyCatalogue">Yayımlanmış ürünler burada görünecek.</p>}</>;
    }
    return <div id={p.anchor || undefined} {...attributes(node)}>{dragHandle(node)}{body}</div>;
  }
  return <>{pageKey === 'home' && <HomeSectionRail preview={previewOnly}/>}<div className={'pbCanvas' + (editing ? ' pbCanvasEditing' : '')} onClickCapture={previewOnly && !editing ? event => {if(event.target.closest('a')) {event.preventDefault();event.stopPropagation();}} : undefined}>
    <style>{documentCss(document)}</style>
    <div className={'pbRoot' + (pageKey === 'home' ? ' pbHome' : '')} id="top">
      {pageKey === 'home' && <div inert={editing || previewOnly || undefined}><GlobalHeader/></div>}
      {renderChildren(document.children)}
      {pageKey === 'home' && <div inert={editing || previewOnly || undefined}><HomeFooter/></div>}
    </div>
  </div></>;
}
