'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';
import OfflineIndicator from './components/OfflineIndicator';
import './globals.css';

export default function RootLayout({ children }) {
  useEffect(() => {
    // Update favicon dynamically
    const favicon = document.querySelector("link[rel*='icon']") || document.createElement('link');
    favicon.type = 'image/png';
    favicon.rel = 'shortcut icon';
    favicon.href = '/Imagen/logoo.png';
    document.getElementsByTagName('head')[0].appendChild(favicon);

    // Update title
    document.title = 'Orchard Services - Machinery Management';

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered, scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });
    }
  }, []);

  return (
    <html lang="en">
      <head>
        <meta name="description" content="Complete machinery management system for agricultural operations" />
        <meta name="theme-color" content="#059669" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Orchard Services" />
        <link rel="apple-touch-icon" href="/Imagen/logoo.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <SessionProvider refetchInterval={300} refetchOnWindowFocus={true}>
          {children}
          <OfflineIndicator />
        </SessionProvider>
      </body>
    </html>
  );
}
