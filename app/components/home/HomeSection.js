import {Fragment} from 'react';
import Link from 'next/link';
import SelectedReleaseGrid from '../SelectedReleaseGrid';
import {homeSectionProps} from '../../lib/home-sections';

const field = key => ({'data-home-field': key});
const lines = value => String(value).split('\n').map((line, i) => <Fragment key={i}>{i > 0 && <br/>}{line}</Fragment>);

// The live site and visual editor render this exact markup and stylesheet.
export default function HomeSection({section, content = {}, featured = [], storeReleases = [], attributes = {}}) {
  const p = {...homeSectionProps(section), ...content};
  const attrs = className => ({...attributes, id: p.anchor || undefined, className: className + (attributes.className ? ' ' + attributes.className : ''), 'data-home-section': section});
  const title = (Tag = 'h2', Accent = 'i') => <Tag data-home-title><span {...field('title')}>{lines(p.title)}</span><Accent {...field('accent')}>{p.accent}</Accent></Tag>;
  const link = className => <Link className={className} href={p.linkHref || '#'} {...field('linkText')}>{p.linkText}</Link>;
  const head = () => <div className="sectionHead"><span {...field('kicker')}>{p.kicker}</span>{title()}</div>;
  if (section === 'hero') return <section {...attrs('hero shell')}>
    <div className="sideWave" aria-hidden="true">{Array.from({length:18},(_,i)=><i key={i}/>)}</div>
    <div className="heroCore"><div className="eyebrow" {...field('eyebrow')}>{p.eyebrow}</div><div className="heroLogo"><img src={p.logo || undefined} alt={p.logoAlt} {...field('logo')}/></div><p className="tagline" data-home-title {...field('tagline')}>{p.tagline}</p></div>
    <a className="scrollCue" href={p.linkHref || '#'} {...field('linkText')}><span>{p.linkText}</span><b>↓</b></a><div className="heroFoot"><span {...field('footLeft')}>{p.footLeft}</span><span {...field('footRight')}>{p.footRight}</span></div>
  </section>;
  if (section === 'capabilities') return <section {...attrs('capabilityStrip shell')} aria-label="Side II capabilities">{[0,1,2,3].map(i=><div key={i}><span>0{i+1}</span><b data-home-title {...field('title'+i)}>{p['title'+i]}</b><small {...field('detail'+i)}>{p['detail'+i]}</small></div>)}</section>;
  if (section === 'manifesto') return <section {...attrs('statement shell')}>{title('p','em')}<div><span {...field('kicker')}>{p.kicker}</span><p {...field('copy')}>{lines(p.copy)}</p><small {...field('meta')}>{p.meta}</small></div></section>;
  if (section === 'releases') return <section {...attrs('section shell')}>{head()}<SelectedReleaseGrid releases={featured}/><div className="catalogueFoot"><p className="forthcoming" {...field('copy')}>{p.copy}</p><span {...field('meta')}>{p.meta}</span></div></section>;
  if (section === 'imprint') return <section {...attrs('imprint')}><div className="shell imprintInner"><span {...field('kicker')}>{p.kicker}</span><div className="imprintContent"><small className="imprintKicker" {...field('eyebrow')}>{p.eyebrow}</small><img className="homeLethargiaLogo" src={p.logo || undefined} alt={p.logoAlt} {...field('logo')}/><div className="imprintRule"/><p {...field('copy')}>{lines(p.copy)}</p><div className="imprintMeta"><small {...field('metaLeft')}>{p.metaLeft}</small><small {...field('metaRight')}>{p.metaRight}</small></div>{link('imprintExplore')}</div></div></section>;
  if (section === 'about') return <section {...attrs('section about shell')}>{head()}<div className="aboutCopy"><div className="aboutIndex" {...field('eyebrow')}>{p.eyebrow}</div><p {...field('copy')}>{lines(p.copy)}</p><p {...field('note')}>{lines(p.note)}</p><div className="formats">{[0,1,2].map(i=><span key={i} {...field('format'+i)}><b>0{i+1}</b> {p['format'+i]}</span>)}</div></div></section>;
  if (section === 'production') return <section {...attrs('productionSection')}><div className="shell"><div className="productionHead"><span {...field('kicker')}>{p.kicker}</span>{title()}<p {...field('copy')}>{lines(p.copy)}</p></div>
    <div className="editionObjects" aria-hidden="true"><div className="editionObject editionObjectDisc"><i/><b>II</b></div><div className="editionObject editionObjectBooklet"><span>SIDE:II</span><strong>PHYSICAL<br/>EDITION</strong><small>MMXXVI</small></div><div className="editionObject editionObjectCase"><span>CAT. SII–001</span><div/><small>COMPACT DISC</small></div></div>
    <div className="productionFlow">{[0,1,2,3].map(i=><article key={i}><span>0{i+1}</span><div><b {...field('stepTag'+i)}>{p['stepTag'+i]}</b><h3 {...field('stepTitle'+i)}>{p['stepTitle'+i]}</h3><p {...field('stepCopy'+i)}>{lines(p['stepCopy'+i])}</p></div></article>)}</div><div className="productionCta"><div><small {...field('ctaTag')}>{p.ctaTag}</small><p {...field('ctaCopy')}>{p.ctaCopy}</p></div>{link()}</div></div></section>;
  if (section === 'store') return <section {...attrs('storeWrap')}><div className="store shell"><span {...field('kicker')}>{p.kicker}</span><div className="storeTitle">{title('h2','em')}<div className="storeMark">II</div></div><div className="homeStorePreview">{storeReleases.map(r=><Link href={'/releases/'+r.slug} className="homeStoreCard" key={r.slug}>{r.cover?<img src={r.cover} alt={r.title}/>:<div className="homeStorePlaceholder">{r.catalogue}</div>}<div><small>{r.catalogue} · {(r.variants||[]).map(v=>v.formatLabel).join(' / ')}</small><b>{r.title}</b><span>{r.artist}</span></div></Link>)}</div><div className="storeRow"><div><p {...field(storeReleases.length?'copy':'emptyCopy')}>{storeReleases.length?p.copy:p.emptyCopy}</p><small {...field('meta')}>{p.meta}</small></div>{link('storeEntry')}</div></div></section>;
  if (section === 'closing') return <section {...attrs('closing')}><div className="shell closingInner"><span {...field('kicker')}>{p.kicker}</span>{title('p')}{link()}</div></section>;
  return null;
}
