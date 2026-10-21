import {getPublicSiteUrl} from './lib/public-site-url';
import './globals.css';
import './physical-formats.css';
import './cart-responsive.css';
import './storefront-refinement.css';
import StorefrontFooter from './components/StorefrontFooter';
import GlobalBag from './components/GlobalBag';
import GlobalAccount from './components/GlobalAccount';
import {LocaleCurrencyProvider} from './components/LocaleCurrencyProvider';
import CommerceTelemetry from './components/CommerceTelemetry';

const validPublicSiteUrl=getPublicSiteUrl();
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
      <body><LocaleCurrencyProvider><CommerceTelemetry/>{children}<StorefrontFooter/><GlobalAccount/><GlobalBag/></LocaleCurrencyProvider></body>
    </html>
  );
}
