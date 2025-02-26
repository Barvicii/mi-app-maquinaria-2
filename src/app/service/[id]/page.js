'use client';

import React, { useState, useEffect } from 'react';
import ServiceForm from '@/components/ServiceForm';

const ServicePage = ({ params }) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [maquina, setMaquina] = useState(null);

  // Usar React.use() para obtener el ID
  const id = React.use(params).id;

  useEffect(() => {
    const fetchMaquina = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/maquinas/${id}`);
        
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
    };

    if (id) {
      fetchMaquina();
    }
  }, [id]);

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
            onClick={() => window.history.back()}
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
            onClick={() => window.history.back()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return <ServiceForm maquinaId={id} />;
};

export default ServicePage;