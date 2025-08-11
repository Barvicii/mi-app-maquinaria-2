'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Tractor, Clock, 
  User, AlertTriangle, Wrench
} from 'lucide-react';

export default function Dashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    machines: 0,
    operators: 0,
    services: 0,
    prestarts: 0,
    pendingServices: 0,
    completedServices: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Función mejorada para hacer peticiones a la API con credenciales
  const fetchWithAuth = async (url) => {
    // Añadir timestamp para evitar caché
    const timestamp = Date.now();
    url = url.includes('?') ? `${url}&_t=${timestamp}` : `${url}?_t=${timestamp}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        },
        credentials: 'same-origin' // Crucial: incluir credenciales para filtrado por usuario
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error(`Error fetching from ${url}:`, err);
      throw err; // Re-lanzar el error para manejarlo en fetchData
    }
  };
  
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user) return;

      try {
        setLoading(true);
        setError(null);
        
        // CAMBIO CLAVE: Usar el endpoint de métricas del dashboard
        const metricsData = await fetchWithAuth('/api/dashboard/metrics');
        
        console.log('Dashboard metrics data:', metricsData);
        
        // Actualizar el estado con los datos ya filtrados por la API
        setStats({
          machines: metricsData.machines || 0,
          operators: metricsData.operators || 0,
          services: metricsData.services || 0,
          prestarts: metricsData.prestarts || 0,
          pendingServices: metricsData.pendingServices || 0,
          completedServices: metricsData.completedServices || 0,
          recentActivity: metricsData.recentActivity || []
        });
        
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

  return (
    <div className="dashboard-container space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Tractor className="w-6 h-6 text-blue-600" />}
          title="Machines"
          value={stats.machines}
          className="border-blue-500"
        />
        <StatCard 
          icon={<User className="w-6 h-6 text-green-600" />}
          title="Operators" 
          value={stats.operators}
          className="border-green-500" 
        />
        <StatCard 
          icon={<Wrench className="w-6 h-6 text-orange-600" />}
          title="Services" 
          value={stats.services}
          className="border-orange-500" 
        />
        <StatCard 
          icon={<Clock className="w-6 h-6 text-purple-600" />}
          title="Pre-starts" 
          value={stats.prestarts}
          className="border-purple-500" 
        />
      </div>

      {/* Visualización simple en lugar de gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución de estado de servicios */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-medium mb-4">Services Status</h3>
          <div className="flex space-x-4">
            <div className="flex-1 bg-orange-100 p-4 rounded-md text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.pendingServices}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="flex-1 bg-green-100 p-4 rounded-md text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completedServices}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
        </div>

        {/* Distribución de actividad */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-medium mb-4">Activity Distribution</h3>
          <div className="flex space-x-4">
            <div className="flex-1 bg-blue-100 p-4 rounded-md text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.services}</div>
              <div className="text-sm text-gray-600">Services</div>
            </div>
            <div className="flex-1 bg-purple-100 p-4 rounded-md text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.prestarts}</div>
              <div className="text-sm text-gray-600">Pre-starts</div>
            </div>
          </div>
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {stats.recentActivity.length > 0 ? (
            stats.recentActivity.map((activity, index) => (
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
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    activity.status === 'Completed' || activity.status === 'Finalizado' ? 
                      'bg-green-100 text-green-800' : 
                      'bg-yellow-100 text-yellow-800'
                  }`}>
                    {activity.status}
                  </span>
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
}

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