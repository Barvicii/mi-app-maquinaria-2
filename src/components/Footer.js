import React from 'react';
import Image from 'next/image';

const Footer = () => {
  return (
    <footer className="main-footer bg-gray-50 py-6 border-t border-gray-200 mt-auto">
      <div className="footer-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="footer-content flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Logo and Copyright */}
          <div className="footer-logo flex items-center space-x-4">
            <img src="/Imagen/logoo.png" alt="Logo" className="h-12 w-auto" />
            <p className="footer-copyright text-sm text-gray-600">
              © {new Date().getFullYear()} Orchard Services. All rights reserved.
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-links flex flex-wrap justify-center space-x-4">
            <a
              href="#"
              className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
            >
              Contact
            </a>
            <a
              href="#"
              className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
            >
              Privacy & Legal
            </a>
            <a
              href="#"
              className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
            >
              News
            </a>
          </div>

          {/* Version */}
          <div className="footer-version text-sm text-gray-600">
            Version 1.0.0
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;