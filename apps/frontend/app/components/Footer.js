import React from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

const Footer = ({ showPublicLinks = false }) => {
  const { data: session } = useSession();
  
  return (
    <footer className="bg-gray-50 py-4 border-t border-gray-200 w-full mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Logo and Copyright */}
          <div className="flex items-center space-x-4">
            <Image src="/Imagen/logoo.png" alt="Logo" width={40} height={40} className="h-10 w-auto" />
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} Orchard Services. All rights reserved.
            </p>
          </div>

          {/* Quick Links - Solo mostrar en landing page para usuarios no autenticados */}
          {showPublicLinks && !session && (
            <div className="flex flex-wrap justify-center space-x-4">
              <a
                href="/contact"
                className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
              >
                Contact
              </a>
              <a
                href="/privacy-legal"
                className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
              >
                Privacy & Legal
              </a>
              <a
                href="/news"
                className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
              >
                News
              </a>
            </div>
          )}

          {/* Version */}
          <div className="text-sm text-gray-600">
            Version 2.0.0
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;