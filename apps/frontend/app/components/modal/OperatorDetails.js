import React from 'react';

const OperatorDetails = ({ operator }) => {
  // Obtener valores con fallbacks para evitar errores
  const nombre = operator.nombre || '';
  const apellido = operator.apellido || '';
  const tipo = operator.tipo || '';
  const activo = operator.activo !== undefined ? operator.activo : true;
  const telefono = operator.telefono || '';
  const email = operator.email || '';
  const fechaIngreso = operator.fechaIngreso || '';
  const licencia = operator.licencia || '';
  const especialidad = operator.especialidad || '';
  
  return (
    <div className="space-y-5">
      {/* Encabezado con información clave */}
      <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-indigo-500">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div>
            <h3 className="font-medium text-gray-900">{`${nombre} ${apellido}`}</h3>
            <p className="text-sm text-gray-500">
              {tipo === 'operator' ? 'Operator' : 'Technician'}
            </p>
          </div>
          <div className={`mt-2 md:mt-0 px-3 py-1 rounded-full text-sm font-medium ${
            activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {activo ? 'Active' : 'Inactive'}
          </div>
        </div>
      </div>

      {/* Información de contacto */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h4 className="text-sm uppercase tracking-wide text-gray-500 font-medium mb-3">Contact Information</h4>
        <div className="grid grid-cols-1 gap-2">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <span className="text-gray-600">Phone:</span>
            <span className="font-medium">{telefono || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium">{email || 'N/A'}</span>
          </div>
        </div>
      </div>
      
      {/* Detalles laborales */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h4 className="text-sm uppercase tracking-wide text-gray-500 font-medium mb-3">Employment Details</h4>
        <div className="grid grid-cols-1 gap-2">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <span className="text-gray-600">Start Date:</span>
            <span className="font-medium">
              {fechaIngreso ? new Date(fechaIngreso).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          
          {tipo === 'operator' && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">License:</span>
              <span className="font-medium">{licencia || 'N/A'}</span>
            </div>
          )}
          
          {tipo === 'technician' && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Specialty:</span>
              <span className="font-medium">{especialidad || 'N/A'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Experiencia y formación - opcional, implementar si está disponible en los datos */}
      {(operator.experiencia || operator.formacion) && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="text-sm uppercase tracking-wide text-gray-500 font-medium mb-3">Experience & Training</h4>
          
          {operator.experiencia && (
            <div className="mb-3">
              <span className="block text-gray-600 mb-1">Experience:</span>
              <p className="text-gray-700 bg-gray-50 p-2 rounded">{operator.experiencia}</p>
            </div>
          )}
          
          {operator.formacion && (
            <div>
              <span className="block text-gray-600 mb-1">Training:</span>
              <p className="text-gray-700 bg-gray-50 p-2 rounded">{operator.formacion}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OperatorDetails;