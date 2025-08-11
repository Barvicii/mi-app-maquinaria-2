import React from 'react';
import Link from 'next/link';
import { ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';

export default function MetricCard({ title, value, subtitle, icon, change, href, variant = 'default' }) {
  const isPositiveChange = change > 0;
  const hasChange = change !== undefined && change !== null;
  
  const getVariantClasses = () => {
    switch(variant) {
      case 'special':
        return 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200';
      default:
        return 'bg-white border-gray-200';
    }
  };
  
  return (
    <Link 
      href={href || '#'} 
      className={`block rounded-lg border ${getVariantClasses()} shadow-sm hover:shadow-md transition-shadow duration-200`}
    >
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="text-sm font-medium text-gray-500">{title}</div>
          {icon}
        </div>
        
        <div className="mb-1">
          <span className="text-2xl font-bold text-gray-900">{value}</span>
          
          {hasChange && (
            <span className={`ml-2 text-sm font-medium ${isPositiveChange ? 'text-green-600' : 'text-red-600'}`}>
              {isPositiveChange ? <TrendingUp className="inline h-4 w-4 mr-1" /> : <TrendingDown className="inline h-4 w-4 mr-1" />}
              {Math.abs(change)}%
            </span>
          )}
        </div>
        
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        
        <div className="mt-4 flex items-center text-sm text-blue-600 font-medium">
          <span>Ver detalles</span>
          <ChevronRight className="h-4 w-4 ml-1" />
        </div>
      </div>
    </Link>
  );
}