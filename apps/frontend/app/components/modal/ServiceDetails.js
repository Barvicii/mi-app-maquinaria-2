import React from 'react';

const ServiceDetails = ({ data, trabajosPredefinidos }) => {
  // Obtener valores con fallbacks para evitar errores
  const tipoService = data.tipoService || '';
  const tecnico = data.tecnico || '';
  const horasActuales = data.horasActuales || 0;
  const horasProximoService = data.horasProximoService || 0;
  const observaciones = data.observaciones || '';
  const repuestos = data.repuestos || '';
  const fecha = data.fecha || data.createdAt || '';
  
  // Asegurar que trabajosRealizados sea un array
  const trabajosRealizados = Array.isArray(data.trabajosRealizados) ? 
    data.trabajosRealizados : [];
  
  return (
    <div className="space-y-5">
      {/* Encabezado con información clave */}
      <div className="modal-header-info">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div>
            <h3 className="modal-header-title">{tipoService || 'Service Record'}</h3>
            <p className="modal-header-subtitle">
              {fecha ? new Date(fecha).toLocaleDateString() : 'Date not specified'}
            </p>
          </div>
          {tecnico && (
            <div className="mt-2 md:mt-0 bg-white px-3 py-1 rounded-full border text-sm">
              Technician: {tecnico}
            </div>
          )}
        </div>
      </div>

      {/* Horas de la máquina */}
      <div className="grid grid-cols-2 gap-4">
        <div className="modal-card">
          <div className="modal-card-label">Current Hours:</div>
          <div className="modal-card-value">{horasActuales > 0 ? `${horasActuales} hrs` : 'N/A'}</div>
        </div>
        
        <div className="modal-card">
          <div className="modal-card-label">Next Service:</div>
          <div className="modal-card-value">{horasProximoService > 0 ? `${horasProximoService} hrs` : 'N/A'}</div>
        </div>
      </div>
      
      {/* Trabajos realizados */}
      {trabajosRealizados.length > 0 && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="text-sm uppercase tracking-wide text-gray-500 font-medium mb-2">Work Performed</h4>
          <ul className="space-y-1">
            {trabajosRealizados.map((trabajo, index) => {
              let trabajoText = trabajo;
              if (typeof trabajo === 'number' && trabajosPredefinidos) {
                const trabajoInfo = trabajosPredefinidos.find(t => t.id === trabajo);
                if (trabajoInfo) {
                  trabajoText = trabajoInfo.descripcion;
                }
              }
              return (
                <li key={index} className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mr-2 flex-shrink-0"></div>
                  <span className="text-gray-700">{trabajoText}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      
      {/* Repuestos utilizados */}
      {repuestos && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="text-sm uppercase tracking-wide text-gray-500 font-medium mb-2">Parts Used:</h4>
          <p className="text-gray-700">{repuestos}</p>
        </div>
      )}
      
      {/* Observaciones */}
      {observaciones && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="text-sm uppercase tracking-wide text-gray-500 font-medium mb-2">Observations</h4>
          <p className="text-gray-700">{observaciones}</p>
        </div>
      )}
    </div>
  );
};

export default ServiceDetails;