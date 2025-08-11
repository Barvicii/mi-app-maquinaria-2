import React from 'react';
import { Fuel, BarChart3, Droplets, TrendingUp, Target, MapPin } from 'lucide-react';

const CompactDieselDashboard = ({ 
  totalCapacity, 
  currentLevel, 
  consumed, 
  tanksCount, 
  percentageFull,
  tankDetails = []
}) => {
  const getStatusColor = (percentage) => {
    if (percentage >= 70) return 'text-green-600 bg-green-100';
    if (percentage >= 30) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getProgressBarColor = (percentage) => {
    if (percentage >= 70) return 'bg-green-500';
    if (percentage >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg shadow-lg border-2 border-blue-200 p-6 space-y-6">
      {/* Header del Resumen General */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
            Fuel - Summary and Tanks
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {tanksCount} tank{tanksCount !== 1 ? 's' : ''} configured
          </p>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total Capacity</p>
              <p className="text-xl font-semibold text-blue-600">{totalCapacity}L</p>
            </div>
            <Target className="w-8 h-8 text-blue-500 opacity-70" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Current Level</p>
              <p className="text-xl font-semibold text-green-600">{currentLevel}L</p>
            </div>
            <Fuel className="w-8 h-8 text-green-500 opacity-70" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Consumed</p>
              <p className="text-xl font-semibold text-orange-600">{consumed}L</p>
            </div>
            <Droplets className="w-8 h-8 text-orange-500 opacity-70" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Occupancy</p>
              <p className="text-xl font-semibold text-purple-600">{percentageFull}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500 opacity-70" />
          </div>
        </div>
      </div>

      {/* Global progress bar */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-gray-700">Global Level</span>
          <span className="text-xs text-gray-600">{currentLevel}L of {totalCapacity}L</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className={`h-4 rounded-full transition-all duration-500 ${
              percentageFull >= 70 ? 'bg-green-500' :
              percentageFull >= 30 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(percentageFull, 100)}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Separador visual */}
      <div className="border-t border-blue-200"></div>

      {/* Individual Tanks */}
      {tankDetails && tankDetails.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
            <Fuel className="w-4 h-4 mr-2 text-blue-600" />
            Individual Tanks
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            {tankDetails.map((tank) => (
              <div key={tank._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                {/* Header del tanque compacto */}
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-800 truncate">
                      {tank.name || `Tank ${tank.tankId}`}
                    </h4>
                    <div className="text-xs text-gray-500">
                      ID: {tank.tankId || tank._id}
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(tank.percentageFull)}`}>
                    {tank.percentageFull}%
                  </div>
                </div>

                {/* Barra de progreso compacta */}
                <div className="mb-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(tank.percentageFull)}`}
                      style={{ width: `${Math.min(tank.percentageFull, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Compact metrics */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Current:</span>
                    <span className="font-medium text-sm">{tank.currentLevel}L</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Capacity:</span>
                    <span className="font-medium text-sm">{tank.capacity}L</span>
                  </div>
                  {tank.location && (
                    <div className="flex items-center text-xs text-gray-500 mt-2">
                      <MapPin className="w-3 h-3 mr-1" />
                      <span className="truncate">{tank.location}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {percentageFull < 50 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h5 className="font-medium text-yellow-800 mb-2">🔔 Recommendations:</h5>
          <ul className="text-xs text-yellow-700 space-y-1">
            {percentageFull < 30 && <li>• Schedule urgent refill</li>}
            {percentageFull < 50 && <li>• Check average daily consumption</li>}
            <li>• Monitor levels more frequently</li>
            <li>• Consider optimizing machine routes</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default CompactDieselDashboard;
