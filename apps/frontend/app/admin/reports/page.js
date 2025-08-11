"use client";

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import AdminReportsComponent from '@/components/reports/AdminReportsComponent';
import { Loader2, Shield, AlertCircle } from 'lucide-react';

export default function AdminReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  console.log('🔍 AdminReportsPage rendering...');
  console.log('🔍 Session status:', status);
  console.log('🔍 Session data:', session);
  console.log('🔍 Loading state:', loading);

  useEffect(() => {
    console.log('🔍 useEffect triggered - status:', status);
    console.log('🔍 useEffect triggered - session:', session);
    
    if (status === "loading") {
      console.log('🔍 Still loading session, waiting...');
      return; // Still loading session
    }

    if (status === "unauthenticated") {
      console.log('🔍 Unauthenticated, redirecting to login');
      router.push('/login');
      return;
    }

    // Check if user is admin
    const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';
    console.log('🔍 User role:', session?.user?.role);
    console.log('🔍 Is admin:', isAdmin);
    
    if (!isAdmin) {
      console.log('🔍 Not admin, redirecting to dashboard');
      router.push('/dashboard'); // Redirect non-admin users
      return;
    }

    console.log('🔍 All checks passed, setting loading to false');
    setLoading(false);
  }, [session, status, router]);

  if (status === "loading" || loading) {
    console.log('🔍 Showing loading screen');
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Verificando permisos de administrador...</p>
            <p className="text-sm text-gray-500 mt-2">Status: {status}, Loading: {loading.toString()}</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (status === "unauthenticated") {
    console.log('🔍 Showing unauthenticated message');
    return null; // Will redirect to login
  }

  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';

  if (!isAdmin) {
    console.log('🔍 Showing access denied');
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-sm border p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso Denegado</h2>
              <p className="text-gray-600 mb-4">
                Esta página está disponible solo para administradores.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Role actual: {session?.user?.role || 'No definido'}
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Volver al Dashboard
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  console.log('🔍 Rendering main admin reports page');

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Panel de Reportes Administrativos</h1>
                <p className="text-gray-600 mt-1">
                  Reportes consolidados de toda la organización - Pre-start, Máquinas y Diesel
                </p>
              </div>
            </div>
            
            {/* User Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {session?.user?.name?.charAt(0)?.toUpperCase() || 'A'}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-900">
                    Conectado como: {session?.user?.name || 'Administrador'}
                  </p>
                  <p className="text-sm text-blue-700">
                    Rol: {session?.user?.role} • Organización: {session?.user?.organization || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Reports Component */}
          <AdminReportsComponent />
          
        </div>
      </div>
    </Layout>
  );
}
