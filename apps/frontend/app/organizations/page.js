'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import MachinesRegistry from '@/components/MachinesRegistry';

export default function OrganizationsPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso Denegado</h2>
        <p className="text-gray-600">Debes iniciar sesión para acceder a esta página.</p>
      </div>
    );
  }

  return <MachinesRegistry initialTab="organizations" />;
}

