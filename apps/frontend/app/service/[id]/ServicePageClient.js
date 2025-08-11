'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ServiceForm from '@/components/ServiceForm';

export default function ServicePageClient({ id }) {
  const router = useRouter();
  const [machine, setMachine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMachine = async () => {
      try {
        setLoading(true);
        // Usar la API que permite acceso público
        const response = await fetch(`/api/machines/${id}?public=true`);
        
        if (!response.ok) {
          throw new Error(`Error fetching machine: ${response.status}`);
        }
        
        const data = await response.json();
        setMachine(data);
      } catch (err) {
        console.error('Error loading machine:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMachine();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading machine information...</p>
        </div>
      </div>
    );
  }

  if (error || !machine) {
    return (
      <div className="p-4 max-w-md mx-auto bg-red-50 rounded-lg shadow-md">
        <h2 className="text-lg font-bold text-red-700 mb-2">Error al cargar datos</h2>
        <p className="text-red-600">{error || 'No se encontró la máquina'}</p>
        <button 
          onClick={() => router.push('/')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  return <ServiceForm machineId={id} machine={machine} />;
}