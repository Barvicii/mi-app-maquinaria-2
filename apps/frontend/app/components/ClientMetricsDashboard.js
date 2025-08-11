'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Tractor, Clock, 
  User, AlertTriangle, Wrench, Fuel
} from 'lucide-react';
import DieselTankCard from './DieselTankCard';
import DieselSummaryCard from './DieselSummaryCard';
import CompactDieselDashboard from './CompactDieselDashboard';

const ClientMetricsDashboard = () => {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    machines: 0,
    operators: 0,
    services: 0,
    prestarts: 0,
    pendingServices: 0,
    recentActivity: [],
    // Métricas de diesel mejoradas
    dieselTotalCapacity: 0,
    dieselCurrentLevel: 0,
    dieselConsumed: 0,
    dieselRemaining: 0,
    dieselTanksCount: 0,
    dieselTotalPercentageFull: 0,
    dieselTankDetails: [] // NUEVO: Detalles de cada tanque individual
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to make API requests with credentials
  const fetchWithAuth = async (url) => {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        },
        credentials: 'same-origin' // Crucial: include credentials for user filtering
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error(`Error fetching from ${url}:`, err);
      throw err;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user) return;

      try {
        setLoading(true);
        setError(null);
        
        // Usar el endpoint de métricas del dashboard
        const metricsData = await fetchWithAuth('/api/dashboard/metrics');
        
        console.log('Dashboard metrics data:', metricsData);
        
        // Verificar que metricsData existe antes de usarlo
        if (metricsData) {
          setStats({
            machines: metricsData.machines || 0,
            operators: metricsData.operators || 0,
            services: metricsData.services || 0,
            prestarts: metricsData.prestarts || 0,
            pendingServices: metricsData.pendingServices || 0,
            completedServices: metricsData.completedServices || 0,
            recentActivity: metricsData.recentActivity || [],
            // Métricas de diesel mejoradas
            dieselTotalCapacity: metricsData.dieselTotalCapacity || 0,
            dieselCurrentLevel: metricsData.dieselCurrentLevel || 0,
            dieselConsumed: metricsData.dieselConsumed || 0,
            dieselRemaining: metricsData.dieselRemaining || 0,
            dieselTanksCount: metricsData.dieselTanksCount || 0,
            dieselTotalPercentageFull: metricsData.dieselTotalPercentageFull || 0,
            dieselTankDetails: metricsData.dieselTankDetails || []
          });
        } else {
          console.warn('No metrics data received from API');
          // Mantener los valores por defecto definidos en el useState inicial
        }
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Error loading dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

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

  // Asegurarnos de que stats existe antes de renderizar los componentes
  const safeStats = stats || {
    machines: 0,
    operators: 0,
    services: 0,
    prestarts: 0,
    pendingServices: 0,
    completedServices: 0,
    recentActivity: [],
    dieselTotalCapacity: 0,
    dieselConsumed: 0,
    dieselRemaining: 0,
    dieselTanksCount: 0
  };

  return (
    <div className="dashboard-container space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Tractor className="w-6 h-6 text-blue-600" />}
          title="Machines"
          value={safeStats.machines}
          className="border-blue-500"
        />
        <StatCard 
          icon={<User className="w-6 h-6 text-green-600" />}
          title="Operators" 
          value={safeStats.operators}
          className="border-green-500" 
        />
        <StatCard 
          icon={<Wrench className="w-6 h-6 text-orange-600" />}
          title="Services" 
          value={safeStats.services}
          className="border-orange-500" 
        />
        <StatCard 
          icon={<Clock className="w-6 h-6 text-purple-600" />}
          title="Pre-starts" 
          value={safeStats.prestarts}
          className="border-purple-500" 
        />
      </div>

      {/* NEW: Compact Fuel Dashboard (Summary + Tanks) */}
      {safeStats.dieselTanksCount > 0 && (
        <CompactDieselDashboard
          totalCapacity={safeStats.dieselTotalCapacity}
          currentLevel={safeStats.dieselCurrentLevel}
          consumed={safeStats.dieselConsumed}
          tanksCount={safeStats.dieselTanksCount}
          percentageFull={safeStats.dieselTotalPercentageFull}
          tankDetails={safeStats.dieselTankDetails}
        />
      )}

      {/* Mensaje si no hay datos de diesel */}
      {safeStats.dieselTanksCount === 0 && (
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

      {/* Visualización simple en lugar de gráficos */}
      {safeStats.dieselTanksCount === 0 && (
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

      {/* Actividad reciente */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {safeStats.recentActivity.length > 0 ? (
            safeStats.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start border-b pb-3">
                <div className="flex-shrink-0 mr-3">
                  {activity.type === 'service' ? 
                    <Wrench className="h-5 w-5 text-blue-500" /> : 
                    <Clock className="h-5 w-5 text-green-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {activity.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    Machine: {activity.machineId}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <p className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
};

function StatCard({ icon, title, value, className }) {
  return (
    <div className={`bg-white p-4 rounded-lg shadow-md border-l-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value || 0}</p>
        </div>
        <div>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default ClientMetricsDashboard;