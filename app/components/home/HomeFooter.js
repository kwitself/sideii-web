import ConfiguredFooter from '../builder/ConfiguredFooter';
import Link from 'next/link';

export default function HomeFooter() {
  return <ConfiguredFooter><footer><div className="shell footerInner">
    <div className="footerLogo"><img src="/brand/sideii-logo-flat.png" alt="Side II"/><small>INDEPENDENT PHYSICAL MUSIC LABEL</small></div>
    <div className="footerNav"><a href="#top">TOP</a><a href="#releases">RELEASES</a><a href="#imprints">IMPRINTS</a><a href="#about">ABOUT</a><a href="#store">STORE</a><Link href="/apply">PRODUCTION APPLICATION</Link><Link href="/wear">WEAR WHAT YOU SUPPORT</Link><Link href="/policies">STORE POLICIES</Link></div>
    <div className="footerMeta"><span>SIDE:II · EST. MMXXVI</span><span>CD · CASSETTE · LIMITED</span><span>© MMXXVI SIDE:II</span></div>
  </div></footer></ConfiguredFooter>;
}
