import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL('https://jfcars.jhavik-kim.chatgpt.site'),
  title: 'JFcars — Cars, rentals and parts in Central Africa',
  description:
    'Search, compare, buy or rent cars and request auto parts across Central African markets.',
  alternates: {
    canonical: '/',
    languages: {
      en: '/?lang=en',
      fr: '/?lang=fr',
      es: '/?lang=es',
      'x-default': '/',
    },
  },
  openGraph: {
    title: 'JFcars — Move happy',
    description: 'Cars, rentals and parts for Central Africa.',
    images: ['/og.png'],
    locale: 'en',
    alternateLocale: ['fr', 'es'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JFcars — Move happy',
    description: 'Cars, rentals and parts for Central Africa.',
    images: ['/og.png'],
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
