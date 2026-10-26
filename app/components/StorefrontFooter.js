'use client';
import {useSiteDesign} from './builder/SiteDesignProvider';
import ConfiguredFooter from './builder/ConfiguredFooter';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
const routes=new Set(['/store','/collections','/bundles','/artists','/credits','/timeline','/archive','/impact','/wholesale','/track-order']);
export default function StorefrontFooter({force=false}){
 const pathname=usePathname(),site=useSiteDesign();if(!force&&!routes.has(pathname)&&!(site.footer.custom&&/^\/(releases|store)\//.test(pathname)))return null;
 return <ConfiguredFooter><footer className="storefrontFooter"><div><Link href="/" aria-label="SIDE:II home"><img src="/brand/sideii-logo-flat.png" alt="SIDE:II"/></Link><p>Music, in another form.</p></div><nav aria-label="Footer navigation"><Link href="/store">Store</Link><Link href="/wear">Wear</Link><Link href="/apply">Submit a project</Link><Link href="/policies">Store policies</Link><Link href="/track-order">Track an order</Link></nav><small>INDEPENDENT SOUND / PHYSICAL FORM</small></footer></ConfiguredFooter>;
}
