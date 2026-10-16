import './globals.css';
import './physical-formats.css';
import './cart-responsive.css';
import GlobalBag from './components/GlobalBag';
import GlobalAccount from './components/GlobalAccount';
import {LocaleCurrencyProvider} from './components/LocaleCurrencyProvider';
import CommerceTelemetry from './components/CommerceTelemetry';

const configuredSiteUrl=process.env.NEXT_PUBLIC_SITE_URL?.trim();
const validPublicSiteUrl=(()=>{
  if(!configuredSiteUrl)return null;
  try{
    const url=new URL(configuredSiteUrl);
    if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)return null;
    const host=url.hostname.toLowerCase();
    if(host==='localhost'||host.endsWith('.localhost')||host==='127.0.0.1'||host==='0.0.0.0'||host==='[::1]'||!host.includes('.'))return null;
    return url.origin;
  }catch{return null;}
})();
const siteUrl=validPublicSiteUrl||'http://localhost:3000';
const canonicalSiteConfigured=Boolean(validPublicSiteUrl);


export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Side:II — The Other Side of Sound',
    template: '%s — Side:II',
  },
  description: 'Independent physical music label for physical editions, selected releases and artist-led objects.',
  applicationName: 'Side:II',
  category: 'music',
  keywords: ['Side:II','independent music label','physical music editions','vinyl','cassette','CD','Lethargia Records'],
  openGraph: {
    type: 'website',
    siteName: 'Side:II',
    title: 'Side:II — The Other Side of Sound',
    description: 'Independent physical music label for physical editions, selected releases and artist-led objects.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Side:II — The Other Side of Sound',
    description: 'Independent physical music label for physical editions, selected releases and artist-led objects.',
  },
  robots: {
    index: canonicalSiteConfigured,
    follow: canonicalSiteConfigured,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#09090a',
  colorScheme: 'dark',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body><LocaleCurrencyProvider><CommerceTelemetry/>{children}<GlobalAccount/><GlobalBag/></LocaleCurrencyProvider></body>
    </html>
  );
}
