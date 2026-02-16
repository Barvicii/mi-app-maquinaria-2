'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Notification from './Notification';

// Define trabajosPredefinidos array
const trabajosPredefinidos = [
  { id: 1, descripcion: 'Oil Change' },
  { id: 2, descripcion: 'Filter Replacement' },
  { id: 3, descripcion: 'Brake Check' },
  { id: 4, descripcion: 'Tire Rotation' },
  { id: 5, descripcion: 'Fluid Check' },
  { id: 6, descripcion: 'Belt Inspection' },
  { id: 7, descripcion: 'Battery Test' },
  { id: 8, descripcion: 'Air Filter Change' },
  { id: 9, descripcion: 'Spark Plug Check' },
  { id: 10, descripcion: 'General Inspection' },
  { id: 11, descripcion: 'Carbon Filter Replacement' },
  { id: 13, descripcion: 'Renew RUC' },
  { id: 14, descripcion: 'Renew REGO' },
  { id: 12, descripcion: 'Custom' }
];

// Component for chemical filter replacement form
const ChemicalFilterReplacementForm = ({ machine, serviceData, setServiceData }) => {
  const filterTypes = [];
  
  if (machine.chemicalFilters.filterType === 'air' || machine.chemicalFilters.filterType === 'both') {
    filterTypes.push('air');
  }
  if (machine.chemicalFilters.filterType === 'carbon' || machine.chemicalFilters.filterType === 'both') {
    filterTypes.push('carbon');
  }

  const updateFilter = (index, field, value) => {
    setServiceData(prev => ({
      ...prev,
      newFilters: prev.newFilters.map((filter, i) => 
        i === index ? { ...filter, [field]: value } : filter
      )
    }));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">
        Select which filters to replace and provide details for tracking:
      </p>
      
      {filterTypes.map((filterType, index) => (
        <div key={filterType} className="bg-white p-4 rounded border">
          <div className="flex items-center gap-3 mb-3">
            <input
              type="checkbox"
              id={`filter-${filterType}`}
              checked={serviceData.newFilters?.[index]?.replace || false}
              onChange={(e) => {
                updateFilter(index, 'replace', e.target.checked);
                updateFilter(index, 'type', filterType);
              }}
              className="w-4 h-4"
            />
            <label htmlFor={`filter-${filterType}`} className="font-medium capitalize">
              Replace {filterType} filter
            </label>
          </div>

          {serviceData.newFilters?.[index]?.replace && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
              <div>
                <label className="block text-sm font-medium mb-1">Brand</label>
                <input
                  type="text"
                  value={serviceData.newFilters?.[index]?.brand || ''}
                  onChange={(e) => updateFilter(index, 'brand', e.target.value)}
                  className="w-full p-2 border rounded-md text-black"
                  placeholder="Filter brand"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Part Number</label>
                <input
                  type="text"
                  value={serviceData.newFilters?.[index]?.partNumber || ''}
                  onChange={(e) => updateFilter(index, 'partNumber', e.target.value)}
                  className="w-full p-2 border rounded-md text-black"
                  placeholder="Part number"
                />
              </div>
            </div>
          )}
        </div>
      ))}
      
      <div className="text-sm text-blue-700 bg-blue-100 p-3 rounded">
        <p><strong>Note:</strong> Replacing filters will reset the hour counter for tracking. The new installation time will be recorded based on the current machine hours.</p>
      </div>
    </div>
  );
};

// Helper function to generate filter options
const generateFilterOptions = () => {
  return [
    { type: 'air', replace: false, brand: '', partNumber: '' },
    { type: 'carbon', replace: false, brand: '', partNumber: '' }
  ];
};

