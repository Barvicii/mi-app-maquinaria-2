import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { calculateFilterRemainingHours, getActiveChemicalFilters } from '../../lib/filterUtils';

const PrestartDetails = ({ data }) => {
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch template when data changes
  useEffect(() => {
    const fetchTemplate = async () => {
      if (!data || !data.templateId) return;
      
      try {
        setLoading(true);
        console.log(`Fetching template with ID: ${data.templateId}`);
        
        // Build URL with additional context parameters
        let url = `/api/prestart/templates/${data.templateId}`;
        const params = new URLSearchParams();
        
        // Add machineId if available for better access control
        if (data.machineId) {
          params.append('machineId', data.machineId);
        }
        
        // Try public access first if we have machine context
        if (data.machineId) {
          params.append('public', 'true');
        }
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        
        console.log(`Requesting template from: ${url}`);
        const response = await fetch(url);
        
        if (!response.ok) {
          console.error(`Error fetching template: ${response.status}`);
          console.error('Response details:', {
            status: response.status,
            statusText: response.statusText,
            url: url
          });
          
          // Try to get error details
          try {
            const errorData = await response.json();
            console.error('Error response body:', errorData);
            setError(`Could not load template: ${errorData.error || response.statusText}`);
          } catch {
            setError(`Could not load template (${response.status})`);
          }
          
          // If public access failed and we have auth, try authenticated access
          if (response.status === 403 && params.has('public')) {
            console.log('Public access failed, trying authenticated access...');
            const authUrl = `/api/prestart/templates/${data.templateId}`;
            const authResponse = await fetch(authUrl);
            
            if (authResponse.ok) {
              const templateData = await authResponse.json();
              console.log('Template loaded via authenticated access:', templateData);
              setTemplate(templateData);
              return;
            } else {
              console.error(`Authenticated access also failed: ${authResponse.status}`);
              try {
                const authErrorData = await authResponse.json();
                console.error('Auth error response body:', authErrorData);
              } catch {
                console.error('Could not parse auth error response');
              }
            }
          }
          
          return;
        }
        
        const templateData = await response.json();
        console.log('Template loaded:', templateData);
        setTemplate(templateData);
        
      } catch (error) {
        console.error('Error fetching template:', error);
        setError('Could not load template');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTemplate();
  }, [data]);

  // Utility functions
  const getValueFromRecord = (record, field) => {
    if (!record) return null;
    
    if (record[field] !== undefined) {
      return record[field];
    }
    
    if (record.datos && record.datos[field] !== undefined) {
      return record.datos[field];
    }
    
    if (record.check && record.check[field] !== undefined) {
      return record.check[field];
    }
    
    // Look in checkValues object (new structure)
    if (record.checkValues && record.checkValues[field] !== undefined) {
      return record.checkValues[field];
    }
    
    return null;
  };

  const getStatus = (data) => {
    if (!data) return 'Unknown';

    // Check carbon filter status first - if overdue, never show OK
    if (data.machine?.filters?.carbon?.isActive) {
      const currentHours = parseInt(getValueFromRecord(data, 'horasMaquina')) || 0;
      const carbonFilter = data.machine.filters.carbon;
      const installationHours = carbonFilter.installationHours || 0;
      const expectedLifeHours = carbonFilter.expectedLifeHours || 100;
      const hoursUsed = currentHours - installationHours;
      const remainingHours = expectedLifeHours - hoursUsed;
      
      // If filter is overdue, never show OK
      if (remainingHours <= 0) {
        return 'Needs Review';
      }
    }

    // If we have a template, use its items for status checking
    if (template && template.checkItems) {
      const hasFailedChecks = template.checkItems.some(item => {
        const value = getValueFromRecord(data, item.name);
        console.log(`Checking item ${item.name}:`, value, 'Required:', item.required);
        // Any check that is explicitly false means failure
        if (value === false) return true;
        // Required items that are not true also mean failure
        if (item.required && value !== true) return true;
        return false;
      });
      
      console.log('Template check result - hasFailedChecks:', hasFailedChecks);
      return hasFailedChecks ? 'Needs Review' : 'OK';
    }

    // Fall back to default check items if no template
    const defaultCheckItems = [
      'aceite', 'agua', 'neumaticos', 'nivelCombustible',
      'lucesYAlarmas', 'frenos', 'extintores', 'cinturonSeguridad'
    ];

    const hasFailedChecks = defaultCheckItems.some(item => {
      const value = getValueFromRecord(data, item);
      console.log(`Checking default item ${item}:`, value);
      return value === false; // Any explicitly false value means failure
    });
    
    console.log('Default check result - hasFailedChecks:', hasFailedChecks);
    return hasFailedChecks ? 'Needs Review' : 'OK';
  };

  // Default check items (used if no template is available)
  const defaultCheckItems = [
    { key: 'aceite', label: 'Oil' },
    { key: 'agua', label: 'Water' },
    { key: 'neumaticos', label: 'Tires' },
    { key: 'nivelCombustible', label: 'Fuel' },
    { key: 'lucesYAlarmas', label: 'Lights' },
    { key: 'frenos', label: 'Brakes' },
    { key: 'extintores', label: 'Extinguisher' },
    { key: 'cinturonSeguridad', label: 'Seat Belt' }
  ];

  const operador = getValueFromRecord(data, 'operador');
  const horasMaquina = getValueFromRecord(data, 'horasMaquina');
  const horasProximoService = getValueFromRecord(data, 'horasProximoService');
  
  // Get vehicle-specific prestart data
  const kilometerMileage = getValueFromRecord(data, 'kilometerMileage');
  const kilometersProximoService = getValueFromRecord(data, 'kilometersProximoService');
  
  const observaciones = getValueFromRecord(data, 'observaciones');
  const fecha = data.fecha || data.createdAt;

  // Get machine/vehicle information
  const machine = data.machine || {};
  const isVehicle = machine.equipmentType === 'vehicle' || machine.equipmentType === 'Vehicle' || 
                   getValueFromRecord(data, 'equipmentType') === 'vehicle';
  const machineName = machine.nombre || machine.name || machine.nombreMaquina || '';
  
  // Get vehicle-specific information from machine record
  const regoInfo = isVehicle ? machine.rego : null;
  const rucInfo = isVehicle ? machine.ruc : null;
  
  // Get the appropriate current hours/km and next service
  // For prestart records, use the specific fields based on equipment type
  const currentHoursOrKm = isVehicle ? kilometerMileage : horasMaquina;
  const nextServiceValue = isVehicle ? kilometersProximoService : horasProximoService;
  
  // Calculate status after template is loaded
  const status = getStatus(data);
  
  // Add detailed logging for check items
  console.log('PrestartDetails - Check items debug:', {
    hasTemplate: !!template,
    templateItems: template?.checkItems,
    allDataKeys: Object.keys(data || {}),
    checkValues: data.checkValues,
    datos: data.datos,
    check: data.check,
    horasMaquina: horasMaquina,
    kilometerMileage: kilometerMileage,
    kilometersProximoService: kilometersProximoService,
    currentHoursOrKm: currentHoursOrKm,
    nextServiceValue: nextServiceValue,
    isVehicle: isVehicle,
    equipmentTypeFromData: getValueFromRecord(data, 'equipmentType'),
    machineEquipmentType: machine.equipmentType,
    aceite: getValueFromRecord(data, 'aceite'),
    agua: getValueFromRecord(data, 'agua'),
    cinturonSeguridad: getValueFromRecord(data, 'cinturonSeguridad'),
    calculatedStatus: status
  });
  
  // Function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };
  
  // Function to calculate days until expiry
  const getDaysUntilExpiry = (dateString) => {
    if (!dateString) return null;
    try {
      const expiryDate = new Date(dateString);
      const today = new Date();
      const diffTime = expiryDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return null;
    }
  };

  // Debug: Let's see what machine data we have
  console.log('PrestartDetails - Debug data:', {
    hasData: !!data,
    hasMachine: !!data.machine,
    machineType: machine.equipmentType,
    prestartEquipmentType: getValueFromRecord(data, 'equipmentType'),
    isVehicle: isVehicle,
    machineName: machineName,
    regoInfo: regoInfo,
    rucInfo: rucInfo,
    horasMaquina: horasMaquina,
    kilometerMileage: kilometerMileage,
    currentHoursOrKm: currentHoursOrKm,
    nextServiceValue: nextServiceValue,
    machineFilters: data.machine?.filters,
    carbonFilter: data.machine?.filters?.carbon,
    carbonIsActive: data.machine?.filters?.carbon?.isActive
  });

  // Determine which check items to display
  const checkItemsToDisplay = template?.checkItems 
    ? template.checkItems.map(item => ({ key: item.name, label: item.label }))
    : defaultCheckItems;

  return (
    <div className="space-y-3">
      {/* Header with key information */}
      <div className="bg-gray-50 p-2 rounded-lg border-l-4 border-indigo-500">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Pre-start Check</h3>
            <p className="text-xs text-gray-500">
              {fecha ? new Date(fecha).toLocaleDateString() : 'Date not specified'}
              {machineName && ` • ${machineName}`}
            </p>
          </div>
          <div className="flex gap-2">
            {isVehicle && (
              <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Vehicle
              </div>
            )}
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                status === 'OK' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {status}
            </div>
          </div>
        </div>
      </div>

      {/* Basic information */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white p-2 rounded-lg border border-gray-200">
          <div className="text-xs uppercase text-gray-500 font-medium">Operator:</div>
          <div className="text-sm font-semibold">{operador || 'N/A'}</div>
        </div>
        
        <div className="bg-white p-2 rounded-lg border border-gray-200">
          <div className="text-xs uppercase text-gray-500 font-medium">
            {isVehicle ? 'Kilometers:' : 'Hours:'}
          </div>
          <div className="text-sm font-semibold">
            {currentHoursOrKm ? 
              `${currentHoursOrKm} ${isVehicle ? 'km' : 'hrs'}` : 
              'N/A'
            }
          </div>
        </div>
        
        <div className="bg-white p-2 rounded-lg border border-gray-200">
          <div className="text-xs uppercase text-gray-500 font-medium">Next Service:</div>
          <div className="text-sm font-semibold">
            {nextServiceValue ? 
              `${nextServiceValue} ${isVehicle ? 'km' : 'hrs'}` : 
              'N/A'
            }
          </div>
        </div>
      </div>
      
      {/* Vehicle-specific information (REGO and RUC) */}
      {isVehicle && (regoInfo || rucInfo) && (
        <div className="bg-white p-2 rounded-lg border border-gray-200">
          <h4 className="text-xs uppercase text-gray-500 font-medium mb-2">Vehicle Registration:</h4>
          <div className="grid grid-cols-2 gap-2">
            {/* REGO Information */}
            {regoInfo && (
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-xs font-medium text-gray-700 mb-1">REGO</div>
                <div className="space-y-1">
                  <div className="text-xs">
                    <span className="text-gray-500">Expires:</span>
                    <span className="ml-1 font-medium">
                      {formatDate(regoInfo.expiryDate)}
                    </span>
                  </div>
                  {(() => {
                    const daysUntil = getDaysUntilExpiry(regoInfo.expiryDate);
                    if (daysUntil !== null) {
                      return (
                        <div className={`text-xs font-medium ${
                          daysUntil < 0 ? 'text-red-600' :
                          daysUntil <= 30 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {daysUntil < 0 ? 
                            `Expired ${Math.abs(daysUntil)} days ago` :
                            daysUntil === 0 ? 'Expires today' :
                            `${daysUntil} days remaining`
                          }
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            )}
            
            {/* RUC Information */}
            {rucInfo && (
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-xs font-medium text-gray-700 mb-1">RUC</div>
                <div className="space-y-1">
                  <div className="text-xs">
                    <span className="text-gray-500">Current:</span>
                    <span className="ml-1 font-medium">{rucInfo.currentKm || 0} km</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-gray-500">Next Due:</span>
                    <span className="ml-1 font-medium">{rucInfo.nextDueKm || 'N/A'} km</span>
                  </div>
                  {rucInfo.nextDueKm && rucInfo.currentKm && (
                    <div className={`text-xs font-medium ${
                      (rucInfo.nextDueKm - rucInfo.currentKm) <= 0 ? 'text-red-600' :
                      (rucInfo.nextDueKm - rucInfo.currentKm) <= 1000 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {rucInfo.nextDueKm - rucInfo.currentKm <= 0 ? 
                        `Overdue by ${Math.abs(rucInfo.nextDueKm - rucInfo.currentKm)} km` :
                        `${rucInfo.nextDueKm - rucInfo.currentKm} km remaining`
                      }
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Template information if available */}
      {template && (
        <div className="bg-white p-2 rounded-lg border border-gray-200">
          <div className="text-xs uppercase text-gray-500 font-medium">Template:</div>
          <div className="text-sm font-semibold">{template.name}</div>
          {template.createdBy && (
            <div className="text-xs text-gray-500 mt-1">
              Created by: {template.createdBy.name} ({template.createdBy.role})
            </div>
          )}
          {template.createdByAdmin && (
            <div className="inline-block mt-1">
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                Organization Template
              </span>
            </div>
          )}
          {template.isGlobal && (
            <div className="inline-block mt-1 ml-1">
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                Global Template
              </span>
            </div>
          )}
        </div>
      )}
      
      {/* Check Items in grid */}
      <div className="bg-white p-2 rounded-lg border border-gray-200">
        <h4 className="text-xs uppercase text-gray-500 font-medium mb-2">Check Items:</h4>
        
        {loading ? (
          <div className="flex justify-center items-center p-4">
            <Loader className="h-5 w-5 text-blue-500 animate-spin" />
            <span className="ml-2 text-sm">Loading template...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-500 p-2 rounded text-xs">
            {error}. Using default check items.
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {checkItemsToDisplay.map(({ key, label }) => {
              const isChecked = getValueFromRecord(data, key);
              return (
                <div key={key} className="flex items-center p-1 bg-gray-50 rounded text-xs">
                  {isChecked ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span>{label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Carbon Filter Information */}
      {data.machine?.filters?.carbon?.isActive && (
        <div className="bg-white p-2 rounded-lg border border-gray-200">
          <h4 className="text-xs uppercase text-gray-500 font-medium mb-2">Carbon Filter Status:</h4>
          <div className="space-y-2">
            {(() => {
              const currentHours = parseInt(horasMaquina) || 0;
              const carbonFilter = data.machine.filters.carbon;
              const installationHours = carbonFilter.installationHours || 0;
              const expectedLifeHours = carbonFilter.expectedLifeHours || 100;
              const hoursUsed = currentHours - installationHours;
              const remainingHours = expectedLifeHours - hoursUsed;
              
              return (
                <div className="bg-gray-50 p-2 rounded text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Carbon Filter</span>
                    <span className={`font-bold ${
                      remainingHours <= 0 ? 'text-red-600' :
                      remainingHours <= 40 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {remainingHours > 0 ? 
                        `${remainingHours}h remaining` : 
                        `Overdue by ${Math.abs(remainingHours)}h`
                      }
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
      
      {/* Observations */}
      {observaciones && (
        <div className="bg-white p-2 rounded-lg border border-gray-200">
          <h4 className="text-xs uppercase text-gray-500 font-medium mb-1">Observations:</h4>
          <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded">{observaciones}</p>
        </div>
      )}
    </div>
  );
};

export default PrestartDetails;