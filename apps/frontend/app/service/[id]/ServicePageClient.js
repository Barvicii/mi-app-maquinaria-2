'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ServiceForm from '@/components/ServiceForm';

export default function ServicePageClient({ id }) {
  const router = useRouter();
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        setLoading(true);
        
        // Add cache-busting parameter for fresh data
        const timestamp = Date.now();
        
        // Primero intentar buscar en vehicles
        let response = await fetch(`/api/vehicles/${id}?public=true&_t=${timestamp}`);
        let data = null;
        let equipmentType = 'machinery'; // default
        
        if (response.ok) {
          data = await response.json();
          equipmentType = 'vehicle';
        } else {
          // Si no está en vehicles, buscar en machines
          response = await fetch(`/api/machines/${id}?public=true&_t=${timestamp}`);
          
          if (!response.ok) {
            throw new Error(`Equipment not found: ${response.status}`);
          }
          
          data = await response.json();
          equipmentType = 'machinery';
        }
        
        // Agregar el tipo de equipo a los datos
        setEquipment({
          ...data,
          equipmentType: equipmentType
        });
        
      } catch (err) {
        console.error('Error loading equipment:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEquipment();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading equipment information...</p>
        </div>
      </div>
    );
  }

  if (error || !equipment) {
    return (
      <div className="p-4 max-w-md mx-auto bg-red-50 rounded-lg shadow-md">
        <h2 className="text-lg font-bold text-red-700 mb-2">Error al cargar datos</h2>
        <p className="text-red-600">{error || 'No se encontró el equipo'}</p>
        <button 
          onClick={() => router.push('/')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  return <ServiceForm machineId={id} machine={equipment} />;
}