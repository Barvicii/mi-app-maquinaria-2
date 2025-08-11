'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { mapUserSessionData, getOrganizationName } from '@/utils/userDataUtils';

export default function SessionData() {
  const { data: session, status } = useSession();
  const [mappedData, setMappedData] = useState(null);
  const [showRaw, setShowRaw] = useState(false);

  // Mapear datos al cargar la sesión
  React.useEffect(() => {
    if (session?.user) {
      const mapped = mapUserSessionData(session.user);
      setMappedData(mapped);
    }
  }, [session]);

  if (status === 'loading') {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
        <p className="mt-4 text-gray-500">Loading session data...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-6 bg-red-50 rounded-lg shadow-md border border-red-200">
        <h2 className="text-xl font-semibold text-red-700 mb-2">No autenticado</h2>
        <p className="text-red-600">Debe iniciar sesión para ver los datos de sesión.</p>
        <a 
          href="/login" 
          className="mt-4 inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Iniciar Sesión
        </a>
      </div>
    );
  }

  // Organizar datos para visualización
  const organizationName = getOrganizationName(session.user);
  const hasCompany = !!session.user.company;
  const hasOrganization = !!session.user.organization;
  const fieldsMatch = session.user.company === session.user.organization;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Datos de Sesión</h2>
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors"
        >
          {showRaw ? 'Ver Formato Simple' : 'Ver JSON Completo'}
        </button>
      </div>

      {showRaw ? (
        <div className="bg-gray-800 p-4 rounded-md overflow-auto max-h-96">
          <pre className="text-green-400 text-sm">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Información del Usuario</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded shadow-sm">
                <span className="text-gray-500 text-sm">ID:</span>
                <p className="font-medium">{session.user.id}</p>
              </div>
              <div className="bg-white p-3 rounded shadow-sm">
                <span className="text-gray-500 text-sm">Email:</span>
                <p className="font-medium">{session.user.email}</p>
              </div>
              <div className="bg-white p-3 rounded shadow-sm">
                <span className="text-gray-500 text-sm">Nombre:</span>
                <p className="font-medium">{session.user.name}</p>
              </div>
              <div className="bg-white p-3 rounded shadow-sm">
                <span className="text-gray-500 text-sm">Rol:</span>
                <p className="font-medium">{session.user.role}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              Campos de Organización
              {!fieldsMatch && (
                <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                  INCONSISTENCIA
                </span>
              )}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className={`${hasCompany ? 'bg-white' : 'bg-red-50'} p-3 rounded shadow-sm`}>
                <span className="text-gray-500 text-sm">Company:</span>
                <p className="font-medium">{session.user.company || '(no establecido)'}</p>
                {!hasCompany && (
                  <p className="text-red-500 text-xs mt-1">¡Campo faltante!</p>
                )}
              </div>
              <div className={`${hasOrganization ? 'bg-white' : 'bg-red-50'} p-3 rounded shadow-sm`}>
                <span className="text-gray-500 text-sm">Organization:</span>
                <p className="font-medium">{session.user.organization || '(no establecido)'}</p>
                {!hasOrganization && (
                  <p className="text-red-500 text-xs mt-1">¡Campo faltante!</p>
                )}
              </div>
            </div>
            <div className="bg-white p-3 rounded shadow-sm">
              <span className="text-gray-500 text-sm">Nombre de organización (mostrado):</span>
              <p className="font-medium">{organizationName}</p>
              <p className="text-xs text-gray-500 mt-1">
                Este es el nombre que se muestra en la interfaz de usuario
              </p>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Después de mapUserSessionData()
            </h3>
            {mappedData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded shadow-sm">
                  <span className="text-gray-500 text-sm">Company mapeado:</span>
                  <p className="font-medium">{mappedData.company}</p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <span className="text-gray-500 text-sm">Organization mapeado:</span>
                  <p className="font-medium">{mappedData.organization}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Estado de la Sesión</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded shadow-sm">
                <span className="text-gray-500 text-sm">Expires:</span>
                <p className="font-medium">
                  {session.expires ? new Date(session.expires).toLocaleString() : 'N/A'}
                </p>
              </div>
              <div className="bg-white p-3 rounded shadow-sm">
                <span className="text-gray-500 text-sm">Estado:</span>
                <p className="font-medium">Autenticado</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">Diagnóstico:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li className={hasCompany && hasOrganization ? 'text-green-600' : 'text-red-600'}>
            {hasCompany && hasOrganization 
              ? 'Ambos campos están presentes ✓' 
              : 'Campos faltantes: ' + 
                (!hasCompany ? 'company ' : '') + 
                (!hasOrganization ? 'organization' : '')
            }
          </li>
          <li className={fieldsMatch ? 'text-green-600' : 'text-red-600'}>
            {fieldsMatch 
              ? 'Los campos company y organization coinciden ✓'
              : 'Los campos company y organization tienen valores diferentes'
            }
          </li>
          <li className="text-gray-700">
            Nombre mostrado en la interfaz: <span className="font-medium">{organizationName}</span>
          </li>
        </ul>
        
        {(!hasCompany || !hasOrganization || !fieldsMatch) && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
            <p className="font-medium">Se detectaron problemas con los campos de organización.</p>
            <p className="mt-1">Ejecute el script de reparación para corregir los problemas:</p>
            <pre className="bg-gray-800 text-green-400 p-2 rounded mt-2 text-sm overflow-auto">
              node scripts/fix-all-organization-fields.js
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

