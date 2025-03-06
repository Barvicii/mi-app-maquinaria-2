'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Wrench, Activity, Settings, Users
} from 'lucide-react';

const Dashboard = ({ onNavigate }) => {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status !== 'loading') {
      setIsLoading(false);
    }
  }, [status]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-gray-50 p-6 rounded-lg shadow-lg">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {session?.user?.name || 'User'}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => onNavigate('machines')} 
              className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors duration-200"
            >
              <Wrench className="h-6 w-6 text-indigo-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">Machines</span>
            </button>
            
            <button 
              onClick={() => onNavigate('prestart')} 
              className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors duration-200"
            >
              <Activity className="h-6 w-6 text-green-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">Pre-Starts</span>
            </button>
            
            <button 
              onClick={() => onNavigate('services')} 
              className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors duration-200"
            >
              <Settings className="h-6 w-6 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">Services</span>
            </button>
            
            <button 
              onClick={() => onNavigate('operators')} 
              className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors duration-200"
            >
              <Users className="h-6 w-6 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">Operators</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;