'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Footer from './Footer';
import Image from 'next/image';

const Layout = ({ children }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  
  // Determinar la pestaña activa basada en la ruta
  const getActiveTabFromPath = (path) => {
    if (path.includes('/dashboard')) return 'dashboard';
    if (path.includes('/machines') || path.includes('/machinesregistry')) return 'machines';
    if (path.includes('/prestart')) return 'prestart';
    if (path.includes('/services')) return 'services';
    if (path.includes('/diesel')) return 'diesel';
    if (path.includes('/qr')) return 'qr';
    if (path.includes('/operators')) return 'operators';
    if (path.includes('/reports')) return 'reports';
    if (path.includes('/alerts')) return 'alerts';
    if (path.includes('/organizations')) return 'organizations';
    if (path.includes('/admin/reports')) return 'admin-reports';
    return 'dashboard'; // default
  };
  
  const [activeTab, setActiveTab] = useState(getActiveTabFromPath(pathname));

  // Actualizar activeTab cuando cambie la ruta
  useEffect(() => {
    setActiveTab(getActiveTabFromPath(pathname));
  }, [pathname]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    
    // Navegar a la página correspondiente según la pestaña seleccionada
    switch(tabId) {
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
      case 'diesel':
        router.push('/diesel');
        break;
      case 'qr':
        router.push('/qr');
        break;
      case 'operators':
        router.push('/operators');
        break;
      case 'reports':
        router.push('/reports');
        break;
      case 'alerts':
        router.push('/alerts');
        break;
      case 'organizations':
        router.push('/organizations');
        break;
      case 'admin-reports':
        router.push('/admin/reports');
        break;
    }
  };

  // Layout no maneja autenticación - eso lo hace cada página
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow bg-gray-50 p-0">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;