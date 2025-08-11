'use client';

import React, { useState, useEffect } from 'react';
import { Fuel, AlertTriangle } from 'lucide-react';

const TestDieselComponent = () => {
  const [stats, setStats] = useState({
    dieselTotalCapacity: 0,
    dieselConsumed: 0,
    dieselRemaining: 0,
    dieselTanksCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/dashboard/metrics-no-auth', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Test component - API response:', data);
        
        setStats({
          dieselTotalCapacity: data.dieselTotalCapacity || 0,
          dieselConsumed: data.dieselConsumed || 0,
          dieselRemaining: data.dieselRemaining || 0,
          dieselTanksCount: data.dieselTanksCount || 0
        });
        
      } catch (err) {
        console.error('Error fetching test data:', err);
        setError('Error loading test data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold text-gray-800">Diesel Test Component</h1>
      
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-medium mb-4">Raw Stats</h3>
        <pre className="bg-gray-100 p-3 rounded text-sm">
          {JSON.stringify(stats, null, 2)}
        </pre>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-medium mb-4">Condition Check</h3>
        <p className="text-sm">
          dieselTanksCount: {stats.dieselTanksCount} ({typeof stats.dieselTanksCount})
        </p>
        <p className="text-sm">
          dieselTanksCount &gt; 0: {stats.dieselTanksCount > 0 ? 'true' : 'false'}
        </p>
        <p className="text-sm">
          Should show Fuel Management: {stats.dieselTanksCount > 0 ? 'YES' : 'NO'}
        </p>
      </div>

      {/* Sección de Fuel Management - Copia del código original */}
      {stats.dieselTanksCount > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <Fuel className="w-5 h-5 text-yellow-600 mr-2" />
            Fuel Management
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <p className="text-sm font-medium text-gray-600">Total Capacity</p>
              <p className="text-2xl font-bold text-blue-600">{stats.dieselTotalCapacity.toLocaleString()}L</p>
              <p className="text-xs text-gray-500 mt-1">{stats.dieselTanksCount} tank{stats.dieselTanksCount > 1 ? 's' : ''}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
              <p className="text-sm font-medium text-gray-600">Fuel Consumed</p>
              <p className="text-2xl font-bold text-red-600">{stats.dieselConsumed.toLocaleString()}L</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.dieselTotalCapacity > 0 ? 
                  `${Math.round((stats.dieselConsumed / stats.dieselTotalCapacity) * 100)}% of total` : 
                  'No capacity data'
                }
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
              <p className="text-sm font-medium text-gray-600">Fuel Remaining</p>
              <p className="text-2xl font-bold text-green-600">{stats.dieselRemaining.toLocaleString()}L</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.dieselTotalCapacity > 0 ? 
                  `${Math.round((stats.dieselRemaining / stats.dieselTotalCapacity) * 100)}% available` : 
                  'No capacity data'
                }
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
              <p className="text-sm font-medium text-gray-600">Efficiency</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.dieselConsumed > 0 ? 
                  `${Math.round((stats.dieselRemaining / stats.dieselConsumed) * 100)}%` : 
                  'N/A'
                }
              </p>
              <p className="text-xs text-gray-500 mt-1">Remaining vs consumed</p>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje si no hay datos de diesel */}
      {stats.dieselTanksCount === 0 && (
        <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center">
            <Fuel className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Fuel Data Available</h3>
            <p className="text-gray-500 text-sm mb-4">
              Set up diesel tanks and start tracking fuel consumption to see metrics here.
            </p>
            <button 
              onClick={() => window.location.href = '/diesel'}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Manage Fuel Tanks
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestDieselComponent;
