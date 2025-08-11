'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import MachinesRegistry from '@/components/MachinesRegistry';
import Layout from '@/components/Layout';

const MachinesPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Obtener el parámetro 'tab' para establecer la pestaña activa inicial
  let initialTab = 'dashboard'; // Valor por defecto
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      initialTab = tabParam;
    }
  }

  React.useEffect(() => {
    if (status !== 'loading' && !session) {
      router.push('/login');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto">
        <MachinesRegistry initialTab={initialTab} />
      </div>
    </Layout>
  );
};

export default MachinesPage;

