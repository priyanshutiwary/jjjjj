import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Beam Analysis Tool',
  description: 'Calculate natural frequencies and mode shapes for various beam types',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

