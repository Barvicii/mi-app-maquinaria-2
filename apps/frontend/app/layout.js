'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';
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
  }, []);

  return (
    <html lang="en">
      <head>
        <meta name="description" content="Complete machinery management system for agricultural operations" />
        <meta name="theme-color" content="#059669" />
      </head>
      <body>
        <SessionProvider refetchInterval={300} refetchOnWindowFocus={true}>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