// Component for RUC renewal form
const RUCRenewalForm = ({ serviceData, setServiceData }) => {
  const updateRUCData = (field, value) => {
    setServiceData(prev => ({
      ...prev,
      rucRenewal: {
        ...prev.rucRenewal,
        [field]: value
      }
    }));
  };

  // Calculate next due KM automatically when current KM or purchased KM changes
  // Removed auto-calculation since user will input the final KM from the RUC label
  
  return (
    <div className="space-y-4 bg-green-50 p-4 rounded-lg border border-green-200">
      <h4 className="font-semibold text-green-800 flex items-center gap-2">
        <span>🛣️</span>
        RUC Renewal Details
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-green-700 mb-1">
            Current Kilometers
          </label>
          <input
            type="number"
            value={serviceData.rucRenewal?.currentKm || ''}
            onChange={(e) => updateRUCData('currentKm', e.target.value)}
            className="w-full p-2 border rounded-md text-black"
            placeholder="Vehicle's current km"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-green-700 mb-1">
            Next Due KM
          </label>
          <input
            type="number"
            value={serviceData.rucRenewal?.nextDueKm || ''}
            onChange={(e) => updateRUCData('nextDueKm', e.target.value)}
            className="w-full p-2 border rounded-md text-black"
            placeholder="KM limit from RUC label"
            required
          />
        </div>
      </div>
      
      <div className="text-sm text-green-700 bg-green-100 p-3 rounded">
        <p><strong>How it works:</strong> Enter your vehicle&apos;s current kilometers and the final kilometer limit shown on your RUC purchase label.</p>
      </div>
    </div>
  );
};

