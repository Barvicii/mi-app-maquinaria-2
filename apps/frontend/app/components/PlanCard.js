// src/components/PlanCard.js
import React from 'react';

const PlanCard = ({ plan, onEdit, onDelete }) => {
  if (!plan) {
    console.error('PlanCard received undefined plan');
    return (
      <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
        <p className="text-red-500">Error: Plan no disponible</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold">{plan.name || 'Plan sin nombre'}</h3>
        <span className={`px-2 py-1 text-xs rounded ${plan.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {plan.isActive ? 'Activo' : 'Inactivo'}
        </span>
      </div>
      
      <p className="text-sm text-gray-600 mb-2">{plan.description || 'Sin descripción'}</p>      <div className="flex items-center mb-3">
        <span className="text-xl font-bold">
          {typeof plan.price === 'object' && plan.price && plan.price.monthly !== undefined
            ? `$${plan.price.monthly}`
            : typeof plan.price === 'number'
              ? `$${plan.price}`
              : '$0'}
        </span>
        <span className="text-sm text-gray-500 ml-1">/mes</span>
      </div>
        <div className="mb-4">
        <h4 className="text-sm font-medium mb-1">Características:</h4>
        <ul className="text-sm text-gray-600">
          {plan.featureDescriptions && Array.isArray(plan.featureDescriptions) && plan.featureDescriptions.length > 0 ? 
            plan.featureDescriptions.map((feature, index) => (
              <li key={`desc-${index}`} className="flex items-start mb-1">
                <svg className="h-4 w-4 text-green-500 mr-1 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {feature}
              </li>
            )) : 
            Array.isArray(plan.features) && plan.features.length > 0 ? 
              plan.features.map((feature, index) => (
                <li key={`arr-${index}`} className="flex items-start mb-1">
                  <svg className="h-4 w-4 text-green-500 mr-1 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              )) : 
              plan.features && typeof plan.features === 'object' ?
                Object.entries(plan.features || {}).map(([key, value]) => (
                  <li key={`obj-${key}`} className="flex items-start mb-1">
                    <svg className="h-4 w-4 text-green-500 mr-1 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {`${key}: ${value}`}
                  </li>
                )) :
                <li className="flex items-start mb-1">
                  <svg className="h-4 w-4 text-yellow-500 mr-1 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  No se encontraron características
                </li>
          }
        </ul>
      </div>
        <div className="flex space-x-2">
        {onEdit && (
          <button 
            onClick={() => onEdit(plan)} 
            className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
          >
            Editar
          </button>
        )}{onDelete && (
          <button 
            onClick={() => onDelete(plan.id || plan._id)} 
            className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100"
          >
            Eliminar
          </button>
        )}
      </div>
    </div>
  );
};

export default PlanCard;