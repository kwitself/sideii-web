import './globals.css';
import './physical-formats.css';
import GlobalBag from './components/GlobalBag';

export const metadata = {
  title: 'Side:II — The Other Side of Sound',
  description: 'Independent physical music label. Selected releases and physical editions.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}<GlobalBag/></body>
    </html>
  );
}
