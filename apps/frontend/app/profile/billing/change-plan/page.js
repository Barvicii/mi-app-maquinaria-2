'use client';

import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

export default function ChangePlanPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen p-6 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Cambio de Plan Deshabilitado
        </h1>
        <p className="text-gray-600 mb-6">
          Actualmente tienes acceso completo a todas las funcionalidades. 
          No es necesario cambiar de plan.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al Dashboard
        </button>
      </div>
    </div>
  );
}
