'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Fuel, AlertTriangle, Loader } from 'lucide-react';
import DieselForm from '@/components/DieselForm';

export default function DieselScanPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [tank, setTank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const tankId = params.id;
  const isPublic = searchParams.get('public') === 'true';
  const isTank = searchParams.get('tank') === 'true';

  useEffect(() => {
    const fetchTank = async () => {
      try {
        if (!tankId) {
          throw new Error('Tank ID is required');
        }
        
        if (!isTank) {
          throw new Error('Invalid QR code - this is not a tank QR code');
        }
        
        setLoading(true);
        setError('');
        
        const response = await fetch(`/api/diesel-tanks/${tankId}`);
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Tank not found');
        }
        
        setTank(result.tank);
        
      } catch (err) {
        console.error('Error fetching tank:', err);
        setError(err.message || 'Failed to load tank information');
      } finally {
        setLoading(false);
      }
    };

    fetchTank();
  }, [tankId, isPublic, isTank]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <Loader className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Tank...</h2>
            <p className="text-gray-600">Please wait while we retrieve tank information</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-900 mb-2">Error Loading Tank</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Fuel className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Fuel Loading Station
          </h1>
          <p className="text-gray-600">
            Record fuel consumption from diesel tank to machinery
          </p>
        </div>

        {/* Tank Information Card */}
        {tank && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{tank.name}</h2>
                <p className="text-gray-600">Tank ID: {tank.tankId}</p>
                <p className="text-gray-500">Location: {tank.location}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">{tank.capacity}L</p>
                <p className="text-sm text-gray-500">Capacity</p>
              </div>
            </div>
            {tank.description && (
              <p className="text-gray-600 mt-4 pt-4 border-t border-gray-200">
                {tank.description}
              </p>
            )}
          </div>
        )}

        {/* Diesel Form */}
        <DieselForm 
          tankId={tankId}
          publicMode={isPublic}
        />
      </div>
    </div>
  );
}
