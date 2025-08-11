'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';

export default function SessionDebug() {
  const { data: session, status } = useSession();
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="p-4 bg-gray-100 mt-4 rounded">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Diagnóstico de Sesión</h2>
        <button 
          onClick={() => setExpanded(!expanded)}
          className="px-2 py-1 bg-blue-500 text-white rounded"
        >
          {expanded ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
      
      <p>Estado: {status}</p>
      <p>Usuario: {session?.user?.email || 'No hay usuario'}</p>
      <p>ID: {session?.user?.id || 'Sin ID'}</p>
      
      {expanded && (
        <pre className="mt-2 p-2 bg-gray-200 rounded overflow-auto text-xs">
          {JSON.stringify(session, null, 2)}
        </pre>
      )}
    </div>
  );
}