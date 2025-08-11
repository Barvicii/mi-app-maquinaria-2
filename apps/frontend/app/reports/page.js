'use client';

import React from 'react';
import Layout from '@/components/Layout';
import MachinesRegistry from '@/components/MachinesRegistry';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirigir si no está autenticado
  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Mientras verifica la sesión
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Si ya se verificó que está autenticado, mostrar el contenido
  if (session) {
    return (
      <Layout>
        <MachinesRegistry initialTab="reports" />
      </Layout>
    );
  }

  return null;
}

