import React from 'react';
import { Fuel, Droplets, TrendingUp, Calendar, MapPin } from 'lucide-react';

const DieselTankCard = ({ tank }) => {
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
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 hover:shadow-lg transition-shadow">
      {/* Header compacto */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          <Fuel className="w-4 h-4 mr-2 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">{tank.name || `Tanque ${tank.tankId}`}</h3>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tank.percentageFull)}`}>
          {tank.percentageFull}%
        </div>
      </div>

      {/* Información básica */}
      <div className="mb-3">
        <div className="flex items-center text-xs text-gray-600 mb-1">
          <MapPin className="w-3 h-3 mr-1" />
          {tank.location || 'No especificada'}
        </div>
        <div className="text-xs text-gray-500">
          {tank.currentLevel}L / {tank.capacity}L
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="mb-3">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(tank.percentageFull)}`}
            style={{ width: `${Math.min(tank.percentageFull, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Métricas compactas */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="text-center">
          <div className="font-semibold text-gray-900">{tank.consumed}L</div>
          <div className="text-gray-500">Consumido</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-gray-900">{tank.refillsCount || 0}</div>
          <div className="text-gray-500">Refills</div>
        </div>
      </div>

      {/* Alerta si el nivel es bajo */}
      {tank.percentageFull < 30 && (
        <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded text-center">
          ⚠️ Nivel bajo
        </div>
      )}
    </div>
  );
};

export default DieselTankCard;