// Component for REGO renewal form  
const REGORenewalForm = ({ serviceData, setServiceData }) => {
  const updateREGOData = (field, value) => {
    setServiceData(prev => ({
      ...prev,
      regoRenewal: {
        ...prev.regoRenewal,
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
      <h4 className="font-semibold text-blue-800 flex items-center gap-2">
        <span>📋</span>
        REGO Renewal Details
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-blue-700 mb-1">
            New REGO Expiry Date
          </label>
          <input
            type="date"
            value={serviceData.regoRenewal?.expiryDate || ''}
            onChange={(e) => updateREGOData('expiryDate', e.target.value)}
            className="w-full p-2 border rounded-md text-black"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-blue-700 mb-1">
            Current Kilometers
          </label>
          <input
            type="number"
            value={serviceData.regoRenewal?.currentKm || ''}
            onChange={(e) => updateREGOData('currentKm', e.target.value)}
            className="w-full p-2 border rounded-md text-black"
            placeholder="Current km when renewing"
            required
          />
        </div>
      </div>
      
      <div className="text-sm text-blue-700 bg-blue-100 p-3 rounded">
        <p><strong>Note:</strong> This will update the vehicle&apos;s registration information with the new expiry date and current kilometers.</p>
      </div>
    </div>
  );
};

const ServiceFormComponent = ({ 
  machineId, 
  machine, 
  serviceData: initialServiceData, 
  setServiceData: externalSetServiceData,
  onSubmit: externalSubmit,
  onSubmitSuccess,
  resetOnSubmit,
  equipmentType
}) => {
  // Determine if this is a vehicle or machinery
  const isVehicle = equipmentType === 'vehicle' || machine?.equipmentType === 'vehicle';
  
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });
  
  // Estado inicial con fecha por defecto
  const todayDate = new Date().toISOString().split('T')[0];
  
  // Estado interno con valores por defecto para prevenir errores de controlado/no controlado
  const [internalServiceData, setInternalServiceData] = useState({
    maquinaId: machineId || '',
    tipoService: '',
    horasActuales: '',
    kilometersActuales: '', // For vehicles
    horasProximoService: '',
    kilometersProximoService: '', // For vehicles
    tecnico: '',
    trabajosRealizados: [], // Volver a array para múltiples selecciones
    trabajoPersonalizado: '', // Nuevo campo para trabajo custom
    repuestos: '',
    observaciones: '',
    fecha: todayDate, // Asignamos fecha predeterminada
    costo: '',
    equipmentType: equipmentType || 'machinery',
    // Chemical filters replacement data
    chemicalFiltersReplaced: false,
    newFilters: [],
    // RUC renewal data
    rucRenewal: {
      currentKm: '',
      nextDueKm: ''
    },
    // REGO renewal data
    regoRenewal: {
      expiryDate: '',
      currentKm: ''
    }
  });

  // Usar los datos externos si se proporcionan, o los internos si no
  const serviceData = initialServiceData || internalServiceData;
  const setServiceData = externalSetServiceData || setInternalServiceData;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Log para depuración
    console.log(`Changing ${name} to ${type === 'checkbox' ? checked : value}`);
    
    // Actualizar el estado usando la función setServiceData que se eligió antes
    setServiceData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      console.log('New service data:', newData);
      return newData;
    });
  };

  const handleTrabajoChange = (e) => {
    const selectedValue = e.target.value;
    if (selectedValue && !serviceData.trabajosRealizados.includes(selectedValue)) {
      setServiceData(prev => {
        const newData = {
          ...prev,
          trabajosRealizados: [...prev.trabajosRealizados, selectedValue]
        };
        
        // Initialize renewal data with current kilometers when RUC or REGO is selected
        if (selectedValue === '13' && !newData.rucRenewal?.currentKm) {
          newData.rucRenewal = {
            ...newData.rucRenewal,
            currentKm: prev.kilometersActuales || '',
            nextDueKm: ''
          };
        }
        
        if (selectedValue === '14' && !newData.regoRenewal?.currentKm) {
          newData.regoRenewal = {
            ...newData.regoRenewal,
            currentKm: prev.kilometersActuales || ''
          };
        }
        
        return newData;
      });
    }
    // Reset select to default option
    e.target.value = '';
  };

  const removeTrabajoTag = (trabajoToRemove) => {
    setServiceData(prev => {
      const newData = {
        ...prev,
        trabajosRealizados: prev.trabajosRealizados.filter(trabajo => trabajo !== trabajoToRemove),
      };
      
      // Si se remueve "Custom", también limpiar el campo personalizado
      if (trabajoToRemove === '12') {
        newData.trabajoPersonalizado = '';
      }
      
      // Si se remueve "Renew RUC", limpiar datos de RUC
      if (trabajoToRemove === '13') {
        newData.rucRenewal = {
          currentKm: '',
          nextDueKm: ''
        };
      }
      
      // Si se remueve "Renew REGO", limpiar datos de REGO
      if (trabajoToRemove === '14') {
        newData.regoRenewal = {
          expiryDate: '',
          currentKm: ''
        };
      }
      
      return newData;
    });
  };

  // Resto del componente igual, pero con verificación para machine
  useEffect(() => {
    // If machine is already provided, use it
    if (machine) {
      console.log('Using provided machine:', machine);
      
      // Update the serviceData with the machine's data
      setServiceData(prev => ({
        ...prev,
        machineId: machineId, // Keep the MongoDB ID for database reference
        customMachineId: machine.machineId || machine.customId, // Save the custom ID
        horasActuales: isVehicle ? "" : (machine.currentHours || machine.horasActuales || ""),
        kilometersActuales: isVehicle ? (machine.currentKilometers || machine.kilometersActuales || "") : "",
        horasProximoService: isVehicle ? "" : (machine.nextService || 
          (machine.currentHours ? parseInt(machine.currentHours) + 100 : "") ||
          (machine.horasActuales ? parseInt(machine.horasActuales) + 100 : "")),
        kilometersProximoService: isVehicle ? (machine.nextServiceKm || 
          (machine.currentKilometers ? parseInt(machine.currentKilometers) + 5000 : "") ||
          (machine.kilometersActuales ? parseInt(machine.kilometersActuales) + 5000 : "")) : "",
        equipmentType: isVehicle ? 'vehicle' : 'machinery'
      }));
      setLoading(false);
      return;
    }
    
    // If no machine is provided, fetch it
    const fetchMachine = async () => {
      if (!machineId) return;
      
      try {
        console.log('Fetching machine data with ID:', machineId);
        setLoading(true);
        
        const response = await fetch(`/api/machines/${machineId}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching machine: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Machine data received:', data);
        
        // Update serviceData with both IDs
        setServiceData(prev => ({
          ...prev,
          machineId: machineId, // MongoDB ID
          customMachineId: data.machineId || data.customId, // Custom ID
          horasActuales: isVehicle ? "" : (data.currentHours || data.horasActuales || ""),
          kilometersActuales: isVehicle ? (data.currentKilometers || data.kilometersActuales || "") : "",
          horasProximoService: isVehicle ? "" : (data.nextService || 
            (data.currentHours ? parseInt(data.currentHours) + 100 : "") ||
            (data.horasActuales ? parseInt(data.horasActuales) + 100 : "")),
          kilometersProximoService: isVehicle ? (data.nextServiceKm || 
            (data.currentKilometers ? parseInt(data.currentKilometers) + 5000 : "") ||
            (data.kilometersActuales ? parseInt(data.kilometersActuales) + 5000 : "")) : "",
          equipmentType: isVehicle ? 'vehicle' : 'machinery'
        }));
        
      } catch (error) {
        console.error('Error fetching machine:', error);
        setError('Error loading machine data: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (!machine && machineId) {
      fetchMachine();
    } else {
      setLoading(false);
    }
  }, [machineId, machine, setServiceData]);

  // Function to show notifications
  const showNotification = (message, type = 'success') => {
    setNotification({
      show: true,
      message,
      type
    });
    
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  // Modify the handleSubmit function to include better error handling
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!machineId) {
      setError('No machine ID provided');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[ServiceFormComponent] Starting submission with machineId:', machineId);
      
      // Validar que se haya seleccionado al menos un trabajo
      if (!Array.isArray(serviceData.trabajosRealizados) || serviceData.trabajosRealizados.length === 0) {
        setError('Please select at least one work item');
        setLoading(false);
        return;
      }
      
      // Validar datos de renovación RUC si está seleccionado
      if (serviceData.trabajosRealizados.includes('13')) {
        if (!serviceData.rucRenewal?.currentKm || !serviceData.rucRenewal?.nextDueKm) {
          setError('Please complete all required RUC renewal information (current km and next due km)');
          setLoading(false);
          return;
        }
      }
      
      // Validar datos de renovación REGO si está seleccionado
      if (serviceData.trabajosRealizados.includes('14')) {
        if (!serviceData.regoRenewal?.expiryDate || !serviceData.regoRenewal?.currentKm) {
          setError('Please complete all required REGO renewal information (expiry date and current kilometers)');
          setLoading(false);
          return;
        }
      }
      
      // Convert work IDs to descriptions including custom work
      const trabajosArray = Array.isArray(serviceData.trabajosRealizados) 
        ? serviceData.trabajosRealizados 
        : [];
        
      const trabajosRealizadosTexto = trabajosArray.map(id => {
        if (id === '12') { // Custom option
          return serviceData.trabajoPersonalizado || '';
        } else {
          const trabajoEncontrado = trabajosPredefinidos.find(t => t.id === parseInt(id));
          return trabajoEncontrado ? trabajoEncontrado.descripcion : '';
        }
      }).filter(desc => desc !== '');
      
      // Ensure numeric values are properly parsed based on equipment type
      let horasActuales = 0;
      let kilometersActuales = 0;
      let horasProximoService = 0;
      let kilometersProximoService = 0;
      
      if (isVehicle) {
        // For vehicles, use kilometers
        if (serviceData.kilometersActuales !== null && serviceData.kilometersActuales !== undefined && serviceData.kilometersActuales !== '') {
          kilometersActuales = parseInt(serviceData.kilometersActuales, 10);
        }
        if (serviceData.kilometersProximoService !== null && serviceData.kilometersProximoService !== undefined && serviceData.kilometersProximoService !== '') {
          kilometersProximoService = parseInt(serviceData.kilometersProximoService, 10);
        }
      } else {
        // For machinery, use hours
        if (serviceData.horasActuales !== null && serviceData.horasActuales !== undefined && serviceData.horasActuales !== '') {
          horasActuales = parseInt(serviceData.horasActuales, 10);
        }
        if (serviceData.horasProximoService !== null && serviceData.horasProximoService !== undefined && serviceData.horasProximoService !== '') {
          horasProximoService = parseInt(serviceData.horasProximoService, 10);
        }
      }
      
      let costo = serviceData.costo;
      if (costo !== null && costo !== undefined && costo !== '') {
        costo = parseFloat(costo);
      } else {
        costo = 0;
      }

      // Determine if we're in public mode with multiple checks
      const determineIfPublic = () => {
        // Check 1: URL parameter check
        if (window.location.search.includes('public=true')) {
          console.log('[ServiceFormComponent] Public mode detected via URL parameter');
          return true;
        }
        
        // Check 2: URL path check (if accessed via /service/ route)
        if (window.location.pathname.includes('/service/')) {
          console.log('[ServiceFormComponent] Public mode detected via service path');
          return true;
        }
        
        // Check 3: No authenticated session check
        if (!session || !session.user) {
          console.log('[ServiceFormComponent] Public mode detected via missing session');
          return true;
        }
        
        console.log('[ServiceFormComponent] Using authenticated mode');
        return false;
      };

      const isPublic = determineIfPublic();

      // Build the submission data object
      const dataToSubmit = {
        machineId: machineId, // Keep the MongoDB ID for lookups
        customMachineId: serviceData.customMachineId || machine?.machineId || '', // Include custom ID
        fecha: serviceData.fecha ? new Date(serviceData.fecha).toISOString() : new Date().toISOString(),
        tipo: 'service',
        equipmentType: isVehicle ? 'vehicle' : 'machinery',
        datos: {
          machineId: machineId,
          customMachineId: serviceData.customMachineId || machine?.machineId || '', // Also in datos
          tipoService: serviceData.tipoService || '',
          horasActuales: horasActuales,
          kilometersActuales: kilometersActuales,
          horasProximoService: horasProximoService,
          kilometersProximoService: kilometersProximoService,
          tecnico: serviceData.tecnico || '',
          trabajosRealizados: trabajosRealizadosTexto,
          repuestos: serviceData.repuestos || '',
          observaciones: serviceData.observaciones || '',
          costo: costo,
          equipmentType: isVehicle ? 'vehicle' : 'machinery',
          maquina: machine?.model || machine?.marca || machine?.brand || '',
          // Include renewal data if applicable
          rucRenewal: serviceData.trabajosRealizados?.includes('13') ? serviceData.rucRenewal : undefined,
          regoRenewal: serviceData.trabajosRealizados?.includes('14') ? serviceData.regoRenewal : undefined
        },
        source: isPublic ? 'public' : 'system',
        status: 'Completado'
      };

      console.log('[ServiceFormComponent] Mode:', isPublic ? 'PUBLIC' : 'AUTHENTICATED');
      console.log('[ServiceFormComponent] Submitting service data:', JSON.stringify(dataToSubmit, null, 2));

      // Always include public=true if in public mode
      const apiUrl = isPublic 
        ? `/api/services?public=true&_t=${Date.now()}` 
        : `/api/services?_t=${Date.now()}`;

      console.log(`[ServiceFormComponent] Using API URL: ${apiUrl}`);
      
      // Make the API request
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(dataToSubmit),
      });

      console.log(`[ServiceFormComponent] Response status: ${response.status}`);
      
      // Get the response text first for debugging
      const responseText = await response.text();
      console.log(`[ServiceFormComponent] Response text: ${responseText}`);
      
      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // Not JSON, use text as is
        }
        
        throw new Error(errorMessage);
      }
      
      // Parse response as JSON if possible
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { success: true };
      }
      
      console.log('[ServiceFormComponent] Service saved successfully:', responseData);
      
      // Handle vehicle updates for RUC and REGO renewals
      if (isVehicle) {
        console.log('[ServiceFormComponent] Processing vehicle updates...');
        
        try {
          const vehicleUpdates = {};
          
          // Handle RUC renewal
          if (serviceData.trabajosRealizados?.includes('13') && serviceData.rucRenewal?.currentKm && serviceData.rucRenewal?.nextDueKm) {
            vehicleUpdates.ruc = {
              currentKm: parseInt(serviceData.rucRenewal.currentKm) || 0,
              nextDueKm: parseInt(serviceData.rucRenewal.nextDueKm) || 0,
              kmInterval: (parseInt(serviceData.rucRenewal.nextDueKm) || 0) - (parseInt(serviceData.rucRenewal.currentKm) || 0),
              lastPaidDate: new Date().toISOString().split('T')[0], // Today's date
              isActive: true
            };
            console.log('[ServiceFormComponent] RUC renewal data:', vehicleUpdates.ruc);
          }
          
          // Handle REGO renewal
          if (serviceData.trabajosRealizados?.includes('14') && serviceData.regoRenewal?.expiryDate) {
            vehicleUpdates.rego = {
              expiryDate: serviceData.regoRenewal.expiryDate,
              lastRenewalKm: parseInt(serviceData.regoRenewal.currentKm) || 0,
              lastRenewalDate: new Date().toISOString().split('T')[0], // Today's date
              isActive: true
            };
            console.log('[ServiceFormComponent] REGO renewal data:', vehicleUpdates.rego);
          }
          
          // Always update vehicle service information for all vehicle services
          vehicleUpdates.lastService = new Date().toISOString().split('T')[0]; // Fecha de hoy
          
          // Calcular próximo servicio basado en kilómetros actuales + intervalo estándar
          if (serviceData.kilometersProximoService) {
            vehicleUpdates.nextService = serviceData.kilometersProximoService;
          }
          
          // Actualizar kilómetros actuales si se proporcionaron
          if (serviceData.kilometersActuales) {
            vehicleUpdates.currentKilometers = parseInt(serviceData.kilometersActuales);
          }
          
          // Update the vehicle with service information (and renewal data if applicable)
          const vehicleUpdateEndpoint = isPublic 
            ? `/api/vehicles/${machineId}?public=true` 
            : `/api/vehicles/${machineId}`;
          
          console.log(`[ServiceFormComponent] Updating vehicle at: ${vehicleUpdateEndpoint}`);
          console.log(`[ServiceFormComponent] Vehicle update data:`, vehicleUpdates);
          
          const vehicleResponse = await fetch(vehicleUpdateEndpoint, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(vehicleUpdates),
          });
          
          if (vehicleResponse.ok) {
            const vehicleResult = await vehicleResponse.text();
            console.log('[ServiceFormComponent] Vehicle updated successfully:', vehicleResult);
          } else {
            console.error('[ServiceFormComponent] Failed to update vehicle:', vehicleResponse.status);
            // Don't throw error here as the service was already saved successfully
          }
        } catch (vehicleError) {
          console.error('[ServiceFormComponent] Error updating vehicle for renewals:', vehicleError);
          // Don't throw error here as the service was already saved successfully
        }
      }
      
      // Get custom machine ID for display
      const customMachineId = serviceData.customMachineId || machine?.machineId || machine?.customId || machineId;
      
      // Create success message with renewal information
      let successMessage = 'Service record saved successfully!';
      if (serviceData.trabajosRealizados?.includes('13') || serviceData.trabajosRealizados?.includes('14')) {
        const renewalTypes = [];
        if (serviceData.trabajosRealizados?.includes('13')) renewalTypes.push('RUC');
        if (serviceData.trabajosRealizados?.includes('14')) renewalTypes.push('REGO');
        successMessage = `Service record saved and ${renewalTypes.join(' and ')} renewal completed successfully!`;
      }
      
      // Redirect immediately to success page with custom machine ID
      router.push(`/thanks?type=service&message=${encodeURIComponent(successMessage)}&machineId=${encodeURIComponent(customMachineId)}`);
      
      // Reset form if needed
      if (resetOnSubmit) {
        setServiceData({
          tipoService: '',
          horasActuales: '',
          kilometersActuales: '',
          horasProximoService: '',
          kilometersProximoService: '',
          tecnico: '',
          trabajosRealizados: [],
          trabajoPersonalizado: '',
          repuestos: '',
          observaciones: '',
          costo: '',
          equipmentType: isVehicle ? 'vehicle' : 'machinery',
          fecha: todayDate
        });
      }
    } catch (err) {
      console.error('[ServiceFormComponent] Error submitting service:', err);
      setError(err.message || 'Error saving service record');
      showNotification(err.message || 'Error saving service record', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loader mientras se cargan los datos
  if (loading && !machine) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Notification Component */}
      {notification.show && (
        <Notification
          message={notification.message}
          type={notification.type}
          show={notification.show}
          onClose={() => setNotification(prev => ({ ...prev, show: false }))}
        />
      )}
      
      <div className="max-w-4xl mx-auto p-4">
      {/* Se eliminó el encabezado con el logo y la información de la máquina */}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-1 text-black">
              Service Type
            </label>
            <select
              name="tipoService"
              value={serviceData.tipoService || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded-md text-black"
              required
            >
              <option value="">Select type...</option>
              <option value="preventivo">Preventive</option>
              <option value="correctivo">Corrective</option>
              <option value="revision">General Review</option>
            </select>
          </div>

          {isVehicle ? (
            <>
              <div>
                <label className="block mb-1 text-black">
                  Current Kilometers
                </label>
                <input
                  type="number"
                  name="kilometersActuales"
                  value={serviceData.kilometersActuales || ''}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md text-black"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 text-black">
                  Next Service Kilometers
                </label>
                <input
                  type="number"
                  name="kilometersProximoService"
                  value={serviceData.kilometersProximoService || ''}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md text-black"
                  required
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block mb-1 text-black">
                  Current Hours
                </label>
                <input
                  type="number"
                  name="horasActuales"
                  value={serviceData.horasActuales || ''}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md text-black"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 text-black">
                  Next Service Hours
                </label>
                <input
                  type="number"
                  name="horasProximoService"
                  value={serviceData.horasProximoService || ''}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md text-black"
                  required
                />
              </div>
            </>
          )}

          <div>
            <label className="block mb-1 text-black">
              Date
            </label>
            <input
              type="date"
              name="fecha"
              value={serviceData.fecha || todayDate}
              onChange={handleChange}
              className="w-full p-2 border rounded-md text-black"
            />
          </div>

          <div>
            <label className="block mb-1 text-black">
              Technician
            </label>
            <input
              type="text"
              name="tecnico"
              value={serviceData.tecnico || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded-md text-black"
              placeholder="Enter technician name..."
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-black">
              Work Performed
            </label>
            <div className="space-y-2">
              {/* Dropdown para seleccionar */}
              <select
                onChange={handleTrabajoChange}
                className="w-full p-2 border rounded-md text-black"
                defaultValue=""
              >
                <option value="" disabled>Select work to add...</option>
                {trabajosPredefinidos
                  .filter(trabajo => {
                    // For vehicles, show all options including RUC and REGO
                    // For machinery, exclude RUC and REGO options (ids 13 and 14)
                    if (!isVehicle && (trabajo.id === 13 || trabajo.id === 14)) {
                      return false;
                    }
                    return !serviceData.trabajosRealizados.includes(trabajo.id.toString());
                  })
                  .map(trabajo => (
                    <option key={trabajo.id} value={trabajo.id}>
                      {trabajo.descripcion}
                    </option>
                  ))}
              </select>
              
              {/* Tags de trabajos seleccionados */}
              {Array.isArray(serviceData.trabajosRealizados) && 
               serviceData.trabajosRealizados.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-gray-50 min-h-[2.5rem]">
                  {serviceData.trabajosRealizados.map(trabajoId => {
                    const trabajo = trabajosPredefinidos.find(t => t.id.toString() === trabajoId);
                    const displayText = trabajoId === '12' 
                      ? (serviceData.trabajoPersonalizado || 'Custom') 
                      : trabajo?.descripcion || trabajoId;
                    
                    return (
                      <span
                        key={trabajoId}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md border border-blue-200"
                      >
                        {displayText}
                        <button
                          type="button"
                          onClick={() => removeTrabajoTag(trabajoId)}
                          className="text-blue-600 hover:text-blue-800 font-bold text-xs ml-1"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              
              {/* Mensaje si no hay trabajos seleccionados */}
              {Array.isArray(serviceData.trabajosRealizados) && 
               serviceData.trabajosRealizados.length === 0 && (
                <div className="p-2 border rounded-md bg-gray-50 text-gray-500 text-sm min-h-[2.5rem] flex items-center">
                  No work selected yet. Use the dropdown above to add work items.
                </div>
              )}
            </div>
            
            {/* Campo personalizado que aparece cuando se selecciona "Custom" */}
            {Array.isArray(serviceData.trabajosRealizados) && 
             serviceData.trabajosRealizados.includes('12') && (
              <div className="mt-2">
                <label className="block mb-1 text-black text-sm">
                  Custom Work Description
                </label>
                <input
                  type="text"
                  name="trabajoPersonalizado"
                  value={serviceData.trabajoPersonalizado || ''}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md text-black"
                  placeholder="Describe the custom work performed..."
                  required
                />
              </div>
            )}
          </div>

          <div>
            <label className="block mb-1 text-black">
              Parts Used
            </label>
            <textarea
              name="repuestos"
              value={serviceData.repuestos || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded-md text-black"
              rows={2}
              placeholder="List the parts used..."
            />
          </div>

          <div>
            <label className="block mb-1 text-black">
              Observations
            </label>
            <textarea
              name="observaciones"
              value={serviceData.observaciones || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded-md text-black"
              rows={3}
              placeholder="Enter your observations here..."
            />
          </div>

          <div>
            <label className="block mb-1 text-black">
              Cost
            </label>
            <input
              type="number"
              name="costo"
              value={serviceData.costo || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded-md text-black"
              placeholder="Enter cost (optional)"
            />
          </div>
        </div>

        {/* Chemical Filters Section */}
        {machine?.chemicalFilters?.hasFilters && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>🔬</span>
              Chemical Filters Replacement
            </h3>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="chemicalFiltersReplaced"
                  checked={serviceData.chemicalFiltersReplaced || false}
                  onChange={(e) => {
                    setServiceData(prev => ({
                      ...prev,
                      chemicalFiltersReplaced: e.target.checked,
                      newFilters: e.target.checked ? generateFilterOptions() : []
                    }));
                  }}
                  className="w-4 h-4"
                />
                <label htmlFor="chemicalFiltersReplaced" className="font-medium text-gray-700">
                  Replace chemical filters during this service
                </label>
              </div>

              {serviceData.chemicalFiltersReplaced && (
                <ChemicalFilterReplacementForm
                  machine={machine}
                  serviceData={serviceData}
                  setServiceData={setServiceData}
                />
              )}
            </div>
          </div>
        )}

        {/* Vehicle Renewals Section - Only show for vehicles */}
        {isVehicle && (
          <div className="border-t pt-6 space-y-6">
            {/* RUC Renewal Section */}
            {(serviceData.trabajosRealizados?.includes('13')) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span>🛣️</span>
                  RUC Renewal Information
                </h3>
                <RUCRenewalForm 
                  serviceData={serviceData}
                  setServiceData={setServiceData}
                />
              </div>
            )}

            {/* REGO Renewal Section */}
            {(serviceData.trabajosRealizados?.includes('14')) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span>📋</span>
                  REGO Renewal Information
                </h3>
                <REGORenewalForm 
                  serviceData={serviceData}
                  setServiceData={setServiceData}
                />
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 bg-blue-600 text-white rounded-md ${
              loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
          >
            {loading ? 'Saving...' : 'Save Service'}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};

export default ServiceFormComponent;