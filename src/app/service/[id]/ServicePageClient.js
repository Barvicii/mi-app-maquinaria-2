'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ServiceForm from '@/components/ServiceForm';
import { useRouter } from 'next/navigation';

const ServicePage = ({ params }) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [maquina, setMaquina] = useState(null);
  const router = useRouter();

  // Use React.use() to unwrap the params before accessing id
  const id = React.use(params).id;

  const fetchMaquina = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/machines/${id}`, {
        // Add cache: 'no-store' to avoid caching
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(response.status === 404 ? 'Máquina no encontrada' : 'Error al cargar la máquina');
      }

      const data = await response.json();
      setMaquina(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching machine:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMaquina();
  }, [fetchMaquina]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <p className="text-lg text-black">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-black mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (!maquina) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-black mb-4">Máquina no encontrada</h2>
          <p className="text-gray-600 mb-4">La máquina que estás buscando no existe.</p>
          <button
            onClick={() => router.back()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return <ServiceForm maquinaId={id} maquinaData={maquina} />;
};

export default ServicePage;