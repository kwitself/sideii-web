import './globals.css';

export const metadata = {
  title: 'Side:II — The Other Side of Sound',
  description: 'Independent physical music label. Selected releases and physical editions.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
