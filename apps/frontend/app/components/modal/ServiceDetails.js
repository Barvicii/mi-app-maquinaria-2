import React from 'react';

const ServiceDetails = ({ data, trabajosPredefinidos }) => {
  // Helper function to get values from any location in the record
  const getValueFromRecord = (record, field) => {
    if (record && record[field] !== undefined) {
      return record[field];
    }
    if (record && record.datos && record.datos[field] !== undefined) {
      return record.datos[field];
    }
    return null;
  };

  // Obtener valores con fallbacks para evitar errores
  const tipoService = getValueFromRecord(data, 'tipoService') || '';
  const tecnico = getValueFromRecord(data, 'tecnico') || '';
  const observaciones = getValueFromRecord(data, 'observaciones') || '';
  const repuestos = getValueFromRecord(data, 'repuestos') || '';
  const fecha = data.fecha || data.createdAt || '';
  const costo = getValueFromRecord(data, 'costo') || 0;
  
  // Helper function to capitalize first letter
  const capitalizeFirst = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };
  
  // Asegurar que trabajosRealizados sea un array
  const trabajosRealizados = Array.isArray(getValueFromRecord(data, 'trabajosRealizados')) ? 
    getValueFromRecord(data, 'trabajosRealizados') : [];
    
  // Determinar el tipo de equipo y obtener información correspondiente
  const equipmentType = getValueFromRecord(data, 'equipmentType') || 
                       (data.machine && data.machine.equipmentType) || 
                       'machine';
  const isVehicle = equipmentType === 'vehicle' || equipmentType === 'Vehicle';
  
  // Obtener información del equipo si está disponible
  const machine = data.machine || {};
  const machineName = getValueFromRecord(data, 'maquina') || 
                     machine.nombre || machine.name || machine.nombreMaquina || 
                     getValueFromRecord(data, 'customMachineId') || '';
  
  // Get current hours/kilometers based on equipment type
  let currentValue, nextServiceValue, hoursLabel;
  
  if (isVehicle) {
    currentValue = getValueFromRecord(data, 'kilometersActuales') || 
                   getValueFromRecord(data, 'currentKilometers') || 
                   getValueFromRecord(data, 'kilometerMileage') || 0;
    nextServiceValue = getValueFromRecord(data, 'kilometersProximoService') || 
                      getValueFromRecord(data, 'nextServiceKm') || 0;
    hoursLabel = 'km';
  } else {
    currentValue = getValueFromRecord(data, 'horasActuales') || 
                   getValueFromRecord(data, 'currentHours') || 0;
    nextServiceValue = getValueFromRecord(data, 'horasProximoService') || 
                      getValueFromRecord(data, 'nextServiceHours') || 0;
    hoursLabel = 'hrs';
  }

  // Get RUC renewal info if it's a vehicle service with RUC data
  const rucRenewal = getValueFromRecord(data, 'rucRenewal');
  
  return (
    <div className="space-y-5">
      {/* Encabezado con información clave */}
      <div className="modal-header-info">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div>
            <h3 className="modal-header-title">{capitalizeFirst(tipoService) || 'Service Record'}</h3>
            <p className="modal-header-subtitle">
              {fecha ? new Date(fecha).toLocaleDateString() : 'Date not specified'}
              {machineName && ` • ${machineName}`}
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-2 mt-2 md:mt-0">
            {equipmentType && (
              <div className={`px-3 py-1 rounded-full border text-sm ${
                isVehicle ? 'bg-green-50 border-green-200 text-green-700' : 'bg-blue-50 border-blue-200 text-blue-700'
              }`}>
                {equipmentType === 'vehicle' ? 'Vehicle' : 'Machine'}
              </div>
            )}
            {tecnico && (
              <div className="bg-white px-3 py-1 rounded-full border text-sm">
                Technician: {tecnico}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Horas/Km de la máquina */}
      <div className="grid grid-cols-2 gap-4">
        <div className="modal-card">
          <div className="modal-card-label">Current {isVehicle ? 'Kilometers' : 'Hours'}:</div>
          <div className="modal-card-value">
            {currentValue > 0 ? `${currentValue.toLocaleString()} ${hoursLabel}` : 'N/A'}
          </div>
        </div>
        
        <div className="modal-card">
          <div className="modal-card-label">Next Service:</div>
          <div className="modal-card-value">
            {nextServiceValue > 0 ? `${nextServiceValue.toLocaleString()} ${hoursLabel}` : 'N/A'}
          </div>
        </div>
      </div>

      {/* Cost information if available */}
      {costo > 0 && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="text-sm uppercase tracking-wide text-gray-500 font-medium mb-2">Service Cost</h4>
          <div className="text-lg font-semibold text-gray-900">${costo.toLocaleString()}</div>
        </div>
      )}

      {/* RUC Renewal Information for vehicles */}
      {isVehicle && rucRenewal && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="text-sm uppercase tracking-wide text-blue-700 font-medium mb-3">RUC Renewal Details</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-blue-600 mb-1">Current KM:</div>
              <div className="text-sm font-semibold text-blue-900">
                {rucRenewal.currentKm ? `${rucRenewal.currentKm.toLocaleString()} km` : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-xs text-blue-600 mb-1">Next Due KM:</div>
              <div className="text-sm font-semibold text-blue-900">
                {rucRenewal.nextDueKm ? `${rucRenewal.nextDueKm.toLocaleString()} km` : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}
      
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