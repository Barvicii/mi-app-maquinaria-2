"use client";

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import MachinesRegistry from '@/components/MachinesRegistry';

export default function MachinesRegistryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Si no está autenticado, redirigir a login
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

  // Si ya se verificó que está autenticado, mostrar la aplicación
  if (session) {
    return <MachinesRegistry />;
  }

  return null; // No mostrar nada mientras redirige
}