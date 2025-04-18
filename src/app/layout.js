import { GeistSans } from 'geist/font';
import { Inter } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '@/components/AuthProvider';
import Providers from '@/components/Providers';
import Footer from '@/components/Footer';
import "./globals.css";
import '../styles/tables.css';

const geist = GeistSans;

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

export const metadata = {
  title: "Orchard Services",
  description: "Machinery Management App",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <main>
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}