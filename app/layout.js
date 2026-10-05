import './globals.css';
import './physical-formats.css';
import GlobalBag from './components/GlobalBag';
import GlobalAccount from './components/GlobalAccount';
import {LocaleCurrencyProvider} from './components/LocaleCurrencyProvider';

export const metadata = {
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
    index: true,
    follow: true,
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
      <body><LocaleCurrencyProvider>{children}<GlobalAccount/><GlobalBag/></LocaleCurrencyProvider></body>
    </html>
  );
}
