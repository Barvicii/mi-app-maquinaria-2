/**
 * COMPONENTES OPTIMIZADOS CON REACT.MEMO
 * Para máximo rendimiento en listas y componentes que se re-renderizan frecuentemente
 */

import React from 'react';

// Componente optimizado para tabla de servicios
export const MemoizedServiceRow = React.memo(({ service, onView, onDelete, ...props }) => {
  return (
    <tr className="hover:bg-gray-50 border-b border-gray-200">
      <td className="px-4 py-3 text-sm text-gray-900">{service.id}</td>
      <td className="px-4 py-3 text-sm text-gray-900">{service.machineId}</td>
      <td className="px-4 py-3 text-sm text-gray-900">{service.type}</td>
      <td className="px-4 py-3 text-sm text-gray-900">{service.date}</td>
      <td className="px-4 py-3 text-sm">
        <button
          onClick={() => onView(service)}
          className="text-blue-600 hover:text-blue-800 mr-3"
        >
          Ver
        </button>
        <button
          onClick={() => onDelete(service.id)}
          className="text-red-600 hover:text-red-800"
        >
          Eliminar
        </button>
      </td>
    </tr>
  );
});

// Componente optimizado para tabla de prestart
export const MemoizedPrestartRow = React.memo(({ prestart, onView, onDelete, ...props }) => {
  return (
    <tr className="hover:bg-gray-50 border-b border-gray-200">
      <td className="px-4 py-3 text-sm text-gray-900">{prestart.id}</td>
      <td className="px-4 py-3 text-sm text-gray-900">{prestart.machineId}</td>
      <td className="px-4 py-3 text-sm text-gray-900">{prestart.operator}</td>
      <td className="px-4 py-3 text-sm text-gray-900">{prestart.date}</td>
      <td className="px-4 py-3 text-sm">
        <span className={`px-2 py-1 rounded-full text-xs ${
          prestart.status === 'completed' ? 'bg-green-100 text-green-800' :
          prestart.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {prestart.status}
        </span>
      </td>
      <td className="px-4 py-3 text-sm">
        <button
          onClick={() => onView(prestart)}
          className="text-blue-600 hover:text-blue-800 mr-3"
        >
          Ver
        </button>
        <button
          onClick={() => onDelete(prestart.id)}
          className="text-red-600 hover:text-red-800"
        >
          Eliminar
        </button>
      </td>
    </tr>
  );
});

// Componente optimizado para tabla de usuarios
export const MemoizedUserRow = React.memo(({ user, onEdit, onDelete, onToggleStatus, ...props }) => {
  return (
    <tr className="hover:bg-gray-50 border-b border-gray-200">
      <td className="px-4 py-3 text-sm text-gray-900">{user.name}</td>
      <td className="px-4 py-3 text-sm text-gray-900">{user.email}</td>
      <td className="px-4 py-3 text-sm text-gray-900">{user.role}</td>
      <td className="px-4 py-3 text-sm">
        <span className={`px-2 py-1 rounded-full text-xs ${
          user.status === 'active' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          {user.status}
        </span>
      </td>
      <td className="px-4 py-3 text-sm">
        <button
          onClick={() => onEdit(user)}
          className="text-blue-600 hover:text-blue-800 mr-3"
        >
          Editar
        </button>
        <button
          onClick={() => onToggleStatus(user)}
          className="text-yellow-600 hover:text-yellow-800 mr-3"
        >
          {user.status === 'active' ? 'Suspender' : 'Activar'}
        </button>
        <button
          onClick={() => onDelete(user.id)}
          className="text-red-600 hover:text-red-800"
        >
          Eliminar
        </button>
      </td>
    </tr>
  );
});

// Componente optimizado para cards de dashboard
export const MemoizedMetricCard = React.memo(({ title, value, icon: Icon, color = 'blue', trend, ...props }) => {
  return (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 border-${color}-500`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
          {trend && (
            <p className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '+' : ''}{trend}% vs mes anterior
            </p>
          )}
        </div>
        <Icon className={`h-8 w-8 text-${color}-600`} />
      </div>
    </div>
  );
});

// Componente optimizado para filtros
export const MemoizedFilterBar = React.memo(({ filters, onFilterChange, onClearFilters, ...props }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(filters).map(([key, value]) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </label>
            <input
              type={key.includes('date') ? 'date' : 'text'}
              value={value}
              onChange={(e) => onFilterChange(key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Filtrar por ${key}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={onClearFilters}
          className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md"
        >
          Limpiar filtros
        </button>
      </div>
    </div>
  );
});

// Agregar nombres de display para debugging
MemoizedServiceRow.displayName = 'MemoizedServiceRow';
MemoizedPrestartRow.displayName = 'MemoizedPrestartRow';
MemoizedUserRow.displayName = 'MemoizedUserRow';
MemoizedMetricCard.displayName = 'MemoizedMetricCard';
MemoizedFilterBar.displayName = 'MemoizedFilterBar';
