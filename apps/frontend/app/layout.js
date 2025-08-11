'use client';

import { SessionProvider } from 'next-auth/react';
import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider refetchInterval={300} refetchOnWindowFocus={true}>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
