"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ServicePageClient from './ServicePageClient';

export default function ServicePage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const [machine, setMachine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!id) return;
    
    async function fetchMachine() {
      try {
        setLoading(true);
        // Usar la API pública para obtener datos de la máquina
        const response = await fetch(`/api/public/machines/${id}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch machine data');
        }
        
        const data = await response.json();
        setMachine(data);
      } catch (err) {
        console.error('Error loading machine:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchMachine();
  }, [id]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-red-600 text-lg font-semibold mb-2">Error</h2>
          <p className="text-gray-700">{error}</p>
          <Link 
            href="/" 
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }
  
  if (!machine) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-yellow-600 text-lg font-semibold mb-2">Machine Not Found</h2>
          <p className="text-gray-700">The requested machine could not be found.</p>
          <Link 
            href="/" 
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              {machine.brand} {machine.model}
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-gray-600">Machine ID: <span className="font-semibold">{machine.machineId}</span></p>
                {machine.customId && <p className="text-gray-600">Custom ID: <span className="font-semibold">{machine.customId}</span></p>}
                <p className="text-gray-600">Serial Number: <span className="font-semibold">{machine.serialNumber}</span></p>
              </div>
              
              {machine.imagen && (
                <div className="flex justify-center md:justify-end">
                  <img 
                    src={machine.imagen} 
                    alt={`${machine.brand} ${machine.model}`} 
                    className="h-40 object-contain rounded"
                  />
                </div>
              )}
            </div>
            
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link 
                href={`/service/${id}/prestart`} 
                className="bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-lg text-center font-medium text-lg transition duration-300"
              >
                Complete Pre-start Check
              </Link>
              <Link 
                href={`/service/${id}/maintenance`} 
                className="bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-lg text-center font-medium text-lg transition duration-300"
              >
                Record Service/Maintenance
              </Link>
            </div>
            
            {/* Mostrar enlace para iniciar sesión si no hay sesión */}
            {!session && (
              <div className="mt-8 text-center">
                <p className="text-gray-600 mb-2">For full access to machine records</p>
                <Link 
                  href="/login" 
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Log in to your account
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}