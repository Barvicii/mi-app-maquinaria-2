'use client';

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import ClientMetricsDashboard from '@/components/ClientMetricsDashboard';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Mientras verifica la sesión
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

  // Si ya se verificó que está autenticado, mostrar el dashboard
  if (session) {
    return (
      <Layout>
        <div className="p-6">
          <ClientMetricsDashboard />
        </div>
      </Layout>
    );
  }

  return null; // No mostrar nada mientras redirige
}
