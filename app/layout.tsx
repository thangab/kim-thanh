import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: 'Restaurant Kim Thanh - Montbard',
  description:
    'Restaurant asiatique à Montbard avec les spécialités Vietnamiennes, Chinoises et Thaïlandaises et Japonaises. Nous proposons un buffet à volonté avec wok et grillade',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-PCZCJXTD2F" />
      <Script id="google-analytics">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
 
          gtag('config', 'G-PCZCJXTD2F');
        `}
      </Script>
      <body>{children}</body>
    </html>
  )
}
