'use client';

import React from 'react';
import NavBar from './NavBar';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const Layout = ({ children }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState('dashboard');

  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    // Navegar a la página correspondiente según la pestaña
    switch(tab) {
      case 'dashboard':
        router.push('/dashboard');
        break;
      case 'machines':
        router.push('/machinesregistry');
        break;
      case 'prestart':
        router.push('/prestart');
        break;
      case 'services':
        router.push('/services');
        break;
      // Añadir más casos según sea necesario
      default:
        router.push(`/${tab}`);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-layout">
      <div className="container-layout">
        <div className="content-card">
          {/* Header */}
          <header className="app-header">
            <div className="logo-container flex items-center space-x-4">
              <img src="/Imagen/logoo.png" alt="Logo" className="logo-image" />
              <span className="brand-text">Orchard Service</span>
            </div>
            <NavBar activeTab={activeTab} onTabChange={handleTabChange} />
          </header>

          {/* Main Content */}
          <main className="main-content">
            {children}
          </main>

          {/* Footer */}
          <footer className="main-footer bg-gray-50 py-6 border-t border-gray-200">
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
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    Terms of Service
                  </a>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    Privacy Policy
                  </a>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    Contact Us
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Layout;