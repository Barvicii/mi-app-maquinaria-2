import React from 'react';
import { Fuel, BarChart3, Droplets, TrendingUp, Target } from 'lucide-react';

const DieselSummaryCard = ({ 
  totalCapacity, 
  currentLevel, 
  consumed, 
  tanksCount, 
  percentageFull 
}) => {
  // Calculate status based on percentage
  const getStatusInfo = () => {
    if (percentageFull >= 70) {
      return {
        status: 'Good',
        color: 'bg-green-100 text-green-800',
        icon: '✓'
      };
    } else if (percentageFull >= 30) {
      return {
        status: 'Warning',
        color: 'bg-yellow-100 text-yellow-800',
        icon: '⚠'
      };
    } else {
      return {
        status: 'Critical',
        color: 'bg-red-100 text-red-800',
        icon: '⚠'
      };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg shadow-lg border-2 border-blue-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="w-6 h-6 mr-3 text-blue-600" />
            General Fuel Summary
          </h2>
          <p className="text-gray-600 mt-1">
            Consolidated status of {tanksCount} tank{tanksCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className={`px-4 py-2 rounded-full font-semibold ${statusInfo.color}`}>
          {statusInfo.icon} {statusInfo.status}
        </div>
      </div>

      {/* Main metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Capacity</p>
              <p className="text-2xl font-bold text-blue-600">{totalCapacity}L</p>
            </div>
            <Target className="w-8 h-8 text-blue-500 opacity-70" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Level</p>
              <p className="text-2xl font-bold text-green-600">{currentLevel}L</p>
            </div>
            <Fuel className="w-8 h-8 text-green-500 opacity-70" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Consumed</p>
              <p className="text-2xl font-bold text-orange-600">{consumed}L</p>
            </div>
            <Droplets className="w-8 h-8 text-orange-500 opacity-70" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Occupancy</p>
              <p className="text-2xl font-bold text-purple-600">{percentageFull}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500 opacity-70" />
          </div>
        </div>
      </div>

      {/* Global progress bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Global Level</span>
          <span className="text-sm text-gray-600">{currentLevel}L de {totalCapacity}L</span>
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
    </div>
  );
};

export default DieselSummaryCard;
