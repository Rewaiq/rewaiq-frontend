import { Inter, Montserrat } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat', weight: ['700', '800', '900'] });

export const metadata = {
  metadataBase: new URL('https://app.rewaiq.com.ng'),
  title: {
    default: 'Rewaiq — Earn. Discover. Grow.',
    template: '%s | Rewaiq'
  },
  description: 'Africa\'s digital earning platform. Stream music, complete brand tasks and earn real money. Join thousands of Nigerian youth earning on Rewaiq.',
  keywords: [
    'earn money online Nigeria',
    'stream and earn',
    'digital earning platform Africa',
    'make money online Nigeria',
    'Rewaiq',
    'Nigerian youth platform',
    'earn from home Nigeria',
    'digital skills Aba',
    'music streaming earn coins',
    'brand tasks Nigeria',
  ],
  authors: [{ name: 'Rewaiq Technologies Ltd', url: 'https://rewaiq.com.ng' }],
  creator: 'Rewaiq Technologies Ltd',
  publisher: 'Rewaiq Technologies Ltd',
  category: 'Technology',
  
  // Open Graph (WhatsApp, Facebook, LinkedIn previews)
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: 'https://app.rewaiq.com.ng',
    siteName: 'Rewaiq',
    title: 'Rewaiq — Earn. Discover. Grow.',
    description: 'Stream music, complete tasks and earn real NGN. Africa\'s digital earning platform for youth.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Rewaiq — Earn. Discover. Grow.',
      }
    ],
  },

  // Twitter/X card
  twitter: {
    card: 'summary_large_image',
    title: 'Rewaiq — Earn. Discover. Grow.',
    description: 'Stream music, complete tasks and earn real NGN. Africa\'s digital earning platform.',
    images: ['/og-image.png'],
    creator: '@rewaiq',
  },

  // Icons
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/favicon.svg', color: '#4a9eff' },
    ],
  },

  // PWA manifest
  manifest: '/manifest.json',

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Verification (add once you have Google Search Console)
  // verification: {
  //   google: 'your-google-verification-code',
  // },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
         <script src="https://js.paystack.co/v1/inline.js" async></script>
        <meta name="theme-color" content="#0A1628" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Rewaiq" />
        <meta name="application-name" content="Rewaiq" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="canonical" href="https://app.rewaiq.com.ng" />
      </head>
      <body className={`${inter.variable} ${montserrat.variable}`}>
        {children}
      </body>
    </html>
  );
}
