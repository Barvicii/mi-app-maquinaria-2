'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import ServiceForm from '@/components/ServiceForm';

const ServicePageClient = ({ id }) => {
  const router = useRouter();
  const [machine, setMachine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMaquina = useCallback(async () => {
    if (!id) {
      console.error('No machine ID provided');
      setError('No machine ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Fetching machine with ID:', id);
      const response = await fetch(`/api/machines/${id}`);
      const data = await response.json();

      // Add console log to check the machine data
      console.log('Machine data from API:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Error loading machine');
      }

      console.log('Machine data received:', data);
      setMachine(data);

    } catch (error) {
      console.error('Error fetching machine:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMaquina();
  }, [fetchMaquina]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <div className="text-red-600">{error}</div>
        <div className="text-sm text-gray-500 mt-2">Machine ID: {id}</div>
      </div>
    );
  }

  return machine ? (
    <ServiceForm machineId={id} machine={machine} />
  ) : (
    <div className="text-center py-4 text-gray-600">
      No machine data available
    </div>
  );
};

export default ServicePageClient;